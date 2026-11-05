# 화면별 API 매핑 (프론트 → 백엔드)

회의록 "화면별 API 매핑 확인" 표를 프론트 코드 기준으로 채웠어요.
**O** = 지금 API로 바로 됨 · **△** = 되긴 하는데 백엔드 확인/보완 필요 · **X** = API나 ERD 컬럼이 없음

| No. | 화면 | 필요한 기능 | 연결 API | 존재 | 비고 / 백엔드에 확인할 것 |
| --- | --- | --- | --- | --- | --- |
| 1 | 로그인 | 이메일/비밀번호 로그인 | `POST /api/v1/auth/login` | △ | 폼 로그인이라 지금은 `application/x-www-form-urlencoded`(`email`, `password`)로 보냄. 파라미터 이름 / JSON 여부 / 성공 시 302 대신 200 응답인지 확인 |
| 2 | 회원가입 | 회원가입 | `POST /api/v1/auth/signup` | O | `{ email, nickname, password }`. 이메일 중복이면 **409** 로 주면 "이미 가입된 이메일입니다" 표시 |
| 3 | 홈 | 내 스터디 목록 | `GET /api/v1/studies` | O | |
| 3-1 | 홈 | 초대코드로 참여 | `POST /api/v1/studies/join` | O | `{ inviteCode }` |
| 3-2 | 홈 | 현재 주차 | (3번 응답에 포함 요청) | △ | 목록 응답 한 줄에 `currentWeekNo` |
| 3-3 | 홈 | 멤버 수 | (3번 응답에 포함 요청) | △ | `memberCount` |
| 3-4 | 홈 | 과제 마감일 | (3번 응답에 포함 요청) | △ | `nextDeadline` |
| 3-5 | 홈 | 내 제출 여부 | (3번 응답에 포함 요청) | △ | `myRole`, `mySubmitted`, 운영진 카드용 `currentWeekSubmittedCount`·`currentWeekTargetCount`. 없으면 카드 아래쪽이 비어 보여요 |
| 4 | 스터디 만들기 | 스터디 생성 | `POST /api/v1/studies` | △ | 피그마의 **총 주차·모집 인원**이 ERD `study`에 없음 → 컬럼 추가 or 화면에서 빼기 결정 |
| 4-1 | 스터디 만들기 | 생성자 운영진 등록 | (서버 내부) | O | |
| 4-2 | 스터디 만들기 | 초대코드 생성 | `POST /api/v1/studies` 응답 | △ | 생성 응답에 `inviteCode` 포함 요청 (만들자마자 코드 보여주는 창이 있음) |
| — | 스터디 만들기 | 스터디 속성 | `POST /api/v1/studies/{id}/tags` | O | 태그 API로 따로 저장 중 |
| 5 | 스터디원 대시보드 | 현재 과제 | `GET /api/v1/studies/{id}/weeks` | O | 이번 주차는 프론트가 마감일 보고 계산 |
| 5-1 | 스터디원 대시보드 | 내 제출 이력 | `GET /api/v1/weeks/{weekId}/submissions/me` × 주차 수 | △ | 주차 수만큼 요청이 나감 → `GET /api/v1/studies/{id}/submissions/me` 하나 있으면 좋음 |
| 5-2 | 스터디원 대시보드 | 진행률 | (프론트 계산) | O | |
| 6 | 기록 제출 | URL·본문 제출 | `POST /api/v1/weeks/{weekId}/submissions` | △ | ERD `submission`에 **title 컬럼 없음**(피그마엔 제목 칸 있음). 정리 자료 파일은 지금 `POST /weeks/{weekId}/materials`로 올리는 중 → 제출물에 파일을 붙일지 결정 |
| 6-1 | 기록 제출 | 제출 내용 수정 | `PATCH /api/v1/submissions/{id}` | △ | **유리 질문**: 한 번 내면 수정 불가였는지? 마감 후 지각 제출 허용? → 정책 정해지면 버튼 막기 |
| 7 | 내 제출 이력 | 주차별 제출 상태 | 5-1과 같음 | △ | |
| 8 | 운영진 대시보드 | 전체 제출률 | (없음 → 프론트 계산) | X | 지금은 weeks + members + 주차별 submissions 를 다 불러와 계산. `GET /api/v1/studies/{id}/dashboard` 제안 |
| 8-1 | 운영진 대시보드 | 이번 주 제출률 | (8과 같음) | X | |
| 8-2 | 운영진 대시보드 | 미제출자 | (8과 같음) | X | |
| 8-3 | 운영진 대시보드 | 멤버별 제출 현황 | (8과 같음) | X | 주의 필요 기준 = 최근 2주 지연/미제출 (회의 결정) |
| 8-4 | 운영진 대시보드 | 주차별 데이터 | (8과 같음) | X | |
| 9 | 스터디 관리 | 정보 조회/수정 | `GET`·`PATCH /api/v1/studies/{id}` | O | 피그마의 **진행 기간**도 ERD에 없음 |
| 9-1 | 스터디 관리 | 초대코드 재생성 | `POST /api/v1/studies/{id}/invite-code` | O | 응답 `{ inviteCode }` |
| 9-2 | 스터디 관리 | 모집 여부 변경 | — | X | ERD·API 둘 다 없음 |
| 9-3 | 스터디 관리 | 운영진 추가 | `PATCH /api/v1/studies/{id}/members/{memberId}/role` | O | `{ role: "MANAGER" \| "MEMBER" }` |
| 9-4 | 스터디 관리 | 멤버 목록 | `GET /api/v1/studies/{id}/members` | △ | 응답에 `nickname`(·`email`) 포함 요청 |
| 10 | 주차/세션 관리 | 주차 생성 | `POST /api/v1/studies/{id}/weeks` | O | |
| 10-1~4 | 주차/세션 관리 | 일시·장소·마감·설명 | `POST`/`PATCH /api/v1/weeks/{weekId}` | O | `assignmentType` 값 목록 정해야 함 (지금 임시: LINKEDIN/BLOG/NOTION/FILE) |
| 10-5 | 주차/세션 관리 | 세션 자료 | `POST /api/v1/weeks/{weekId}/materials` | △ | multipart 필드 이름 `file` 맞는지, 다운로드는 presigned URL을 줄지 |
| 11 | 과제 수행 체크 | 멤버별 제출 내역 | `GET /api/v1/weeks/{weekId}/submissions` | △ | 응답에 `nickname` 있으면 편함 |
| 11-1 | 과제 수행 체크 | 운영진 수행 체크 | `PATCH /api/v1/submissions/{id}/check` | △ | body 형식 확인 — 지금 `{ checkStatus: "CHECKED" \| "UNCHECKED" }` |
| 12 | 우수 스터디원 | 선정 | `POST /api/v1/weeks/{weekId}/best-member` | O | `{ memberId, reason }` — memberId는 `study_member.id` |
| 12-1 | 우수 스터디원 | 선정 결과 수정 | `PATCH /api/v1/weeks/{weekId}/best-member` | O | **유리 의견**: 동아리 전체 공개하려면 추가 API 필요 |

---

## 백엔드에 같이 확인할 공통 사항

1. **CSRF** — `csrf.spa()` 기본값(쿠키 `XSRF-TOKEN` → 헤더 `X-XSRF-TOKEN`)으로 보내고 있어요.
   첫 POST 전에 쿠키가 없으면 `GET /api/v1/users/me` 를 한 번 불러서 받아와요. 전용 엔드포인트가 있으면 알려주세요.
2. **도메인** — 배포 때 `studyhub.com`(Vercel) / `api.studyhub.com`(EC2)로 나누면, 프론트 JS가 `XSRF-TOKEN` 쿠키를 읽으려면
   쿠키 domain을 `.studyhub.com` 으로 설정해야 해요. 아니면 Vercel rewrites로 `/api/*` 를 프록시하는 방법도 있어요(로컬은 이미 이렇게 함).
3. **응답 모양** — `{ success, data, message }` 로 감싸도 되고 안 감싸도 돼요(프론트가 둘 다 처리). 에러는 `{ message }` 를 주면 화면에 그대로 떠요.
4. **상태 코드** — 로그인 안 함 **401**, 권한 없음 **403**, 내 제출물/우수 멤버가 없으면 **404** (또는 `null`).
5. **날짜** — `LocalDateTime` 문자열 `"2026-10-04T22:00:00"` (시간대 없이 한국 시간) 기준으로 만들었어요.
6. **필드 이름** — 자바 기본(camelCase): `weekNo`, `sessionAt`, `originalLink`, `checkStatus` … 다르면 `src/types/api.ts` 만 고치면 돼요.
