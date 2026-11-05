'use client';

import { createContext, useContext } from 'react';
import type { StudyDetail, StudyMember, StudyRole } from '@/types/api';

export interface StudyContextValue {
  studyId: number;
  study: StudyDetail;
  members: StudyMember[];
  myRole: StudyRole;
  /** 내 study_member.id */
  myMemberId: number | null;
  reload: () => Promise<void>;
}

export const StudyContext = createContext<StudyContextValue | null>(null);

/** /studies/[studyId] 아래 화면에서 현재 스터디 정보를 꺼내 쓸 때 */
export function useStudy(): StudyContextValue {
  const value = useContext(StudyContext);
  if (!value) throw new Error('useStudy는 /studies/[studyId] 화면 안에서만 쓸 수 있어요.');
  return value;
}
