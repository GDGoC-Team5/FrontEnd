import type { BestMember, CheckStatus, Submission, SubmissionInput } from '@/types/api';
import { USE_MOCK } from '@/lib/config';
import { api } from './client';
import { isApiError } from './errors';

// ───────── Submission ─────────

type ServerSubmission = Pick<Submission, 'id' | 'weekId' | 'memberId' | 'submittedAt' | 'updatedAt'> & {
  userId: number;
  name: string;
  url: string;
  checked: boolean;
};

function toSubmission(data: Submission | ServerSubmission): Submission {
  if (!('url' in data)) return data;
  const { url, checked, name, ...submission } = data;
  return { ...submission, originalLink: url, checkStatus: checked ? 'CHECKED' : 'UNCHECKED', nickname: name };
}

export async function createSubmission(weekId: number, input: SubmissionInput) {
  const data = await api.post<Submission | ServerSubmission>(
    `/api/v1/weeks/${weekId}/submissions`, USE_MOCK ? input : { url: input.originalLink },
  );
  return toSubmission(data);
}

/** 주차별 제출물 목록 (운영진용) */
export async function getWeekSubmissions(weekId: number) {
  const data = await api.get<(Submission | ServerSubmission)[]>(`/api/v1/weeks/${weekId}/submissions`);
  return data.map(toSubmission);
}

/** 내 제출물. 아직 안 냈으면(404) null을 돌려줘요. */
export async function getMySubmission(weekId: number): Promise<Submission | null> {
  try {
    const result = await api.get<Submission | ServerSubmission | null>(`/api/v1/weeks/${weekId}/submissions/me`);
    return result ? toSubmission(result) : null;
  } catch (e) {
    if (isApiError(e, 404)) return null;
    throw e;
  }
}

export async function getSubmission(submissionId: number) {
  return toSubmission(await api.get<Submission | ServerSubmission>(`/api/v1/submissions/${submissionId}`));
}

export async function updateSubmission(submissionId: number, input: SubmissionInput) {
  const data = await api.patch<Submission | ServerSubmission>(
    `/api/v1/submissions/${submissionId}`, USE_MOCK ? input : { url: input.originalLink },
  );
  return toSubmission(data);
}

export function deleteSubmission(submissionId: number) {
  return api.delete(`/api/v1/submissions/${submissionId}`);
}

/** 운영진의 '수행 체크' */
export async function checkSubmission(submissionId: number, checkStatus: CheckStatus) {
  const data = await api.patch<Submission | ServerSubmission>(
    `/api/v1/submissions/${submissionId}/check`, USE_MOCK ? { checkStatus } : { checked: checkStatus === 'CHECKED' },
  );
  return toSubmission(data);
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
