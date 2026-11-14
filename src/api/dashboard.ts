/**
 * 대시보드용 데이터 묶음.
 * ⚠️ 지금 API 목록엔 대시보드 전용 API가 없어서, 주차마다 제출물 목록을 하나씩 불러와 합쳐요(주차 수만큼 요청).
 *    백엔드에 GET /api/v1/studies/{studyId}/dashboard 같은 걸 만들어 달라고 하면 요청 1번으로 끝나요.
 */
import type { StudyMember, StudySummary, Submission, Week } from '@/types/api';
import { USE_MOCK } from '@/lib/config';
import { pickCurrentWeek } from '@/lib/stats';
import { getMembers, getMyStudies, getStudy } from './studies';
import { getMySubmission, getWeekSubmissions } from './submissions';
import { getWeeks } from './weeks';

export async function loadHomeStudies(): Promise<StudySummary[]> {
  const studies = await getMyStudies();
  if (USE_MOCK) return studies;

  return Promise.all(studies.map(async (study) => {
    const [detail, weeks] = await Promise.all([getStudy(study.id), getWeeks(study.id)]);
    const current = pickCurrentWeek(weeks);
    const summary = {
      ...study,
      memberCount: detail.memberCount,
      currentWeekNo: current?.weekNo,
      nextDeadline: current?.deadline,
    };
    if (!current) return summary;
    if (study.myRole !== 'MANAGER') {
      return { ...summary, mySubmitted: Boolean(await getMySubmission(current.id)) };
    }

    const [members, submissions] = await Promise.all([getMembers(study.id), getWeekSubmissions(current.id)]);
    const targets = members.filter((member) => member.role === 'MEMBER');
    const submitters = new Set(submissions.map((submission) => submission.userId));
    return {
      ...summary,
      currentWeekSubmittedCount: targets.filter((member) => submitters.has(member.userId)).length,
      currentWeekTargetCount: targets.length,
    };
  }));
}

export interface StudySubmissionsData {
  weeks: Week[];
  members: StudyMember[];
  subsByWeek: Record<number, Submission[]>;
}

export async function loadStudySubmissions(studyId: number | string): Promise<StudySubmissionsData> {
  const [weeks, members] = await Promise.all([getWeeks(studyId), getMembers(studyId)]);
  const lists = await Promise.all(weeks.map((w) => getWeekSubmissions(w.id)));
  const subsByWeek: Record<number, Submission[]> = {};
  weeks.forEach((w, i) => {
    subsByWeek[w.id] = lists[i] ?? [];
  });
  return { weeks, members, subsByWeek };
}

export async function loadMySubmissions(studyId: number | string) {
  const weeks = await getWeeks(studyId);
  const subs = await Promise.all(weeks.map((w) => getMySubmission(w.id)));
  const mySubs: Record<number, Submission | null> = {};
  weeks.forEach((w, i) => {
    mySubs[w.id] = subs[i];
  });
  return { weeks, mySubs };
}
