# 스터디 기록 허브 FrontEnd

GDGoC SMU Team5 1차 프로젝트 — 스터디원의 학습 기록을 한곳에 모아 주차별 제출 현황을 관리하는 서비스의 프론트엔드입니다.

## 기술 스택

- Next.js 15 (App Router), TypeScript
- MUI, Recharts
- 배포: Vercel

## 실행 방법

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

기본 설정은 목(mock) 데이터 모드라 백엔드 없이도 동작합니다.
테스트 계정: `demo@gdgoc.com` / `demo1234!`

## 환경 변수

`.env.example`을 복사해 `.env.local`을 만든 뒤 값을 수정합니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_USE_MOCK` | `true`: 목 데이터 사용 / `false`: 실제 API 호출 |
| `BACKEND_URL` | 백엔드 주소 (기본 `http://localhost:8080`). `/api/*` 요청을 이 주소로 프록시합니다 |

## 페이지

| 경로 | 화면 | 권한 |
| --- | --- | --- |
| `/login` | 로그인 | - |
| `/signup` | 회원가입 | - |
| `/home` | 내 스터디 | 로그인 |
| `/studies/[id]/dashboard` | 스터디원 대시보드 | MEMBER |
| `/studies/[id]/submit` | 기록 제출 | MEMBER |
| `/studies/[id]/history` | 내 제출 이력 | MEMBER |
| `/studies/[id]/manage` | 운영진 대시보드 | MANAGER |
| `/studies/[id]/manage/study` | 스터디 관리 | MANAGER |
| `/studies/[id]/manage/weeks` | 주차·세션 관리 | MANAGER |
| `/studies/[id]/manage/check` | 과제 수행 체크 | MANAGER |
| `/studies/[id]/manage/best` | 우수 스터디원 | MANAGER |

## 폴더 구조

```
src/
├─ app/         페이지 (App Router)
├─ api/         API 요청 함수
├─ mocks/       목 서버 · 데이터
├─ components/  공통 컴포넌트
├─ contexts/    인증 · 스터디 · 토스트 상태
├─ lib/         날짜 · 통계 유틸
├─ theme/       MUI 테마
└─ types/       API 타입 정의
```

## 문서

- [화면별 API 매핑](docs/api-mapping.md)
