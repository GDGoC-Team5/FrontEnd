'use client';

import { Box, Checkbox, Link as MuiLink, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useState } from 'react';
import { errorMessage } from '@/api/errors';
import { checkSubmission, getSubmission, getWeekSubmissions } from '@/api/submissions';
import { getWeeks } from '@/api/weeks';
import StatusChip from '@/components/StatusChip';
import SubmissionDialog from '@/components/SubmissionDialog';
import WeekSelect from '@/components/WeekSelect';
import { EmptyBox, ErrorBox, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { fmtMD } from '@/lib/dates';
import { getSubmitState } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { useSelectedWeek } from '@/lib/useSelectedWeek';
import { colors } from '@/theme/theme';
import type { Submission } from '@/types/api';

const shortLink = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '');

/** 피그마 Student-homework (과제 수행 체크 — 운영진) */
export default function CheckPage() {
  const { studyId, members } = useStudy();
  const toast = useToast();
  const weeksQ = useAsync(() => getWeeks(studyId), [studyId]);
  const { weekId, setWeekId, week } = useSelectedWeek(weeksQ.data);
  const subsQ = useAsync(() => (weekId ? getWeekSubmissions(weekId) : Promise.resolve([] as Submission[])), [weekId]);
  const [detail, setDetail] = useState<Submission | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  const subs = subsQ.data ?? [];
  const targets = members.filter((m) => m.role === 'MEMBER' || subs.some((s) =>
    s.userId !== undefined ? s.userId === m.userId : s.memberId === m.id,
  ));

  const openDetail = async (id: number) => {
    try {
      setDetail(await getSubmission(id));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const toggleCheck = async (sub: Submission) => {
    if (pending !== null || subsQ.loading) return;
    const next = sub.checkStatus === 'CHECKED' ? 'UNCHECKED' : 'CHECKED';
    setPending(sub.id);
    try {
      const saved = await checkSubmission(sub.id, next);
      subsQ.setData((previous) => previous?.map((item) => item.id === saved.id ? saved : item));
      setDetail((previous) => previous?.id === saved.id ? saved : previous);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setPending(null);
    }
  };

  if (weeksQ.loading && !weeksQ.data) return <LoadingBox />;
  if (weeksQ.error) return <ErrorBox error={weeksQ.error} onRetry={() => void weeksQ.reload()} />;

  const checkedCount = subs.filter((s) => s.checkStatus === 'CHECKED').length;

  return (
    <Box>
      <PageHeader title="과제 수행 체크" actions={<WeekSelect weeks={weeksQ.data ?? []} value={weekId} onChange={(id) => {
        subsQ.setData(undefined);
        setDetail(null);
        setWeekId(id);
      }} disabled={pending !== null} />} />
      <Panel
        title="멤버별 제출 이력"
        action={week && <Typography sx={{ color: colors.textMuted, fontSize: 14 }}>제출 {subs.length}/{targets.length} · 체크 {checkedCount}</Typography>}
      >
        {!week ? (
          <EmptyBox>주차가 없어요.</EmptyBox>
        ) : subsQ.loading ? (
          <LoadingBox minHeight={200} />
        ) : subsQ.error ? (
          <ErrorBox error={subsQ.error} onRetry={() => void subsQ.reload()} />
        ) : targets.length === 0 ? (
          <EmptyBox>아직 스터디원이 없어요.</EmptyBox>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>멤버</TableCell>
                  <TableCell>제출일</TableCell>
                  <TableCell>링크</TableCell>
                  <TableCell align="center">상태</TableCell>
                  <TableCell align="center">수행 체크</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {targets.map((m) => {
                  const sub = subs.find((s) => s.userId !== undefined ? s.userId === m.userId : s.memberId === m.id) ?? null;
                  const state = getSubmitState(week, sub);
                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        {sub ? (
                          <MuiLink component="button" type="button" underline="hover" onClick={() => void openDetail(sub.id)} sx={{ color: 'inherit', font: 'inherit' }}>
                            {m.nickname}
                          </MuiLink>
                        ) : (
                          m.nickname
                        )}
                      </TableCell>
                      <TableCell>{sub ? fmtMD(sub.submittedAt) : '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sub?.originalLink ? (
                          <a href={sub.originalLink} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                            {shortLink(sub.originalLink)}
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <StatusChip kind={state} size="sm" />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={sub?.checkStatus === 'CHECKED'}
                          disabled={!sub || pending !== null || subsQ.loading}
                          onChange={() => sub && void toggleCheck(sub)}
                          inputProps={{ 'aria-label': `${m.nickname} 수행 체크` }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Panel>

      <SubmissionDialog submission={detail} nickname={detail?.nickname} onClose={() => setDetail(null)} />
    </Box>
  );
}
