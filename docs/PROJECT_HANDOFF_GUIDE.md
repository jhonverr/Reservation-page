# 프로젝트 이관 가이드

## 📋 목차
1. [프로젝트 개요](#-프로젝트-개요)
2. [기술 스택](#-기술-스택)
3. [이관 전 준비사항](#-이관-전-준비사항)
4. [소스코드 이관](#-소스코드-이관)
5. [Supabase 데이터베이스 이관](#-supabase-데이터베이스-이관)
6. [환경 변수 설정](#-환경-변수-설정)
7. [배포 방법](#-배포-방법)
8. [검증 및 테스트](#-검증-및-테스트)
9. [문제 해결](#-문제-해결)

---

## 📌 프로젝트 개요

이 프로젝트는 **예약 시스템 웹 애플리케이션**입니다. 사용자는 공연 일정을 확인하고 예약할 수 있으며, 관리자는 공연 생성, 수정, 삭제 및 예약 현황을 관리할 수 있습니다.

### 주요 기능
- 🎭 공연 일정 조회
- 📅 공연 예약 (이름, 전화번호, 시간 선택)
- 🔐 관리자 로그인
- ⚙️ 관리자 페이지 (공연 생성/수정/삭제, 예약 현황 관리)

---

## 🛠 기술 스택

### Frontend
- **React** ^19.2.0
- **Vite** ^7.2.4
- **React Router** ^7.13.0

### Backend / Database
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL 데이터베이스
  - 실시간 데이터베이스
  - 인증 및 스토리지

### 배포 권장 플랫폼
- **Vercel** (추천)
- **Netlify**
- **GitHub Pages** (정적 호스팅)

---

## ✅ 이관 전 준비사항

### 1. 새 담당자가 준비해야 할 것

- [ ] GitHub 계정
- [ ] Supabase 계정 (https://supabase.com)
- [ ] Node.js 설치 (v18 이상 권장)
- [ ] Git 설치
- [ ] 코드 에디터 (VS Code 권장)

### 2. 현재 담당자가 준비해야 할 것

- [ ] Supabase 프로젝트 관리자 권한 확인
- [ ] 데이터베이스 스키마 백업
- [ ] 현재 데이터 백업 (선택 사항)
- [ ] 환경 변수 정보 전달 준비

---

## 💾 소스코드 이관

### 방법 1: GitHub를 통한 이관 (권장)

#### 현재 담당자가 해야 할 일:

1. **GitHub 저장소 확인**
   ```bash
   cd c:\Users\chaka\Documents\Projects\Reservation-page
   git remote -v
   ```

2. **저장소가 없다면 GitHub에 새 저장소 생성 후 푸시**
   ```bash
   # GitHub에서 새 저장소 생성 (예: username/reservation-page)
   git init
   git add .
   git commit -m "Initial commit for project handoff"
   git branch -M main
   git remote add origin https://github.com/username/reservation-page.git
   git push -u origin main
   ```

3. **새 담당자를 협업자로 추가**
   - GitHub 저장소 → Settings → Collaborators → Add people

4. **저장소 소유권 이전 (선택 사항)**
   - GitHub 저장소 → Settings → Transfer ownership

#### 새 담당자가 해야 할 일:

1. **저장소 클론**
   ```bash
   git clone https://github.com/username/reservation-page.git
   cd reservation-page
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

### 방법 2: 직접 파일 전달

1. 프로젝트 폴더 압축 (`.git`, `node_modules`, `dist` 폴더 제외)
2. 압축 파일 전달
3. 새 담당자가 압축 해제 후 의존성 설치
   ```bash
   npm install
   ```

---

## 🗄️ Supabase 데이터베이스 이관

### 옵션 A: 프로젝트 소유권 이전 (권장)

#### 현재 담당자:

1. **Supabase Dashboard 접속**
   - https://app.supabase.com
   
2. **프로젝트 설정으로 이동**
   - 프로젝트 선택: `gnzgnxfsqdysvuircznr`
   - Settings → General

3. **팀원 초대**
   - Organization Settings → Members → Invite member
   - 새 담당자 이메일 입력
   - Role: Owner 선택

4. **프로젝트 소유권 이전**
   - Settings → Transfer project
   - 새 담당자에게 소유권 이전

#### 새 담당자:

1. 초대 이메일 확인 및 수락
2. Supabase Dashboard에서 프로젝트 접근 확인

### 옵션 B: 새 프로젝트 생성 및 데이터 마이그레이션

#### 현재 담당자:

1. **데이터베이스 스키마 백업**
   - Supabase Dashboard → SQL Editor
   - 아래 SQL 실행하여 스키마 확인:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **테이블 구조 및 데이터 내보내기**
   - Settings → Database → Connection pooling
   - Database URL 복사
   - `pg_dump` 도구 사용 (또는 Supabase Studio에서 수동 백업)

3. **스키마 SQL 파일 생성** (아래 참조)

#### 새 담당자:

1. **새 Supabase 프로젝트 생성**
   - https://app.supabase.com → New Project
   - 프로젝트 이름, 데이터베이스 비밀번호, 리전 설정

2. **스키마 가져오기**
   - SQL Editor에서 제공된 스키마 SQL 실행

3. **데이터 가져오기** (필요시)
   - Table Editor에서 CSV import 또는 SQL INSERT 실행

### 📄 데이터베이스 스키마 (예상)

> [!IMPORTANT]
> 실제 스키마는 Supabase Dashboard의 Table Editor에서 확인하세요.

예상 테이블 구조:

```sql
-- performances 테이블 (공연 정보)
CREATE TABLE performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  times TEXT[], -- 가능한 시간대 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reservations 테이블 (예약 정보)
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_id UUID REFERENCES performances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) 설정
ALTER TABLE performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "Anyone can view performances"
  ON performances FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view reservations"
  ON reservations FOR SELECT
  TO public
  USING (true);

-- 공개 삽입 정책 (예약 생성)
CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  TO public
  WITH CHECK (true);
```

> [!NOTE]
> 현재 프로젝트의 정확한 스키마를 얻으려면 Supabase Dashboard → SQL Editor에서 다음 쿼리를 실행하세요:
> ```sql
> SELECT 
>   table_name,
>   column_name,
>   data_type,
>   is_nullable
> FROM information_schema.columns
> WHERE table_schema = 'public'
> ORDER BY table_name, ordinal_position;
> ```

---

## 🔐 환경 변수 설정

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일 생성:

```bash
cp .env.example .env
```

### 2. Supabase 정보 입력

`.env` 파일을 열고 다음 값을 입력:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-admin-password
```

### 3. Supabase 정보 확인 방법

**새 담당자:**

1. Supabase Dashboard 접속
2. 프로젝트 선택
3. Settings → API
4. 다음 정보 복사:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys** → `anon` `public` → `VITE_SUPABASE_ANON_KEY`

### 4. 관리자 비밀번호 설정

`VITE_ADMIN_PASSWORD`는 원하는 비밀번호로 설정하세요.

> [!WARNING]
> `.env` 파일은 절대 Git에 커밋하지 마세요! `.gitignore`에 포함되어 있는지 확인하세요.

---

## 🚀 배포 방법

### Vercel을 통한 배포 (권장)

#### 1. Vercel 계정 생성
- https://vercel.com 접속
- GitHub 계정으로 로그인

#### 2. 프로젝트 임포트
1. **New Project** 클릭
2. GitHub 저장소 선택
3. **Import** 클릭

#### 3. 환경 변수 설정
- **Environment Variables** 섹션에서 다음 추가:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_PASSWORD`

#### 4. 배포 설정
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 5. 배포 시작
- **Deploy** 버튼 클릭
- 배포 완료 후 URL 확인 (예: `https://your-project.vercel.app`)

### Netlify를 통한 배포

#### 1. Netlify 계정 생성
- https://netlify.com 접속
- GitHub 계정으로 로그인

#### 2. 프로젝트 배포
1. **Add new site** → **Import an existing project**
2. GitHub 저장소 선택
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. 환경 변수 추가 (Vercel과 동일)
5. **Deploy site** 클릭

### 수동 빌드 및 배포

로컬에서 빌드하여 정적 호스팅 서비스에 업로드:

```bash
# 빌드
npm run build

# dist 폴더가 생성됨 → 이 폴더를 호스팅 서비스에 업로드
```

---

## ✅ 검증 및 테스트

### 1. 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 2. 기능 검증 체크리스트

#### 사용자 페이지
- [ ] 홈페이지 로딩 확인
- [ ] 공연 목록 표시 확인
- [ ] 예약 폼 동작 확인 (이름, 전화번호, 시간 입력)
- [ ] 예약 제출 후 성공 메시지 확인

#### 관리자 페이지
- [ ] `/admin` 경로로 로그인 페이지 접속
- [ ] 관리자 비밀번호로 로그인
- [ ] 대시보드 접근 확인
- [ ] 공연 생성 기능 테스트
- [ ] 공연 수정 기능 테스트
- [ ] 공연 삭제 기능 테스트
- [ ] 예약 현황 조회 확인

### 3. 데이터베이스 연결 확인

Supabase Dashboard → Table Editor에서:
- [ ] `performances` 테이블 확인
- [ ] `reservations` 테이블 확인
- [ ] 테스트 예약 후 데이터 저장 확인

### 4. 배포 후 검증

- [ ] 배포된 URL 접속 확인
- [ ] 프로덕션 환경에서 모든 기능 재검증
- [ ] HTTPS 연결 확인
- [ ] 모바일 반응형 확인

---

## 🔧 문제 해결

### 1. "Supabase client error" 발생 시

**원인**: 환경 변수가 올바르게 설정되지 않음

**해결**:
- `.env` 파일이 프로젝트 루트에 있는지 확인
- `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 정확한지 확인
- 개발 서버 재시작: `npm run dev`

### 2. 관리자 페이지 로그인 실패

**원인**: 관리자 비밀번호 불일치

**해결**:
- `.env` 파일의 `VITE_ADMIN_PASSWORD` 확인
- 로그인 시 정확한 비밀번호 입력

### 3. 빌드 오류 발생 시

**해결**:
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 삭제
npm cache clean --force
```

### 4. 데이터베이스 연결 안됨

**해결**:
- Supabase Dashboard에서 프로젝트가 활성 상태인지 확인
- API 키가 만료되지 않았는지 확인
- RLS (Row Level Security) 정책 확인

### 5. 배포 후 환경 변수 반영 안됨

**해결**:
- Vercel/Netlify 대시보드에서 환경 변수 재확인
- 재배포 트리거 (Redeploy)

---

## 📞 추가 지원

### 유용한 링크

- [React 문서](https://react.dev/)
- [Vite 문서](https://vitejs.dev/)
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)

### 이관 후 권장 사항

1. **보안 강화**
   - 관리자 비밀번호를 강력한 것으로 변경
   - Supabase RLS 정책 재검토

2. **모니터링 설정**
   - Vercel/Netlify 분석 활성화
   - Supabase 사용량 모니터링

3. **백업 계획**
   - 정기적인 데이터베이스 백업 설정
   - 코드 변경 사항은 항상 Git으로 관리

4. **문서화**
   - 커스텀 기능 추가 시 README 업데이트
   - 주요 변경 사항은 Git 커밋 메시지에 기록

---

## 📝 이관 체크리스트

### 현재 담당자
- [ ] GitHub 저장소 생성 및 코드 푸시
- [ ] 새 담당자를 GitHub 협업자로 추가
- [ ] Supabase 프로젝트에 새 담당자 초대
- [ ] 환경 변수 정보 전달 (보안 채널 사용)
- [ ] 데이터베이스 스키마 백업 제공
- [ ] 이관 가이드 문서 전달
- [ ] 새 담당자와 인수인계 미팅

### 새 담당자
- [ ] GitHub 저장소 클론
- [ ] Node.js 및 의존성 설치
- [ ] Supabase 계정 생성 및 프로젝트 접근 확인
- [ ] `.env` 파일 생성 및 환경 변수 설정
- [ ] 로컬 개발 서버 실행 및 테스트
- [ ] Vercel/Netlify 계정 생성
- [ ] 프로젝트 배포
- [ ] 배포 후 기능 검증
- [ ] 관리자 비밀번호 변경
- [ ] 정기 백업 계획 수립

---

> [!IMPORTANT]
> 이관 과정 중 문제가 발생하면, 먼저 이 가이드의 **문제 해결** 섹션을 참고하세요. 해결되지 않으면 현재 담당자에게 연락하거나 각 플랫폼의 공식 문서를 참조하세요.

**이관 완료 후 반드시 엔드-투-엔드 테스트를 진행하여 모든 기능이 정상 작동하는지 확인하세요!** ✅
