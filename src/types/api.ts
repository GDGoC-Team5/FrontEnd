/**
 * 백엔드와 주고받는 데이터 모양(타입).
 * ERD(users, study, study_member, study_tag, week, session_material, submission, weekly_best_member)를
 * 스프링 기본 JSON 규칙(camelCase)으로 옮겨 놓은 거예요.
 *
 * ⚠️ 백엔드 API 명세(Swagger)가 나오면 필드 이름을 여기서 한 번에 맞춰 주세요.
 *    여기만 고치면 TypeScript가 바꿔야 할 화면 코드를 빨간 줄로 다 알려줘요.
 */

/** study_member.role */
export type StudyRole = 'MANAGER' | 'MEMBER';

/** users */
export interface User {
  id: number;
  email: string;
  nickname: string;
  systemRole?: string;
  createdAt?: string;
}

/** study_tag */
export interface StudyTag {
  id: number;
  studyId?: number;
  name: string;
  description?: string | null;
  createdAt?: string;
}

/**
 * GET /api/v1/studies (내가 참여한 스터디 목록)의 한 줄.
 * 홈 카드에 필요한 값들이에요. id/name/description 말고는 백엔드와 상의가 필요해요(docs/api-mapping.md 참고).
 */
export interface StudySummary {
  id: number;
  name: string;
  description?: string | null;
  myRole?: StudyRole;
  memberCount?: number;
  currentWeekNo?: number | null;
  nextDeadline?: string | null;
  /** 이번 주 과제를 내가 냈는지 (스터디원 카드) */
  mySubmitted?: boolean | null;
  /** 이번 주 제출한 사람 수 / 제출 대상 수 (운영진 카드) */
  currentWeekSubmittedCount?: number;
  currentWeekTargetCount?: number;
}

/** study (상세) */
export interface StudyDetail {
  id: number;
  name: string;
  description?: string | null;
  /** 운영진에게만 내려온다고 가정 */
  inviteCode?: string | null;
  createdBy?: number;
  myRole?: StudyRole;
  memberCount?: number;
  tags?: StudyTag[];
  createdAt?: string;
  updatedAt?: string;
}

/** study_member (+ 화면에 보여줄 닉네임) */
export interface StudyMember {
  /** 화면의 멤버 키. 실제 멤버 목록에는 userId만 내려온다. */
  id: number;
  studyId: number;
  userId: number;
  nickname: string;
  email?: string;
  role: StudyRole;
  status?: string;
  joinedAt?: string;
}

/** week */
export interface Week {
  id: number;
  studyId: number;
  weekNo: number;
  title: string;
  assignmentType?: string | null;
  assignmentDescription?: string | null;
  /** "2026-10-04T22:00:00" 같은 LocalDateTime 문자열 */
  sessionAt?: string | null;
  location?: string | null;
  deadline?: string | null;
  referenceSummary?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeekInput {
  weekNo: number;
  title: string;
  assignmentType?: string | null;
  assignmentDescription?: string | null;
  sessionAt?: string | null;
  location?: string | null;
  deadline?: string | null;
}

/** session_material */
export interface SessionMaterial {
  id: number;
  weekId: number;
  uploaderId: number;
  originalFilename: string;
  contentType?: string;
  fileSize?: number;
  /** 다운로드 주소 (S3 presigned URL 등) — 백엔드와 상의 */
  downloadUrl?: string | null;
  createdAt?: string;
}

/** submission.check_status */
export type CheckStatus = 'UNCHECKED' | 'CHECKED';

/** submission */
export interface Submission {
  id: number;
  weekId: number;
  userId?: number;
  /** study_member.id */
  memberId: number;
  /** 목록 화면용 — 백엔드가 같이 내려주면 편해요 */
  nickname?: string;
  /** ⚠️ ERD submission 테이블에 title 컬럼이 없어요. 피그마엔 제목 입력칸이 있어서 일단 보내요 */
  title?: string | null;
  content?: string | null;
  originalLink?: string | null;
  submittedAt: string;
  updatedAt?: string | null;
  checkStatus?: CheckStatus;
  checkedBy?: number | null;
  checkedAt?: string | null;
}

export interface SubmissionInput {
  title?: string | null;
  content?: string | null;
  originalLink?: string | null;
}

export interface MaterialLink {
  id: number;
  title: string;
  url: string | null;
}

/** weekly_best_member */
export interface BestMember {
  id: number;
  weekId: number;
  /** study_member.id */
  memberId: number;
  nickname?: string;
  reason?: string | null;
  createdAt?: string;
}
