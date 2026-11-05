'use client';

import { useEffect, useState } from 'react';
import type { Week } from '@/types/api';
import { pickCurrentWeek } from './stats';

/** 주차 드롭다운 상태. 처음엔 '이번 주차'로 맞춰져요. */
export function useSelectedWeek(weeks: Week[] | undefined) {
  const [weekId, setWeekId] = useState<number | null>(null);

  useEffect(() => {
    if (!weeks) return;
    if (weekId === null || !weeks.some((w) => w.id === weekId)) {
      setWeekId(pickCurrentWeek(weeks)?.id ?? null);
    }
  }, [weeks, weekId]);

  const week = weeks?.find((w) => w.id === weekId) ?? null;
  return { weekId, setWeekId, week };
}
