# 스터디 기록 허브 — 프론트엔드

> 스터디 기록은 한 곳에, 빈틈은 한눈에 · GDGoC SMU Team5

Next.js(App Router) + TypeScript + MUI + Recharts. 회의에서 정한 스택 그대로예요.
피그마(Team-5-Design)의 화면을 옮겨 놨고, 백엔드가 없어도 **가짜 데이터**로 모든 화면을 눌러볼 수 있어요.

---

## 1. 처음 실행하기 (딱 한 번)

1. [Node.js](https://nodejs.org) **LTS 버전**을 설치해요. (터미널에서 `node -v` 쳤을 때 v20 이상이면 OK)
2. 이 폴더에서 터미널을 열고:

```bash
npm install      # 필요한 라이브러리 다운로드 (처음 한 번, 1~2분)
npm run dev      # 개발 서버 켜기
```

3. 브라우저에서 http://localhost:3000 접속
4. 데모 계정 **demo@gdgoc.com / demo1234!** 로 로그인 (로그인 칸에 미리 채워져 있어요)

- Dev 스터디 → 내가 **운영진**인 스터디 (운영진 화면 5개)
- Design / ML 스터디 → 내가 **스터디원**인 스터디 (스터디원 화면 3개)

> 가짜 데이터는 브라우저에 저장돼요. 처음 상태로 돌리고 싶으면 로그인 화면 아래 **가짜 데이터 초기화**를 누르세요.

---

## 2. 화면 목록 (피그마 프레임 ↔ 주소 ↔ 파일)

| 피그마 프레임 | 주소 | 파일 |
| --- | --- | --- |
| Log-in | `/login` | `src/app/login/page.tsx` |
| Sign-in-password (회원가입) | `/signup` | `src/app/signup/page.tsx` |
| home (내 스터디) | `/home` | `src/app/home/page.tsx` |
| home (스터디 만들기 모달) | `/home` → +스터디 만들기 | `src/app/home/CreateStudyDialog.tsx` |
| Student-dashboard | `/studies/[id]/dashboard` | `src/app/studies/[studyId]/dashboard/page.tsx` |
| Student-homework2 (기록 제출) | `/studies/[id]/submit` | `src/app/studies/[studyId]/submit/page.tsx` |
| Student-homework (내 제출 이력) | `/studies/[id]/history` | `src/app/studies/[studyId]/history/page.tsx` |
| Management-dashboard | `/studies/[id]/manage` | `src/app/studies/[studyId]/manage/page.tsx` |
| Student- study-management | `/studies/[id]/manage/study` | `src/app/studies/[studyId]/manage/study/page.tsx` |
| Student-week-management | `/studies/[id]/manage/weeks` | `src/app/studies/[studyId]/manage/weeks/page.tsx` |
| Student-homework (과제 수행 체크) | `/studies/[id]/manage/check` | `src/app/studies/[studyId]/manage/check/page.tsx` |
| Student-mvp (우수 스터디원) | `/studies/[id]/manage/best` | `src/app/studies/[studyId]/manage/best/page.tsx` |

Next.js는 **폴더 구조가 곧 주소**예요. `src/app/login/page.tsx` 파일이 `/login` 화면이 돼요.

---

## 3. 폴더 구조

```
src/
├─ app/                 화면(주소별 폴더)
│  ├─ layout.tsx        모든 화면 공통 (폰트, 테마)
│  └─ studies/[studyId]/
│     ├─ layout.tsx     왼쪽 사이드바 + 스터디 정보 불러오기
│     └─ manage/        운영진 화면 (스터디원이 들어오면 403 화면)
├─ api/                 백엔드 API 부르는 함수 (API 명세 표 그대로)
│  └─ client.ts         ⭐ 모든 요청이 지나가는 곳 (쿠키, CSRF, 401/403 처리)
├─ mocks/               가짜 서버·가짜 데이터
├─ components/          여러 화면에서 같이 쓰는 조각 (사이드바, 상태 칩, 카드…)
├─ contexts/            로그인 정보, 현재 스터디 정보, 알림(토스트)
├─ lib/                 날짜 포맷, 제출률 계산 같은 도우미
├─ theme/theme.ts       ⭐ 피그마 색상·폰트 (색 바꾸려면 여기)
└─ types/api.ts         ⭐ 백엔드 데이터 모양 (ERD 기준) — 명세 나오면 여기부터 맞추기
```

---

## 4. 진짜 백엔드에 연결하기

1. `.env.example` 을 복사해서 `.env.local` 로 이름 바꾸기
2. 안의 값을 이렇게:

```
NEXT_PUBLIC_USE_MOCK=false
BACKEND_URL=http://localhost:8080     # 스프링 서버 주소
```

3. `npm run dev` 다시 켜기

브라우저는 `localhost:3000/api/...` 로 요청하고, Next가 그걸 `BACKEND_URL` 로 넘겨줘요(프록시).
그래서 프론트·백엔드가 같은 주소처럼 보여서 **CORS나 세션 쿠키 문제가 거의 안 생겨요.**

연결했는데 화면이 비거나 에러가 나면, 대부분 **필드 이름이 달라서**예요 → `src/types/api.ts` 를 Swagger에 맞춰 고치면
TypeScript가 같이 고쳐야 할 곳을 빨간 줄로 알려줘요.

백엔드랑 맞춰야 할 것들은 [`docs/api-mapping.md`](docs/api-mapping.md)에 정리해 뒀어요.

---

## 5. 언니랑 같이 작업할 때 (Git)

```bash
git checkout -b feat/login-page     # 내 작업용 가지 만들기
# ... 작업 ...
git add . && git commit -m "feat: 로그인 화면 에러 상태 추가"
git push origin feat/login-page     # 올리고 GitHub에서 Pull Request 만들기
```

- 화면 단위로 나누면 충돌이 덜 나요. (예: 혜민 = 스터디원 화면 / 혜리 = 운영진 화면)
- `src/theme/theme.ts`, `src/types/api.ts`, `src/api/` 는 둘 다 건드리는 파일이라 고치기 전에 한 마디 해주기!
- Vercel에 GitHub 레포를 연결하면 push할 때마다 자동 배포 + PR마다 미리보기 주소가 생겨요.

---

## 6. 아직 안 된 것

- **AI 빈틈 피드백** — 추가 기능이라 자리만 잡아둠 (ERD엔 `ai_feedback` 테이블이 있지만 API 없음)
- **내 정보 수정 / 비밀번호 변경 / 회원 탈퇴 화면** — API 함수(`src/api/auth.ts`)는 있고 피그마 화면이 아직 없음
- 모바일 화면 최적화 (지금은 노트북 기준)
- ESLint 설정 (팀 규칙 정하면 추가)
