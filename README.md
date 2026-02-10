# 🎭 공연 예약 시스템 (Reservation Page)

공연 일정을 확인하고 예약할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 📅 **공연 일정 조회**: 사용자는 예정된 공연 목록을 확인할 수 있습니다
- 🎫 **온라인 예약**: 이름, 전화번호, 희망 시간을 입력하여 예약 가능
- 👨‍💼 **관리자 페이지**: 공연 생성/수정/삭제 및 예약 현황 관리
- 📱 **반응형 디자인**: 모바일 및 데스크톱 환경 지원

## 🛠 기술 스택

- **Frontend**: React 19.2 + Vite 7.2
- **Backend**: Supabase (PostgreSQL, Real-time DB)
- **Routing**: React Router 7.13
- **Styling**: CSS Modules

## 🚀 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치 방법

1. **저장소 클론**
   ```bash
   git clone https://github.com/jhonverr/Reservation-page.git
   cd Reservation-page
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   
   `.env.example` 파일을 `.env`로 복사하고 값을 입력하세요:
   ```bash
   cp .env.example .env
   ```
   
   `.env` 파일 수정:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_ADMIN_PASSWORD=your-admin-password
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   
   브라우저에서 `http://localhost:5173` 접속

## 📦 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 배포 방법

- **Vercel**: [배포 가이드](https://vercel.com/docs)
- **Netlify**: [배포 가이드](https://docs.netlify.com)

자세한 내용은 **프로젝트 이관 가이드** 문서를 참조하세요.

## 🗂 프로젝트 구조

```
Reservation-page/
├── src/
│   ├── components/      # 재사용 가능한 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── admin/      # 관리자 페이지
│   │   └── Home.jsx    # 메인 페이지
│   ├── lib/            # Supabase 클라이언트 설정
│   └── App.jsx         # 메인 앱 컴포넌트
├── public/             # 정적 파일
└── .env               # 환경 변수 (git에서 제외)
```

## 🔐 관리자 기능

관리자 페이지 접속: `/admin`

- 공연 생성, 수정, 삭제
- 예약 현황 조회 및 관리
- 로그인 비밀번호: `.env`의 `VITE_ADMIN_PASSWORD` 값

## 🤝 프로젝트 이관

프로젝트를 다른 담당자에게 이관하려면 `docs/` 폴더의 가이드 문서를 참조하세요.

### 📚 이관 문서

- 📄 [**프로젝트 이관 가이드**](docs/PROJECT_HANDOFF_GUIDE.md) - 전체 이관 프로세스 안내
- 🗄️ [**데이터베이스 마이그레이션**](docs/DATABASE_MIGRATION.md) - Supabase DB 이관 가이드
- 🚀 [**배포 체크리스트**](docs/DEPLOYMENT_CHECKLIST.md) - 배포 단계별 가이드

주요 이관 항목:
- ✅ 소스코드 (GitHub)
- ✅ Supabase 데이터베이스
- ✅ 환경 변수 설정
- ✅ 배포 설정

## 📄 라이선스

MIT License

## 📞 문의

프로젝트 관련 문의사항은 GitHub Issues를 이용해주세요.
