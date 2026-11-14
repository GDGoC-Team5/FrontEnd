'use client';

import { Box, Button, ButtonBase, LinearProgress, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { errorMessage } from '@/api/errors';
import { loadHomeStudies } from '@/api/dashboard';
import { joinStudy } from '@/api/studies';
import InviteCodeDialog from '@/components/InviteCodeDialog';
import StatusChip from '@/components/StatusChip';
import { EmptyBox, ErrorBox, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { dDayLabel, fmtKoreanDate } from '@/lib/dates';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';
import type { StudyDetail, StudySummary } from '@/types/api';
import CreateStudyDialog from './CreateStudyDialog';

function studyHome(study: { id: number; myRole?: string }) {
  return study.myRole === 'MANAGER' ? `/studies/${study.id}/manage` : `/studies/${study.id}/dashboard`;
}

function StudyCard({ study, onOpen }: { study: StudySummary; onOpen: () => void }) {
  const isManager = study.myRole === 'MANAGER';
  const submitted = study.currentWeekSubmittedCount ?? 0;
  const target = study.currentWeekTargetCount ?? 0;
  const meta = [
    study.memberCount !== undefined ? `멤버 ${study.memberCount}명` : null,
    study.nextDeadline ? `다음 마감 ${fmtKoreanDate(study.nextDeadline)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ButtonBase
      onClick={onOpen}
      sx={{
        display: 'block',
        textAlign: 'left',
        bgcolor: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: '17px',
        p: 3,
        minHeight: 168,
        transition: 'box-shadow .15s, transform .15s',
        '&:hover': { boxShadow: '0 6px 20px rgba(30,27,75,0.08)', transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StatusChip kind={isManager ? 'MANAGER' : 'MEMBER'} size="sm" />
        {study.currentWeekNo != null && <Typography sx={{ fontSize: 13, color: colors.textMuted }}>{study.currentWeekNo}주차 진행 중</Typography>}
      </Box>
      <Typography sx={{ fontSize: 21, fontWeight: 700, mt: 1.5 }}>{study.name}</Typography>
      {meta && <Typography sx={{ fontSize: 13, color: colors.textMuted, mt: 0.75 }}>{meta}</Typography>}

      {isManager ? (study.currentWeekTargetCount !== undefined && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, mb: 1 }}>
            <Typography component="span" sx={{ fontSize: 13, color: colors.textMuted }}>
              이번 주 제출
            </Typography>
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 700 }}>
              {submitted}/{target}명
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={target ? (submitted / target) * 100 : 0}
            sx={{ height: 8, borderRadius: 99, bgcolor: '#e9e9ef', '& .MuiLinearProgress-bar': { bgcolor: colors.navy, borderRadius: 99 } }}
          />
        </Box>
      )) : (
        <Box sx={{ mt: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 13, color: colors.textMuted }}>이번 주 과제</Typography>
          {study.mySubmitted == null ? (
            <StatusChip kind="PENDING" label="과제 없음" size="sm" />
          ) : study.mySubmitted ? (
            <StatusChip kind="SUBMITTED" size="sm" />
          ) : (
            <StatusChip kind="NOT_SUBMITTED" label={`미제출 ${dDayLabel(study.nextDeadline)}`} size="sm" />
          )}
        </Box>
      )}
    </ButtonBase>
  );
}

export default function HomePage() {
  const user = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { data: studies, loading, error, reload } = useAsync(() => (user ? loadHomeStudies() : Promise.resolve([] as StudySummary[])), [user?.id]);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<StudyDetail | null>(null);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast('운영진에게 받은 초대 코드를 입력해 주세요.', 'warning');
      return;
    }
    setJoining(true);
    try {
      const study = await joinStudy(code.trim());
      toast(`${study.name}에 참여했어요!`);
      setCode('');
      router.push(`/studies/${study.id}/dashboard`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setJoining(false);
    }
  };

  if (!user) return <LoadingBox minHeight={400} />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg }}>
      <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2, fontSize: 14, color: colors.textMuted }}>
          <span>{user.nickname}님</span>
          <Box component="button" type="button" onClick={() => void logout()} sx={{ border: 0, background: 'none', p: 0, color: colors.textMuted, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}>
            로그아웃
          </Box>
        </Box>

        <PageHeader
          title="내 스터디"
          subtitle="참여 중인 스터디"
          actions={
            <Button variant="contained" color="secondary" size="large" onClick={() => setCreateOpen(true)} sx={{ px: 3.5, fontSize: 20 }}>
              +스터디 만들기
            </Button>
          }
        />

        <Panel title="초대 코드로 참여하기" sx={{ mb: 3.5 }}>
          <Box component="form" onSubmit={handleJoin} sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="운영진에게 받은 코드를 입력하세요."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              slotProps={{ htmlInput: { 'aria-label': '초대 코드' } }}
            />
            <Button type="submit" variant="outlined" color="inherit" disabled={joining} sx={{ minWidth: 108, borderRadius: '13px', fontSize: 18, borderColor: colors.border, bgcolor: '#fff' }}>
              {joining ? '참여 중…' : '참여하기'}
            </Button>
          </Box>
        </Panel>

        {loading && <LoadingBox />}
        {error && <ErrorBox error={error} onRetry={() => void reload()} />}
        {!loading && studies && studies.length === 0 && (
          <Panel>
            <EmptyBox>아직 참여한 스터디가 없어요. 초대 코드로 참여하거나 새 스터디를 만들어 보세요.</EmptyBox>
          </Panel>
        )}
        {studies && studies.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 1.75 }}>
            {studies.map((s) => (
              <StudyCard key={s.id} study={s} onOpen={() => router.push(studyHome(s))} />
            ))}
          </Box>
        )}
      </Box>

      <CreateStudyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(study) => {
          setCreateOpen(false);
          setCreated(study);
          void reload();
        }}
      />
      <InviteCodeDialog
        open={!!created}
        code={created?.inviteCode}
        onClose={() => setCreated(null)}
        extraAction={
          <Button variant="contained" onClick={() => created && router.push(`/studies/${created.id}/manage`)}>
            스터디로 이동
          </Button>
        }
      />
    </Box>
  );
}
