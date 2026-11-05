import type { SessionMaterial, Week, WeekInput } from '@/types/api';
import { api } from './client';

// ───────── Week ─────────

export function createWeek(studyId: number | string, input: WeekInput) {
  return api.post<Week>(`/api/v1/studies/${studyId}/weeks`, input);
}

/** 주차 목록 (weekNo 오름차순으로 정렬해서 돌려줘요) */
export async function getWeeks(studyId: number | string) {
  const weeks = await api.get<Week[]>(`/api/v1/studies/${studyId}/weeks`);
  return [...(weeks ?? [])].sort((a, b) => a.weekNo - b.weekNo);
}

export function getWeek(weekId: number) {
  return api.get<Week>(`/api/v1/weeks/${weekId}`);
}

export function updateWeek(weekId: number, input: Partial<WeekInput>) {
  return api.patch<Week>(`/api/v1/weeks/${weekId}`, input);
}

export function deleteWeek(weekId: number) {
  return api.delete(`/api/v1/weeks/${weekId}`);
}

// ───────── Material (세션 자료) ─────────

/** 파일 업로드. 백엔드는 multipart/form-data 의 'file' 필드로 받는다고 가정했어요. */
export function uploadMaterial(weekId: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  return api.upload<SessionMaterial>(`/api/v1/weeks/${weekId}/materials`, form);
}

export function getMaterials(weekId: number) {
  return api.get<SessionMaterial[]>(`/api/v1/weeks/${weekId}/materials`);
}

export function getMaterial(materialId: number) {
  return api.get<SessionMaterial>(`/api/v1/materials/${materialId}`);
}

export function deleteMaterial(materialId: number) {
  return api.delete(`/api/v1/materials/${materialId}`);
}
