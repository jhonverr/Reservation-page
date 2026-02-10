# Supabase 데이터베이스 스키마 백업 및 마이그레이션 스크립트

## 📌 개요

이 문서는 현재 Supabase 프로젝트의 데이터베이스 스키마를 확인하고, 새 프로젝트로 마이그레이션하기 위한 SQL 스크립트를 제공합니다.

---

## 1️⃣ 현재 스키마 확인하기

### Supabase Dashboard에서 실행

**SQL Editor로 이동** → 새 쿼리 생성 → 아래 SQL 실행

### 모든 테이블 목록 조회

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 테이블 구조 상세 조회

```sql
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 외래 키 제약조건 조회

```sql
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
```

### RLS (Row Level Security) 정책 조회

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 2️⃣ 예상 스키마 (템플릿)

> [!IMPORTANT]
> 아래는 예약 시스템의 일반적인 스키마입니다. 실제 스키마는 위 쿼리로 확인 후 수정하세요.

### 테이블 생성 SQL

```sql
-- ============================================
-- 1. performances 테이블 (공연 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  available_times TEXT[], -- 예약 가능한 시간대 목록
  max_capacity INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_performances_date ON performances(date);

-- ============================================
-- 2. reservations 테이블 (예약 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id UUID NOT NULL REFERENCES performances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  selected_time TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_reservations_performance_id ON reservations(performance_id);
CREATE INDEX idx_reservations_phone ON reservations(phone);

-- ============================================
-- 3. Row Level Security (RLS) 활성화
-- ============================================

-- performances 테이블 RLS 설정
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공연 조회 가능
CREATE POLICY "Anyone can view performances"
  ON performances
  FOR SELECT
  TO public
  USING (true);

-- 인증된 사용자만 공연 추가/수정/삭제 가능 (관리자용)
-- 참고: 현재 프로젝트는 클라이언트 측 비밀번호 인증 사용
-- 실제 운영 시 Supabase Auth 사용 권장
CREATE POLICY "Service role can manage performances"
  ON performances
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- reservations 테이블 RLS 설정
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 예약 조회 가능
CREATE POLICY "Anyone can view reservations"
  ON reservations
  FOR SELECT
  TO public
  USING (true);

-- 모든 사용자가 예약 생성 가능
CREATE POLICY "Anyone can create reservations"
  ON reservations
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 인증된 사용자만 예약 수정/삭제 가능 (관리자용)
CREATE POLICY "Authenticated users can update reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reservations"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 4. 자동 업데이트 트리거 (updated_at)
-- ============================================

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- performances 테이블에 트리거 적용
CREATE TRIGGER update_performances_updated_at
  BEFORE UPDATE ON performances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- reservations 테이블에 트리거 적용
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 3️⃣ 데이터 마이그레이션 (선택 사항)

### 현재 데이터 내보내기

#### Table Editor에서 CSV로 내보내기
1. Supabase Dashboard → Table Editor
2. 각 테이블 선택 → Export as CSV

#### SQL로 INSERT 문 생성

```sql
-- performances 테이블 데이터
SELECT 
  'INSERT INTO performances (id, title, description, date, available_times, created_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(title) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(date::text) || '::date, ' ||
  quote_literal(available_times::text) || '::text[], ' ||
  quote_literal(created_at::text) || '::timestamptz);'
FROM performances;

-- reservations 테이블 데이터
SELECT 
  'INSERT INTO reservations (id, performance_id, name, phone, selected_time, created_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(performance_id::text) || '::uuid, ' ||
  quote_literal(name) || ', ' ||
  quote_literal(phone) || ', ' ||
  quote_literal(selected_time) || ', ' ||
  quote_literal(created_at::text) || '::timestamptz);'
FROM reservations;
```

### 새 프로젝트에 데이터 가져오기

1. 위 쿼리로 생성된 INSERT 문 복사
2. 새 Supabase 프로젝트의 SQL Editor에서 실행

---

## 4️⃣ 마이그레이션 단계별 가이드

### Step 1: 현재 프로젝트 백업

```sql
-- 1. 모든 테이블 구조 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 2. 각 테이블의 데이터 건수 확인
SELECT 
  'performances' as table_name, 
  COUNT(*) as row_count 
FROM performances
UNION ALL
SELECT 
  'reservations', 
  COUNT(*) 
FROM reservations;
```

### Step 2: 새 프로젝트에 스키마 적용

1. 새 Supabase 프로젝트 생성
2. SQL Editor → New Query
3. 위 "테이블 생성 SQL" 전체 복사 → 실행

### Step 3: 데이터 마이그레이션 (필요시)

1. 현재 프로젝트에서 데이터 내보내기 SQL 실행
2. 결과를 새 프로젝트에서 실행

### Step 4: 검증

```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 데이터 이관 확인
SELECT COUNT(*) FROM performances;
SELECT COUNT(*) FROM reservations;

-- RLS 정책 확인
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

## 5️⃣ 문제 해결

### RLS로 인해 데이터 조회 안됨

**증상**: Table Editor에서 "No rows found" 표시

**해결**:
```sql
-- 임시로 RLS 비활성화 (개발 중에만 사용)
ALTER TABLE performances DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- 작업 완료 후 다시 활성화
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
```

### 외래 키 제약조건 오류

**증상**: `foreign key constraint` 에러

**해결**: 데이터 삽입 순서 변경
1. 먼저 `performances` 데이터 삽입
2. 그 다음 `reservations` 데이터 삽입

### UUID 생성 오류

**증상**: `extension "uuid-ossp" does not exist`

**해결**:
```sql
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 또는 gen_random_uuid() 사용 (PostgreSQL 13+)
-- 이미 스키마에 포함되어 있음
```

---

## 6️⃣ 보안 권장 사항

> [!WARNING]
> 현재 프로젝트는 클라이언트 측에서 관리자 비밀번호를 검증합니다. 프로덕션 환경에서는 Supabase Auth를 사용하는 것이 좋습니다.

### Supabase Auth로 업그레이드 (선택 사항)

```sql
-- 관리자 역할 확인 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 정책 업데이트
DROP POLICY IF EXISTS "Service role can manage performances" ON performances;

CREATE POLICY "Admins can manage performances"
  ON performances
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
```

---

## 📝 체크리스트

### 마이그레이션 전
- [ ] 현재 스키마 확인 SQL 실행
- [ ] 테이블 구조 문서화
- [ ] RLS 정책 확인
- [ ] 현재 데이터 건수 확인

### 마이그레이션 중
- [ ] 새 Supabase 프로젝트 생성
- [ ] 테이블 생성 SQL 실행
- [ ] RLS 정책 적용 확인
- [ ] 데이터 마이그레이션 (필요시)

### 마이그레이션 후
- [ ] 모든 테이블 생성 확인
- [ ] 데이터 건수 일치 확인
- [ ] RLS 정책 작동 확인
- [ ] 애플리케이션에서 테스트 예약 생성
- [ ] 관리 기능 테스트

---

> [!NOTE]
> 실제 마이그레이션 전에 반드시 현재 데이터베이스 구조를 확인하고 백업하세요!
