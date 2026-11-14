'use client';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { errorMessage } from '@/api/errors';
import { cancelBestMember, getBestMember, getWeekSubmissions, selectBestMember, updateBestMember } from '@/api/submissions';
import { getWeeks } from '@/api/weeks';
import SubmissionDialog from '@/components/SubmissionDialog';
import WeekSelect from '@/components/WeekSelect';
import { EmptyBox, ErrorBox, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { useAsync } from '@/lib/useAsync';
import { useSelectedWeek } from '@/lib/useSelectedWeek';
import { colors } from '@/theme/theme';
import type { StudyMember, Submission } from '@/types/api';

function summary(sub: Submission) {
  if (sub.title) return sub.title;
  const firstLine = (sub.content ?? '').split('\n').map((l) => l.replace(/^#+\s*/, '').trim()).find(Boolean);
  return firstLine || '링크만 제출했어요';
}

/** 피그마 Student-mvp (주차별 우수 스터디원) */
export default function BestMemberPage() {
  const { studyId, study, members } = useStudy();
  const toast = useToast();
  const weeksQ = useAsync(() => getWeeks(studyId), [studyId]);
  const { weekId, setWeekId, week } = useSelectedWeek(weeksQ.data);
  const dataQ = useAsync(async () => {
    if (!weekId) return { subs: [] as Submission[], best: null };
    const [subs, best] = await Promise.all([getWeekSubmissions(weekId), getBestMember(weekId)]);
    return { subs, best };
  }, [weekId]);
  const [picking, setPicking] = useState<{ member: StudyMember; reason: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Submission | null>(null);

  const subs = dataQ.data?.subs ?? [];
  const best = dataQ.data?.best ?? null;
  const memberOf = (memberId: number) => members.find((m) => m.id === memberId);
  const bestMember = best ? memberOf(best.memberId) : undefined;
  const memberKey = (submission: Submission) => submission.userId ?? submission.memberId;
  const targets = members.filter((m) => m.role === 'MEMBER');
  const missingCount = targets.filter((m) => !subs.some((s) => memberKey(s) === m.id)).length;

  const confirmPick = async () => {
    if (!picking || !weekId) return;
    setSaving(true);
    try {
      const input = { member: picking.member, reason: picking.reason.trim() };
      if (best) await updateBestMember(weekId, input);
      else await selectBestMember(weekId, input);
      toast(`${picking.member.nickname}님을 ${week?.weekNo}주차 우수 스터디원으로 선정했어요 🏅`);
      setPicking(null);
      await dataQ.reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!weekId || !window.confirm('선정을 취소할까요?')) return;
    try {
      await cancelBestMember(weekId);
      toast('선정을 취소했어요.');
      await dataQ.reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  if (weeksQ.loading && !weeksQ.data) return <LoadingBox />;
  if (weeksQ.error) return <ErrorBox error={weeksQ.error} onRetry={() => void weeksQ.reload()} />;

  return (
    <Box>
      <PageHeader
        title="주차별 우수 스터디원"
        actions={
          <>
            <Box sx={{ bgcolor: '#fff', border: `1px solid ${colors.border}`, borderRadius: '6px', px: 1.5, height: 44, display: 'flex', alignItems: 'center', fontSize: 18 }}>
              {study.name}
            </Box>
            <WeekSelect weeks={weeksQ.data ?? []} value={weekId} onChange={setWeekId} highlight />
          </>
        }
      />

      {best && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: colors.primary, color: '#fff', borderRadius: '13px', px: 3, py: 2, mb: 2.5 }}>
          <EmojiEventsIcon sx={{ fontSize: 36 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, opacity: 0.85 }}>{week?.weekNo}주차 우수 스터디원</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
              {bestMember?.nickname ?? best.nickname ?? '스터디원'}
              {best.reason && (
                <Box component="span" sx={{ fontSize: 15, fontWeight: 500, ml: 1.5, opacity: 0.9 }}>
                  {best.reason}
                </Box>
              )}
            </Typography>
          </Box>
          <Button onClick={() => void cancel()} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }} variant="outlined" size="small">
            선정 취소
          </Button>
        </Box>
      )}

      {!week ? (
        <Panel>
          <EmptyBox>주차가 없어요.</EmptyBox>
        </Panel>
      ) : dataQ.loading && !dataQ.data ? (
        <LoadingBox />
      ) : dataQ.error ? (
        <ErrorBox error={dataQ.error} onRetry={() => void dataQ.reload()} />
      ) : subs.length === 0 ? (
        <Panel>
          <EmptyBox>이 주차엔 아직 제출한 스터디원이 없어요.</EmptyBox>
        </Panel>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
            {subs.map((sub) => {
              const m = memberOf(memberKey(sub));
              const isBest = best?.memberId === memberKey(sub);
              return (
                <Box
                  key={sub.id}
                  sx={{
                    bgcolor: '#fff',
                    border: `1px solid ${isBest ? colors.primary : colors.border}`,
                    boxShadow: isBest ? `0 0 0 2px ${colors.primarySoft}` : 'none',
                    borderRadius: '13px',
                    p: 2,
                    minHeight: 130,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                    {m?.nickname ?? sub.nickname ?? '스터디원'} {isBest && '🏅'}
                  </Typography>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setDetail(sub)}
                    sx={{ all: 'unset', cursor: 'pointer', fontSize: 12, color: colors.textMuted, mt: 1, mb: 2, '&:hover': { textDecoration: 'underline' } }}
                    title="기록 보기"
                  >
                    {summary(sub)}
                  </Box>
                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      size="small"
                      disabled={isBest || !m}
                      onClick={() => m && setPicking({ member: m, reason: '' })}
                      sx={{ bgcolor: colors.primarySoft, border: `1px solid ${colors.primaryBorder}`, fontSize: 15, px: 1.25, '&:hover': { bgcolor: '#d9d6fb' } }}
                    >
                      {isBest ? '선정됨' : '우수 선정'}
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Box>
          {missingCount > 0 && <Typography sx={{ mt: 2, fontSize: 13, color: colors.textSub }}>미제출 {missingCount}명은 목록에서 뺐어요.</Typography>}
        </>
      )}

      <Dialog open={!!picking} onClose={() => !saving && setPicking(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{picking?.member.nickname}님을 우수 스터디원으로</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.textMuted, fontSize: 14, mb: 1.5 }}>
            {best ? `지금 선정된 ${bestMember?.nickname ?? ''}님 대신 바뀌어요. ` : ''}선정 이유를 짧게 남겨 주세요.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            placeholder="예: 세션 흐름을 다이어그램으로 정리"
            value={picking?.reason ?? ''}
            onChange={(e) => picking && setPicking({ ...picking, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={() => setPicking(null)} disabled={saving}>
            취소
          </Button>
          <Button variant="contained" onClick={() => void confirmPick()} disabled={saving}>
            {saving ? '저장 중…' : '선정하기'}
          </Button>
        </DialogActions>
      </Dialog>

      <SubmissionDialog submission={detail} nickname={detail ? memberOf(memberKey(detail))?.nickname : undefined} onClose={() => setDetail(null)} />
    </Box>
  );
}
