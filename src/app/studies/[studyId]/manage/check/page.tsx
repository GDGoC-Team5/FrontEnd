'use client';

import { Box, Checkbox, Link as MuiLink, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useState } from 'react';
import { errorMessage } from '@/api/errors';
import { checkSubmission, getWeekSubmissions } from '@/api/submissions';
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

  const targets = members.filter((m) => m.role === 'MEMBER');
  const subs = subsQ.data ?? [];

  const toggleCheck = async (sub: Submission) => {
    const next = sub.checkStatus === 'CHECKED' ? 'UNCHECKED' : 'CHECKED';
    setPending(sub.id);
    // 먼저 화면부터 바꾸고(빠르게 보이게), 실패하면 되돌려요
    subsQ.setData(subs.map((s) => (s.id === sub.id ? { ...s, checkStatus: next } : s)));
    try {
      await checkSubmission(sub.id, next);
    } catch (e) {
      subsQ.setData(subs);
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
      <PageHeader title="과제 수행 체크" actions={<WeekSelect weeks={weeksQ.data ?? []} value={weekId} onChange={setWeekId} />} />
      <Panel
        title="멤버별 제출 이력"
        action={week && <Typography sx={{ color: colors.textMuted, fontSize: 14 }}>제출 {subs.length}/{targets.length} · 체크 {checkedCount}</Typography>}
      >
        {!week ? (
          <EmptyBox>주차가 없어요.</EmptyBox>
        ) : subsQ.loading && !subsQ.data ? (
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
                  const sub = subs.find((s) => s.memberId === m.id) ?? null;
                  const state = getSubmitState(week, sub);
                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        {sub ? (
                          <MuiLink component="button" type="button" underline="hover" onClick={() => setDetail(sub)} sx={{ color: 'inherit', font: 'inherit' }}>
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
                          disabled={!sub || pending === sub.id}
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

      <SubmissionDialog submission={detail} nickname={members.find((m) => m.id === detail?.memberId)?.nickname} onClose={() => setDetail(null)} />
    </Box>
  );
}
