'use client';

import { Box, Button, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { loadMySubmissions } from '@/api/dashboard';
import { errorMessage } from '@/api/errors';
import { createSubmission, updateSubmission } from '@/api/submissions';
import DonutProgress from '@/components/DonutProgress';
import MyHistoryTable from '@/components/MyHistoryTable';
import { EmptyBox, ErrorBox, LoadingBox, Panel } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { dDayLabel, fmtMDDayTime } from '@/lib/dates';
import { USE_MOCK } from '@/lib/config';
import { computeStudentStats, isDue } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';

/** 피그마 Student-dashboard */
export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { studyId, study, myRole } = useStudy();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => loadMySubmissions(studyId), [studyId]);
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const stats = data ? computeStudentStats(data.weeks, data.mySubs) : null;
  const current = stats?.current ?? null;
  const mine = stats?.currentSubmission ?? null;

  useEffect(() => {
    setLink(mine?.originalLink ?? '');
  }, [mine?.id, mine?.originalLink]);

  const handleSubmitLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!current || (!USE_MOCK && current.assignmentType !== 'LINK')) return;
    if (!/^https?:\/\//.test(link.trim())) {
      toast('https:// 로 시작하는 링크를 넣어 주세요.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (mine) {
        await updateSubmission(mine.id, { originalLink: link.trim() });
        toast('링크를 수정했어요.');
      } else {
        await createSubmission(current.id, { originalLink: link.trim(), title: current.title });
        toast('제출했어요! 수고했어요 🎉');
      }
      await reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <LoadingBox />;
  if (error) return <ErrorBox error={error} onRetry={() => void reload()} />;
  if (!stats) return null;

  return (
    <Box>
      <Typography component="h1" sx={{ fontSize: { xs: 34, md: 48 }, fontWeight: 600, letterSpacing: '-0.03em', mb: 4 }}>
        안녕하세요. {user?.nickname}님
      </Typography>

      {/* 이번 주 배너 */}
      {current ? (
        <Box
          sx={{
            bgcolor: colors.primary,
            color: '#fefefe',
            borderRadius: '17px',
            px: { xs: 3, md: 4 },
            py: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3,
            mb: 5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, opacity: 0.9 }}>이번 주 · {current.weekNo}주차</Typography>
            <Typography sx={{ fontSize: { xs: 28, md: 43 }, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.25, mt: 0.5 }}>{current.title}</Typography>
            <Typography sx={{ fontSize: 17, fontWeight: 600, opacity: 0.9, mt: 1.5 }}>
              {[current.sessionAt ? fmtMDDayTime(current.sessionAt) : null, current.location || study.name, current.deadline ? `제출 기한 ${fmtMDDayTime(current.deadline)}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
          <Box sx={{ bgcolor: '#fefefe', color: '#000', borderRadius: '17px', minWidth: 105, height: 85, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Typography sx={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em' }}>{dDayLabel(current.deadline)}</Typography>
          </Box>
        </Box>
      ) : (
        <Panel sx={{ mb: 5 }}>
          <EmptyBox>아직 등록된 주차가 없어요. 운영진이 주차를 만들면 여기에 이번 주 과제가 보여요.</EmptyBox>
        </Panel>
      )}

      {/* 링크드인 링크 제출 */}
      {current && (USE_MOCK || current.assignmentType === 'LINK') && (
        <Panel title="과제 링크 제출" sx={{ mb: 5 }}>
          <Box component="form" onSubmit={handleSubmitLink} sx={{ display: 'flex', gap: 2.5 }}>
            <TextField fullWidth placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
            <Button type="submit" variant="contained" disabled={saving} sx={{ minWidth: 116, fontSize: 18 }}>
              {saving ? '저장 중…' : mine ? '수정하기' : '제출하기'}
            </Button>
          </Box>
          <Typography sx={{ color: colors.textSub, fontSize: 15, fontWeight: 500, mt: 1.5 }}>
            {mine
              ? `제출 완료 (${fmtMDDayTime(mine.submittedAt)}) · 제출 기한 내 수정이 가능합니다`
              : isDue(current)
                ? '마감이 지났어요. 지금 제출하면 ‘지연’으로 기록돼요.'
                : '제출 기한 내 수정이 가능합니다'}
            {' · '}
            <Link href={`/studies/${studyId}/submit`} style={{ color: colors.primary }}>
              제출 상세 및 세션 자료
            </Link>
          </Typography>
        </Panel>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.32fr) minmax(0, 1fr)' }, gap: 3 }}>
        <Panel title="내 제출 이력">
          {stats.rows.length ? <MyHistoryTable rows={stats.rows} /> : <EmptyBox>아직 이력이 없어요.</EmptyBox>}
        </Panel>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Panel sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, mb: 2 }}>내 진행률</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <DonutProgress value={stats.progress} />
            </Box>
            <Typography sx={{ color: colors.textSub, fontSize: 15, fontWeight: 600, mt: 1.5 }}>
              {stats.countedWeeks}주 중 {stats.submittedCount}회 제출
            </Typography>
          </Panel>

          <Panel title="AI 빈틈 피드백">
            <Typography sx={{ color: colors.textSub, fontSize: 15, fontWeight: 600 }}>다른 스터디원의 정리본과 비교해 빠진 개념을 알려드려요</Typography>
            <Box sx={{ mt: 2, p: 2, borderRadius: '13px', bgcolor: colors.bg, color: colors.textMuted, fontSize: 14 }}>
              추가 기능으로 준비 중이에요. (ERD의 ai_feedback 테이블은 있지만 아직 API가 없어요)
            </Box>
          </Panel>
        </Box>
      </Box>

      {myRole === 'MANAGER' && (
        <Typography sx={{ mt: 4, color: colors.textMuted, fontSize: 14 }}>
          운영진이라 스터디원 화면을 미리보기로 보고 있어요. <Link href={`/studies/${studyId}/manage`}>운영진 대시보드로 가기</Link>
        </Typography>
      )}
    </Box>
  );
}
