'use client';

import { Box, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { getBestMember } from '@/api/submissions';
import { ErrorBox, Panel } from '@/components/ui';
import WeekSelect from '@/components/WeekSelect';
import { useStudy } from '@/contexts/StudyContext';
import { isDue, pickCurrentWeek } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';
import type { Week } from '@/types/api';

/** 우수 스터디원은 보통 마감 뒤에 뽑으니, 기본값은 '마감이 지난 가장 최근 주차' (없으면 이번 주차) */
function pickDefaultWeek(weeks: Week[]): Week | null {
  const due = weeks.filter((w) => isDue(w));
  return due.length ? due[due.length - 1] : pickCurrentWeek(weeks);
}

/** 피그마 Student-dashboard 오른쪽 아래 "우수 스터디원 [6주차 ⌄]" */
export default function BestMemberCard({ weeks }: { weeks: Week[] }) {
  const { members } = useStudy();

  // 아직 시작 안 한 미래 주차는 드롭다운에서 뺌
  const options = useMemo(() => {
    const current = pickCurrentWeek(weeks);
    return current ? weeks.filter((w) => w.weekNo <= current.weekNo) : weeks;
  }, [weeks]);

  const [weekId, setWeekId] = useState<number | null>(null);
  useEffect(() => {
    if (weekId === null || !options.some((w) => w.id === weekId)) {
      setWeekId(pickDefaultWeek(options)?.id ?? null);
    }
  }, [options, weekId]);

  const { data: best, loading, error, reload } = useAsync(
    async () => (weekId ? getBestMember(weekId) : null),
    [weekId],
  );

  const nickname = best
    ? (best.nickname ?? members.find((m) => m.id === best.memberId || m.userId === best.memberId)?.nickname ?? '스터디원')
    : null;

  return (
    <Panel
      title="우수 스터디원"
      action={options.length > 0 && <WeekSelect weeks={options} value={weekId} onChange={setWeekId} compact />}
      sx={{ display: 'flex', flexDirection: 'column' }}
    >
      {error ? (
        <ErrorBox error={error} onRetry={() => void reload()} />
      ) : (
        <Box sx={{ textAlign: 'center', py: 1, minHeight: 88, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {!weekId ? (
            <Typography sx={{ color: colors.textSub, fontSize: 15, fontWeight: 600 }}>아직 등록된 주차가 없어요.</Typography>
          ) : loading ? (
            <Typography sx={{ color: colors.textMuted, fontSize: 15 }}>불러오는 중…</Typography>
          ) : best ? (
            <>
              <Typography sx={{ fontSize: { xs: 34, md: 42 }, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                {nickname}
              </Typography>
              {best.reason && (
                <Typography sx={{ fontSize: 15, fontWeight: 700, mt: 1, wordBreak: 'keep-all' }}>{best.reason}</Typography>
              )}
            </>
          ) : (
            <Typography sx={{ color: colors.textSub, fontSize: 15, fontWeight: 600 }}>
              이 주차는 아직 우수 스터디원을 선정하지 않았어요.
            </Typography>
          )}
        </Box>
      )}
    </Panel>
  );
}