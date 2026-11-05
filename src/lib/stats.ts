/**
 * 대시보드 숫자 계산.
 * 지금은 대시보드 전용 API가 없어서, 주차 목록 + 제출물 목록을 받아 프론트에서 계산해요.
 * 나중에 백엔드가 계산해서 주면 이 파일 대신 그 값을 쓰면 돼요.
 */
import type { StudyMember, Submission, Week } from '@/types/api';
import { daysUntil, parseDate } from './dates';

/** 완료(마감 전 제출) / 지연(마감 후 제출) / 미제출(마감 지남) / 제출 전(아직 마감 전) */
export type SubmitState = 'DONE' | 'LATE' | 'MISSING' | 'PENDING';

export function getSubmitState(
  week: Pick<Week, 'deadline'>,
  submission: Pick<Submission, 'submittedAt'> | null | undefined,
  now: Date = new Date(),
): SubmitState {
  const deadline = parseDate(week.deadline);
  if (submission) {
    const at = parseDate(submission.submittedAt);
    if (deadline && at && at.getTime() > deadline.getTime()) return 'LATE';
    return 'DONE';
  }
  if (deadline && deadline.getTime() < now.getTime()) return 'MISSING';
  return 'PENDING';
}

export function isSubmitted(state: SubmitState) {
  return state === 'DONE' || state === 'LATE';
}

export function isDue(week: Pick<Week, 'deadline'>, now: Date = new Date()) {
  const d = parseDate(week.deadline);
  return !!d && d.getTime() < now.getTime();
}

/** 이번 주차 = 마감이 아직 안 지난 주차 중 가장 빠른 것 (다 지났으면 마지막 주차) */
export function pickCurrentWeek(weeks: Week[], now: Date = new Date()): Week | null {
  if (!weeks.length) return null;
  const sorted = [...weeks].sort((a, b) => a.weekNo - b.weekNo);
  const upcoming = sorted.find((w) => {
    const d = parseDate(w.deadline);
    return !d || d.getTime() >= now.getTime();
  });
  return upcoming ?? sorted[sorted.length - 1];
}

export type WeekPhase = 'DONE' | 'CURRENT' | 'UPCOMING';

export function getWeekPhase(week: Week, current: Week | null): WeekPhase {
  if (!current) return 'UPCOMING';
  if (week.id === current.id) return 'CURRENT';
  return week.weekNo < current.weekNo ? 'DONE' : 'UPCOMING';
}

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : null);

// ───────── 스터디원 대시보드 ─────────

export interface MyWeekRow {
  week: Week;
  submission: Submission | null;
  state: SubmitState;
}

export function computeStudentStats(weeks: Week[], mySubs: Record<number, Submission | null>, now: Date = new Date()) {
  const current = pickCurrentWeek(weeks, now);
  const upTo = current ? weeks.filter((w) => w.weekNo <= current.weekNo) : weeks;
  const rows: MyWeekRow[] = upTo
    .map((week) => {
      const submission = mySubs[week.id] ?? null;
      return { week, submission, state: getSubmitState(week, submission, now) };
    })
    .sort((a, b) => b.week.weekNo - a.week.weekNo);
  const counted = rows.filter((r) => r.state !== 'PENDING');
  const submittedCount = counted.filter((r) => isSubmitted(r.state)).length;
  return {
    current,
    currentSubmission: current ? mySubs[current.id] ?? null : null,
    rows,
    submittedCount,
    countedWeeks: counted.length,
    progress: pct(submittedCount, counted.length),
  };
}

// ───────── 운영진 대시보드 ─────────

export type MemberHealth = 'GOOD' | 'WATCH' | 'ALERT';

export interface MemberRow {
  member: StudyMember;
  cells: { week: Week; state: SubmitState; submission: Submission | null }[];
  rate: number | null;
  health: MemberHealth;
  reason: string;
}

const STATE_LABEL: Record<SubmitState, string> = { DONE: '제출', LATE: '지연', MISSING: '미제출', PENDING: '제출 전' };

export function computeManagerStats(
  weeks: Week[],
  members: StudyMember[],
  subsByWeek: Record<number, Submission[]>,
  selectedWeek: Week | null,
  now: Date = new Date(),
) {
  const targets = members.filter((m) => m.role === 'MEMBER');
  const sorted = [...weeks].sort((a, b) => a.weekNo - b.weekNo);
  const upTo = selectedWeek ? sorted.filter((w) => w.weekNo <= selectedWeek.weekNo) : sorted;

  const subOf = (memberId: number, weekId: number) =>
    (subsByWeek[weekId] ?? []).find((s) => s.memberId === memberId) ?? null;

  const weekRate = (w: Week) => pct(targets.filter((m) => subOf(m.id, w.id)).length, targets.length);

  const overallRateUpTo = (list: Week[]) => {
    const total = targets.length * list.length;
    const done = list.reduce((acc, w) => acc + targets.filter((m) => subOf(m.id, w.id)).length, 0);
    return pct(done, total);
  };

  const overallRate = overallRateUpTo(upTo);
  const prevOverall = upTo.length > 1 ? overallRateUpTo(upTo.slice(0, -1)) : null;

  const rows: MemberRow[] = targets.map((member) => {
    const cells = upTo.map((week) => {
      const submission = subOf(member.id, week.id);
      return { week, submission, state: getSubmitState(week, submission, now) };
    });
    const counted = cells.filter((c) => c.state !== 'PENDING');
    const rate = pct(counted.filter((c) => isSubmitted(c.state)).length, counted.length);
    // 주의 필요 기준(회의 결정): 최근 2주 동안 지연/미제출
    const lastTwo = cells.filter((c) => isDue(c.week, now)).slice(-2);
    const issues = lastTwo.filter((c) => c.state === 'LATE' || c.state === 'MISSING');
    const health: MemberHealth = issues.length >= 2 ? 'ALERT' : issues.length === 1 ? 'WATCH' : 'GOOD';
    const reason = issues.length ? `최근 2주 ${lastTwo.map((c) => STATE_LABEL[c.state]).join(' · ')}` : '최근 2주 모두 제출';
    return { member, cells, rate, health, reason };
  });

  const missingMembers = selectedWeek ? targets.filter((m) => !subOf(m.id, selectedWeek.id)) : [];

  return {
    targets,
    columns: upTo,
    overallRate,
    overallDiff: overallRate !== null && prevOverall !== null ? overallRate - prevOverall : null,
    selectedRate: selectedWeek ? weekRate(selectedWeek) : null,
    daysLeft: selectedWeek ? daysUntil(selectedWeek.deadline, now) : null,
    missingMembers,
    rows,
    attention: rows.filter((r) => r.health !== 'GOOD').sort((a, b) => (a.health === 'ALERT' ? -1 : 1) - (b.health === 'ALERT' ? -1 : 1)),
    weeklyRates: upTo.map((w) => ({ weekId: w.id, label: `${w.weekNo}주`, rate: weekRate(w) ?? 0, selected: w.id === selectedWeek?.id })),
  };
}
