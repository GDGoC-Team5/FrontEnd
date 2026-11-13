'use client';

import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Button, ButtonBase, Collapse, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { errorMessage } from '@/api/errors';
import { createMaterial, createWeek, deleteMaterial, deleteWeek, getMaterials, getWeeks, updateWeek } from '@/api/weeks';
import MaterialLinks from '@/components/MaterialLinks';
import StatusChip, { type ChipKind } from '@/components/StatusChip';
import { EmptyBox, ErrorBox, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { fmtMDDayTime } from '@/lib/dates';
import { getWeekPhase, pickCurrentWeek, type WeekPhase } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';
import type { MaterialLink, Week, WeekInput } from '@/types/api';
import WeekDialog, { ASSIGNMENT_TYPES } from './WeekDialog';

const PHASE_CHIP: Record<WeekPhase, ChipKind> = { CURRENT: 'CURRENT', DONE: 'ENDED', UPCOMING: 'UPCOMING' };

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, color: colors.textSub, fontWeight: 600, mb: 1, px: 0.5 }}>{label}</Typography>
      <Box
        sx={{
          bgcolor: '#fff',
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          minHeight: 56,
          px: 1.25,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 13,
          wordBreak: 'keep-all',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

/** 주차별 세션 자료 (펼쳤을 때 불러와요) */
function WeekMaterials({ weekId }: { weekId: number }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => getMaterials(weekId), [weekId]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const register = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !/^https?:\/\/\S+$/i.test(url.trim())) {
      toast('자료 제목과 HTTP 또는 HTTPS 링크를 입력해 주세요.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await createMaterial(weekId, { title: title.trim(), url: url.trim() });
      setTitle('');
      setUrl('');
      await reload();
      toast('세션 자료를 등록했어요.');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (material: MaterialLink) => {
    if (!window.confirm(`「${material.title}」 자료를 삭제할까요?`)) return;
    setBusy(true);
    try {
      await deleteMaterial(material.id);
      await reload();
      toast('세션 자료를 삭제했어요.');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, color: colors.textSub, fontWeight: 600, mb: 1, px: 0.5 }}>세션 자료</Typography>
      <Box component="form" onSubmit={register} sx={{ display: 'grid', gap: 0.75 }}>
        <TextField size="small" label="자료 제목" value={title} required disabled={busy}
          onChange={(event) => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />
        <TextField size="small" label="자료 링크" placeholder="https://" type="url" value={url} required disabled={busy}
          onChange={(event) => setUrl(event.target.value)} slotProps={{ htmlInput: { maxLength: 2048 } }} />
        <Button type="submit" size="small" variant="outlined" disabled={busy}>자료 등록</Button>
      </Box>
      {loading && !data && <LoadingBox minHeight={56} />}
      {error && <ErrorBox error={error} onRetry={() => void reload()} />}
      {!error && <MaterialLinks key={weekId} materials={data ?? []} busy={busy} onDelete={remove} />}
    </Box>
  );
}
/** 피그마 Student-week-management (주차·세션 관리) */
export default function WeeksPage() {
  const { studyId, study } = useStudy();
  const toast = useToast();
  const { data: weeks, loading, error, reload } = useAsync(() => getWeeks(studyId), [studyId]);
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState<{ open: boolean; week: Week | null }>({ open: false, week: null });

  const current = weeks ? pickCurrentWeek(weeks) : null;

  // 처음엔 이번 주차만 펼쳐 두기 (유리 피드백: 지난 주차는 토글로)
  useEffect(() => {
    if (current) setOpenIds((prev) => (prev.size ? prev : new Set([current.id])));
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = async (input: WeekInput) => {
    if (dialog.week) {
      await updateWeek(dialog.week.id, input);
      toast(`${input.weekNo}주차를 수정했어요.`);
    } else {
      const created = await createWeek(studyId, input);
      setOpenIds((prev) => new Set(prev).add(created.id));
      toast(`${input.weekNo}주차를 만들었어요.`);
    }
    setDialog({ open: false, week: null });
    await reload();
  };

  const handleDelete = async (w: Week) => {
    if (!window.confirm(`${w.weekNo}주차를 삭제할까요? 제출물이나 자료가 남아 있으면 삭제할 수 없어요.`)) return;
    try {
      await deleteWeek(w.id);
      toast(`${w.weekNo}주차를 삭제했어요.`);
      await reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const sorted = [...(weeks ?? [])].sort((a, b) => b.weekNo - a.weekNo);
  const nextWeekNo = (weeks ?? []).reduce((max, w) => Math.max(max, w.weekNo), 0) + 1;

  return (
    <Box>
      <PageHeader
        title="주차 · 세션 관리"
        actions={
          <>
            <Box sx={{ bgcolor: '#fff', borderRadius: '6px', px: 1.5, py: 0.75, fontWeight: 700, fontSize: 17 }}>{study.name}</Box>
            <Button variant="contained" onClick={() => setDialog({ open: true, week: null })} sx={{ fontSize: 17 }}>
              + 주차 추가
            </Button>
          </>
        }
      />

      {loading && !weeks && <LoadingBox />}
      {error && <ErrorBox error={error} onRetry={() => void reload()} />}
      {weeks && weeks.length === 0 && (
        <Panel>
          <EmptyBox action={<Button variant="contained" onClick={() => setDialog({ open: true, week: null })}>첫 주차 만들기</Button>}>
            아직 주차가 없어요.
          </EmptyBox>
        </Panel>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {sorted.map((w) => {
          const phase = getWeekPhase(w, current);
          const isOpen = openIds.has(w.id);
          const typeLabel = ASSIGNMENT_TYPES.find((t) => t.value === w.assignmentType)?.label;
          return (
            <Box key={w.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ButtonBase onClick={() => toggle(w.id)} sx={{ gap: 0.5, borderRadius: '6px', pr: 1, py: 0.5 }} aria-expanded={isOpen}>
                  <ArrowRightIcon sx={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{w.weekNo}주차</Typography>
                </ButtonBase>
                <StatusChip kind={PHASE_CHIP[phase]} size="sm" />
                <Typography sx={{ color: colors.textMuted, fontSize: 15, ml: 1, flex: 1, minWidth: 0 }} noWrap>
                  {w.title}
                </Typography>
                <Tooltip title="수정">
                  <IconButton size="small" onClick={() => setDialog({ open: true, week: w })} aria-label={`${w.weekNo}주차 수정`}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="삭제">
                  <IconButton size="small" onClick={() => void handleDelete(w)} aria-label={`${w.weekNo}주차 삭제`}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Collapse in={isOpen} unmountOnExit>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr))' }, gap: 1.25, mt: 1.5, mb: 1.5 }}>
                  <Cell label="세션 일시">{fmtMDDayTime(w.sessionAt)}</Cell>
                  <Cell label="장소">{w.location || '-'}</Cell>
                  <Cell label="마감일">{fmtMDDayTime(w.deadline)}</Cell>
                  <Cell label="과제 설명">
                    <Box component="span" title={w.assignmentDescription ?? ''} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {typeLabel ? `[${typeLabel}] ` : ''}
                      {w.assignmentDescription || '-'}
                    </Box>
                  </Cell>
                  <WeekMaterials weekId={w.id} />
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      <WeekDialog
        open={dialog.open}
        week={dialog.week}
        defaultWeekNo={nextWeekNo}
        onClose={() => setDialog({ open: false, week: null })}
        onSubmit={handleSave}
      />
    </Box>
  );
}
