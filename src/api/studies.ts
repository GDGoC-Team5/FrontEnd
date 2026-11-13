import type { StudyDetail, StudyMember, StudyRole, StudySummary, StudyTag } from '@/types/api';
import { USE_MOCK } from '@/lib/config';
import { api } from './client';

const studiesPath = USE_MOCK ? '/api/v1/studies' : '/api/studies';

// ───────── Study ─────────

export interface CreateStudyInput {
  name: string;
  description?: string;
  /** ⚠️ ERD study 테이블에 없는 값 (피그마 '총 주차', '모집 인원'). 백엔드와 상의 필요 */
  totalWeeks?: number;
  capacity?: number;
}

export function createStudy(input: CreateStudyInput) {
  const { name, description } = input;
  return api.post<StudyDetail>(studiesPath, USE_MOCK ? input : { name, description });
}

/** 내가 참여한 스터디 목록 */
export function getMyStudies() {
  return api.get<StudySummary[]>(studiesPath);
}

export function getStudy(studyId: number | string) {
  return api.get<StudyDetail>(`${studiesPath}/${studyId}`);
}

export function updateStudy(studyId: number | string, input: { name?: string; description?: string }) {
  return api.patch<StudyDetail>(`${studiesPath}/${studyId}`, input);
}

export function deleteStudy(studyId: number | string) {
  return api.delete(`/api/v1/studies/${studyId}`);
}

/** 초대 코드로 가입 */
export function joinStudy(inviteCode: string) {
  return api.post<StudyDetail>(`${studiesPath}/join`, { inviteCode });
}

export function reissueInviteCode(studyId: number | string) {
  return api.post<{ inviteCode: string }>(`/api/v1/studies/${studyId}/invite-code`);
}

// ───────── Member ─────────

export function getMembers(studyId: number | string) {
  const path = `${studiesPath}/${studyId}/members`;
  if (USE_MOCK) return api.get<StudyMember[]>(path);
  return api.get<{ userId: number; name: string; role: StudyRole }[]>(path).then((members) =>
    members.map(({ userId, name, role }) => ({ id: userId, studyId: Number(studyId), userId, nickname: name, role })),
  );
}

export function getMember(studyId: number | string, memberId: number) {
  return api.get<StudyMember>(`/api/v1/studies/${studyId}/members/${memberId}`);
}

export function changeMemberRole(studyId: number | string, memberId: number, role: StudyRole) {
  return api.patch<StudyMember>(`/api/v1/studies/${studyId}/members/${memberId}/role`, { role });
}

export function kickMember(studyId: number | string, memberId: number) {
  return api.delete(`/api/v1/studies/${studyId}/members/${memberId}`);
}

export function leaveStudy(studyId: number | string) {
  return api.delete(`/api/v1/studies/${studyId}/members/me`);
}

// ───────── Tag (스터디 속성) ─────────

export function getTags(studyId: number | string) {
  return api.get<StudyTag[]>(`${studiesPath}/${studyId}/tags`);
}

export function addTag(studyId: number | string, input: { name: string; description?: string }) {
  return api.post<StudyTag>(`${studiesPath}/${studyId}/tags`, USE_MOCK ? input : { name: input.name });
}

export function deleteTag(studyId: number | string, tagId: number) {
  return api.delete(`${studiesPath}/${studyId}/tags/${tagId}`);
}
