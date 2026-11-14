import type { MaterialLink, SessionMaterial, Week, WeekInput } from '@/types/api';
import { USE_MOCK } from '@/lib/config';
import { api } from './client';

const weekPrefix = USE_MOCK ? '/api/v1' : '/api';

// ───────── Week ─────────

export function createWeek(studyId: number | string, input: WeekInput) {
  return api.post<Week>(`${weekPrefix}/studies/${studyId}/weeks`, input);
}

/** 주차 목록 (weekNo 오름차순으로 정렬해서 돌려줘요) */
export async function getWeeks(studyId: number | string) {
  const weeks = await api.get<Week[]>(`${weekPrefix}/studies/${studyId}/weeks`);
  return (weeks ?? []).map((week) => ({ ...week, studyId: Number(studyId) })).sort((a, b) => a.weekNo - b.weekNo);
}

export function getWeek(weekId: number) {
  return api.get<Week>(`${weekPrefix}/weeks/${weekId}`);
}

export function updateWeek(weekId: number, input: Partial<WeekInput>) {
  const { assignmentType, ...fields } = input;
  return api.patch<Week>(`${weekPrefix}/weeks/${weekId}`, USE_MOCK ? { ...fields, assignmentType } : fields);
}

export function deleteWeek(weekId: number) {
  return api.delete(`${weekPrefix}/weeks/${weekId}`);
}

// ───────── Material (세션 자료) ─────────

function toMaterial(material: MaterialLink | SessionMaterial): MaterialLink {
  return 'title' in material
    ? material
    : { id: material.id, title: material.originalFilename, url: material.downloadUrl ?? null };
}

export async function createMaterial(weekId: number, input: { title: string; url: string }) {
  return toMaterial(await api.post<MaterialLink | SessionMaterial>(`/api/v1/weeks/${weekId}/materials`, input));
}

export async function getMaterials(weekId: number) {
  const materials = await api.get<(MaterialLink | SessionMaterial)[]>(`/api/v1/weeks/${weekId}/materials`);
  return materials.map(toMaterial);
}

export async function getMaterial(materialId: number) {
  return toMaterial(await api.get<MaterialLink | SessionMaterial>(`/api/v1/materials/${materialId}`));
}

export function deleteMaterial(materialId: number) {
  return api.delete(`/api/v1/materials/${materialId}`);
}
