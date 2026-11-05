'use client';

import { Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { loadMySubmissions } from '@/api/dashboard';
import MyHistoryTable from '@/components/MyHistoryTable';
import { EmptyBox, ErrorBox, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';
import { computeStudentStats } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';

/** 피그마 Student-homework (내 제출 이력) */
export default function HistoryPage() {
  const { studyId } = useStudy();
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(() => loadMySubmissions(studyId), [studyId]);

  if (loading && !data) return <LoadingBox />;
  if (error) return <ErrorBox error={error} onRetry={() => void reload()} />;
  const stats = data ? computeStudentStats(data.weeks, data.mySubs) : null;

  return (
    <>
      <PageHeader title="내 제출 이력" subtitle={stats ? `${stats.countedWeeks}주 중 ${stats.submittedCount}회 제출` : undefined} />
      <Panel>
        {stats?.rows.length ? (
          <>
            <MyHistoryTable rows={stats.rows} onRowClick={(r) => router.push(`/studies/${studyId}/submit?week=${r.week.id}`)} />
            <Typography sx={{ mt: 2, fontSize: 13, color: colors.textSub }}>줄을 누르면 그 주차 기록을 보거나 고칠 수 있어요.</Typography>
          </>
        ) : (
          <EmptyBox>아직 제출 이력이 없어요.</EmptyBox>
        )}
      </Panel>
    </>
  );
}
