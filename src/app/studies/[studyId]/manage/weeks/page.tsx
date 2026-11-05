'use client';

import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Box, Button, ButtonBase, Collapse, IconButton, Tooltip, Typography } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { errorMessage } from '@/api/errors';
import { createWeek, deleteMaterial, deleteWeek, getMaterials, getWeeks, updateWeek, uploadMaterial } from '@/api/weeks';
import FileDropzone from '@/components/FileDropzone';
import StatusChip, { type ChipKind } from '@/components/StatusChip';
import { EmptyBox, ErrorBox, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { fmtMDDayTime } from '@/lib/dates';
import { getWeekPhase, pickCurrentWeek, type WeekPhase } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';
import type { SessionMaterial, Week, WeekInput } from '@/types/api';
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
  const [files, setFiles] = useState<SessionMaterial[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMaterials(weekId)
      .then((list) => !cancelled && setFiles(list))
      .catch(() => !cancelled && setFiles([]));
    return () => {
      cancelled = true;
    };
  }, [weekId]);

  const upload = async (list: File[]) => {
    setBusy(true);
    try {
      for (const f of list) {
        const m = await uploadMaterial(weekId, f);
        setFiles((prev) => [...(prev ?? []), m]);
      }
      toast('세션 자료를 올렸어요.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: SessionMaterial) => {
    try {
      await deleteMaterial(m.id);
      setFiles((prev) => (prev ?? []).filter((x) => x.id !== m.id));
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, color: colors.textSub, fontWeight: 600, mb: 1, px: 0.5 }}>세션 자료</Typography>
      <FileDropzone compact busy={busy} onFiles={(f) => void upload(f)} hint={'PDF · MD · TXT\n파일을 끌어다 놓기'} />
      {files?.map((m) => (
        <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, fontSize: 12 }}>
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 14, color: colors.textMuted }} />
          <Box component="span" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.originalFilename}>
            {m.originalFilename}
          </Box>
          <IconButton size="small" aria-label="자료 삭제" onClick={() => void remove(m)} sx={{ p: 0.25 }}>
            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      ))}
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
    if (!window.confirm(`${w.weekNo}주차를 삭제할까요? 이 주차의 제출물과 자료도 함께 지워져요.`)) return;
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
