# 배포 체크리스트

## 🎯 배포 전 준비사항

### 코드 검증
- [ ] `npm run lint` 실행하여 코드 린트 오류 없음 확인
- [ ] 로컬 개발 서버에서 모든 기능 정상 작동 확인
- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인 (`.gitignore`에 포함)
- [ ] 프로덕션 빌드 테스트: `npm run build` 성공 확인

### 환경 변수 준비
- [ ] `VITE_SUPABASE_URL` 값 확인
- [ ] `VITE_SUPABASE_ANON_KEY` 값 확인
- [ ] `VITE_ADMIN_PASSWORD` 값 확인 (강력한 비밀번호 사용)

### Supabase 설정 확인
- [ ] Supabase 프로젝트가 활성 상태인지 확인
- [ ] 데이터베이스 테이블 생성 완료 확인 (`performances`, `reservations`)
- [ ] RLS (Row Level Security) 정책 활성화 확인
- [ ] API 키가 유효한지 확인

### Git 저장소 준비
- [ ] 모든 변경사항 커밋
- [ ] GitHub/GitLab 저장소에 푸시
- [ ] `main` 또는 `master` 브랜치 최신 상태 확인

---

## 🚀 Vercel 배포

### 1. Vercel 계정 설정
- [ ] https://vercel.com 접속
- [ ] GitHub/GitLab 계정으로 로그인

### 2. 프로젝트 임포트
- [ ] **New Project** 클릭
- [ ] GitHub 저장소 연결
- [ ] `Reservation-page` 저장소 선택
- [ ] **Import** 클릭

### 3. 프로젝트 설정
- [ ] **Framework Preset**: Vite 선택 (자동 감지됨)
- [ ] **Root Directory**: `.` (기본값)
- [ ] **Build Command**: `npm run build` (기본값)
- [ ] **Output Directory**: `dist` (기본값)
- [ ] **Install Command**: `npm install` (기본값)

### 4. 환경 변수 설정
**Environment Variables** 섹션에서 추가:

- [ ] `VITE_SUPABASE_URL` = `your-supabase-url`
- [ ] `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
- [ ] `VITE_ADMIN_PASSWORD` = `your-admin-password`

**Environment**: Production, Preview, Development 모두 선택

### 5. 배포 시작
- [ ] **Deploy** 버튼 클릭
- [ ] 배포 로그 확인 (Build 성공 확인)
- [ ] 배포 완료 후 URL 확인 (예: `https://your-project.vercel.app`)

### 6. 도메인 설정 (선택 사항)
- [ ] Vercel Dashboard → Settings → Domains
- [ ] 커스텀 도메인 추가
- [ ] DNS 설정 완료

---

## 🌐 Netlify 배포

### 1. Netlify 계정 설정
- [ ] https://netlify.com 접속
- [ ] GitHub/GitLab 계정으로 로그인

### 2. 프로젝트 배포
- [ ] **Add new site** → **Import an existing project** 클릭
- [ ] GitHub 연결 및 저장소 선택
- [ ] `Reservation-page` 저장소 선택

### 3. Build Settings
- [ ] **Base directory**: 비어 있음 (기본값)
- [ ] **Build command**: `npm run build`
- [ ] **Publish directory**: `dist`

### 4. 환경 변수 설정
**Site configuration** → **Environment variables**에서 추가:

- [ ] `VITE_SUPABASE_URL` = `your-supabase-url`
- [ ] `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
- [ ] `VITE_ADMIN_PASSWORD` = `your-admin-password`

### 5. 배포 시작
- [ ] **Deploy site** 클릭
- [ ] 배포 로그 확인
- [ ] 배포 완료 후 URL 확인 (예: `https://random-name.netlify.app`)

### 6. 도메인 설정 (선택 사항)
- [ ] Site settings → Domain management
- [ ] 커스텀 도메인 추가

---

## 📱 GitHub Pages 배포 (정적 호스팅)

### 1. Vite 설정 업데이트

`vite.config.js` 파일에 base 설정 추가:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/Reservation-page/', // GitHub 저장소 이름
})
```

### 2. 배포 스크립트 추가

`package.json`에 스크립트 추가:

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.0.0"
  }
}
```

- [ ] `gh-pages` 패키지 설치: `npm install --save-dev gh-pages`

### 3. GitHub 저장소 설정
- [ ] GitHub 저장소 → Settings → Pages
- [ ] **Source**: Deploy from a branch
- [ ] **Branch**: `gh-pages` / `root` 선택

### 4. 배포 실행
```bash
npm run deploy
```

- [ ] 배포 완료 확인
- [ ] URL 확인: `https://username.github.io/Reservation-page/`

> [!WARNING]
> GitHub Pages는 환경 변수를 지원하지 않으므로, 클라이언트 측에 Supabase 키가 노출됩니다. 프로덕션 환경에서는 Vercel 또는 Netlify 사용을 권장합니다.

---

## ✅ 배포 후 검증

### 1. 기본 접속 확인
- [ ] 배포된 URL 접속 가능
- [ ] HTTPS 연결 확인 (자물쇠 아이콘)
- [ ] 페이지 로딩 속도 확인

### 2. 사용자 기능 테스트
- [ ] 홈페이지에서 공연 목록 표시 확인
- [ ] 예약 폼 표시 확인
- [ ] 테스트 예약 생성:
  - 이름 입력
  - 전화번호 입력
  - 시간 선택
  - 예약 제출
- [ ] 예약 성공 메시지 확인
- [ ] Supabase Table Editor에서 예약 데이터 확인

### 3. 관리자 기능 테스트
- [ ] `/admin` 경로 접속
- [ ] 관리자 로그인 (`.env`의 비밀번호 사용)
- [ ] 대시보드 접근 확인
- [ ] 공연 생성 테스트:
  - 제목, 설명, 날짜, 시간 입력
  - 저장 후 목록에 표시 확인
- [ ] 공연 수정 테스트
- [ ] 예약 현황 조회 확인
- [ ] 공연 삭제 테스트 (주의: 연관된 예약도 삭제됨)

### 4. 반응형 디자인 확인
- [ ] 데스크톱 (1920x1080)
- [ ] 태블릿 (768x1024)
- [ ] 모바일 (375x667)

### 5. 브라우저 호환성 확인
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Edge

### 6. 성능 확인
- [ ] Lighthouse 스코어 확인 (Chrome DevTools)
  - Performance: 90+ 목표
  - Accessibility: 90+ 목표
  - Best Practices: 90+ 목표
  - SEO: 90+ 목표

---

## 🔄 재배포 (업데이트)

### Vercel
코드 변경 후 GitHub에 푸시하면 자동 배포됩니다.

수동 재배포:
- [ ] Vercel Dashboard → Deployments
- [ ] **Redeploy** 버튼 클릭

### Netlify
코드 변경 후 GitHub에 푸시하면 자동 배포됩니다.

수동 재배포:
- [ ] Netlify Dashboard → Deploys
- [ ] **Trigger deploy** → **Deploy site** 클릭

### GitHub Pages
```bash
npm run deploy
```

---

## 🚨 롤백 (이전 버전으로 복구)

### Vercel
- [ ] Vercel Dashboard → Deployments
- [ ] 이전 배포 버전 선택
- [ ] **Promote to Production** 클릭

### Netlify
- [ ] Netlify Dashboard → Deploys
- [ ] 이전 배포 선택
- [ ] **Publish deploy** 클릭

---

## 🔧 배포 문제 해결

### 빌드 실패

**증상**: `Build failed` 에러

**해결**:
1. 로컬에서 `npm run build` 실행하여 오류 확인
2. `package.json`의 dependencies가 올바른지 확인
3. Node.js 버전 확인 (18 이상 권장)

### 환경 변수 오류

**증상**: 앱이 Supabase에 연결되지 않음

**해결**:
1. 환경 변수 이름 확인 (Vite는 `VITE_` 접두사 필요)
2. 환경 변수 값이 올바른지 확인
3. 재배포 트리거

### 404 오류 (페이지를 찾을 수 없음)

**증상**: 새로고침 시 404 에러 (React Router 사용 시)

**해결**:

**Vercel**: 자동 처리됨 (설정 불필요)

**Netlify**: `public/` 폴더에 `_redirects` 파일 생성:
```
/*    /index.html   200
```

**GitHub Pages**: Hash Router 사용 또는 404.html 설정

### 느린 로딩 속도

**해결**:
1. 이미지 최적화 (압축, WebP 형식 사용)
2. Code splitting 적용
3. CDN 활용 (Vercel/Netlify는 자동 제공)

---

## 📊 모니터링 및 분석

### Vercel Analytics
- [ ] Vercel Dashboard → Analytics 활성화
- [ ] 트래픽, 성능 모니터링

### Netlify Analytics
- [ ] Netlify Dashboard → Analytics 구독

### Google Analytics (선택 사항)
- [ ] Google Analytics 계정 생성
- [ ] Tracking ID 발급
- [ ] `index.html`에 스크립트 추가

---

## 🎉 배포 완료!

배포가 성공적으로 완료되었다면:

✅ **배포 URL 기록**
✅ **관리자 비밀번호 안전하게 보관**
✅ **Supabase 프로젝트 정보 백업**
✅ **정기적인 데이터 백업 계획 수립**

---

> [!TIP]
> 배포 후에는 정기적으로 Supabase 사용량과 Vercel/Netlify 빌드 시간을 모니터링하여 무료 티어 한도를 초과하지 않도록 주의하세요.
