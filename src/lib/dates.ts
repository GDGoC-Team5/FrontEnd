/**
 * 날짜 도우미. 백엔드(LocalDateTime)는 "2026-10-04T22:00:00" 처럼 시간대 없는 문자열을 준다고 가정했어요.
 * new Date("2026-10-04T22:00:00") 는 브라우저의 현지 시간(한국)으로 읽혀요.
 */
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "YYYY-MM-DDTHH:mm:ss" (백엔드로 보낼 형식) */
export function toLocalDateTimeString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/** <input type="datetime-local"> 값으로 변환 */
export function toInputValue(value?: string | null): string {
  const d = parseDate(value);
  return d ? toLocalDateTimeString(d).slice(0, 16) : '';
}

/** <input type="datetime-local"> 값 → 백엔드 형식 */
export function fromInputValue(value: string): string | null {
  return value ? `${value}:00` : null;
}

/** 9/29 */
export function fmtMD(value?: string | null): string {
  const d = parseDate(value);
  return d ? `${d.getMonth() + 1}/${d.getDate()}` : '-';
}

/** 10/4 (토) */
export function fmtMDDay(value?: string | null): string {
  const d = parseDate(value);
  return d ? `${d.getMonth() + 1}/${d.getDate()} (${DAYS[d.getDay()]})` : '-';
}

/** 10/4 (토) 22:00 */
export function fmtMDDayTime(value?: string | null): string {
  const d = parseDate(value);
  return d ? `${fmtMDDay(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '-';
}

/** 10월 9일(금) */
export function fmtKoreanDate(value?: string | null): string {
  const d = parseDate(value);
  return d ? `${d.getMonth() + 1}월 ${d.getDate()}일(${DAYS[d.getDay()]})` : '-';
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 오늘부터 며칠 남았는지 (오늘이면 0, 지났으면 음수) */
export function daysUntil(value?: string | null, now: Date = new Date()): number | null {
  const d = parseDate(value);
  if (!d) return null;
  return Math.round((startOfDay(d) - startOfDay(now)) / DAY_MS);
}

/** D-6 / D-DAY / 마감 */
export function dDayLabel(value?: string | null, now: Date = new Date()): string {
  const d = parseDate(value);
  if (!d) return '-';
  if (d.getTime() < now.getTime()) return '마감';
  const left = daysUntil(value, now) ?? 0;
  return left <= 0 ? 'D-DAY' : `D-${left}`;
}
