import type { BestMember, CheckStatus, Submission, SubmissionInput } from '@/types/api';
import { api } from './client';
import { isApiError } from './errors';

// ───────── Submission ─────────

export function createSubmission(weekId: number, input: SubmissionInput) {
  return api.post<Submission>(`/api/v1/weeks/${weekId}/submissions`, input);
}

/** 주차별 제출물 목록 (운영진용) */
export function getWeekSubmissions(weekId: number) {
  return api.get<Submission[]>(`/api/v1/weeks/${weekId}/submissions`);
}

/** 내 제출물. 아직 안 냈으면(404) null을 돌려줘요. */
export async function getMySubmission(weekId: number): Promise<Submission | null> {
  try {
    const result = await api.get<Submission | null>(`/api/v1/weeks/${weekId}/submissions/me`);
    return result ?? null;
  } catch (e) {
    if (isApiError(e, 404)) return null;
    throw e;
  }
}

export function getSubmission(submissionId: number) {
  return api.get<Submission>(`/api/v1/submissions/${submissionId}`);
}

export function updateSubmission(submissionId: number, input: SubmissionInput) {
  return api.patch<Submission>(`/api/v1/submissions/${submissionId}`, input);
}

export function deleteSubmission(submissionId: number) {
  return api.delete(`/api/v1/submissions/${submissionId}`);
}

/** 운영진의 '수행 체크' */
export function checkSubmission(submissionId: number, checkStatus: CheckStatus) {
  return api.patch<Submission>(`/api/v1/submissions/${submissionId}/check`, { checkStatus });
}

// ───────── Best Member (주차별 우수 스터디원) ─────────

/** 아직 선정 안 했으면(404) null */
export async function getBestMember(weekId: number): Promise<BestMember | null> {
  try {
    const result = await api.get<BestMember | null>(`/api/v1/weeks/${weekId}/best-member`);
    return result ?? null;
  } catch (e) {
    if (isApiError(e, 404)) return null;
    throw e;
  }
}

export function selectBestMember(weekId: number, input: { memberId: number; reason?: string }) {
  return api.post<BestMember>(`/api/v1/weeks/${weekId}/best-member`, input);
}

export function updateBestMember(weekId: number, input: { memberId: number; reason?: string }) {
  return api.patch<BestMember>(`/api/v1/weeks/${weekId}/best-member`, input);
}

export function cancelBestMember(weekId: number) {
  return api.delete(`/api/v1/weeks/${weekId}/best-member`);
}
