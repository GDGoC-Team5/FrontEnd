'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { fromInputValue, toInputValue } from '@/lib/dates';
import type { Week, WeekInput } from '@/types/api';

/** ⚠️ assignment_type 값은 백엔드와 맞춰야 해요 (지금은 임시 값) */
export const ASSIGNMENT_TYPES = [
  { value: 'LINKEDIN', label: '링크드인 글' },
  { value: 'BLOG', label: '블로그 글' },
  { value: 'NOTION', label: '노션 정리' },
  { value: 'FILE', label: '파일 제출' },
];

interface FormState {
  weekNo: string;
  title: string;
  assignmentType: string;
  assignmentDescription: string;
  sessionAt: string;
  location: string;
  deadline: string;
}

/** 주차 추가/수정 창 */
export default function WeekDialog({
  open,
  week,
  defaultWeekNo,
  onClose,
  onSubmit,
}: {
  open: boolean;
  week: Week | null;
  defaultWeekNo: number;
  onClose: () => void;
  onSubmit: (input: WeekInput) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>({ weekNo: '', title: '', assignmentType: 'LINKEDIN', assignmentDescription: '', sessionAt: '', location: '', deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({
      weekNo: String(week?.weekNo ?? defaultWeekNo),
      title: week?.title ?? '',
      assignmentType: week?.assignmentType ?? 'LINKEDIN',
      assignmentDescription: week?.assignmentDescription ?? '세션 내용을 정리해 링크드인에 올리고 링크를 제출해 주세요.',
      sessionAt: toInputValue(week?.sessionAt),
      location: week?.location ?? '',
      deadline: toInputValue(week?.deadline),
    });
  }, [open, week, defaultWeekNo]);

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('주차 제목을 입력해 주세요.');
    if (!Number(form.weekNo)) return setError('주차 번호를 입력해 주세요.');
    if (form.sessionAt && form.deadline && form.deadline < form.sessionAt) return setError('마감일이 세션 일시보다 빨라요.');
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        weekNo: Number(form.weekNo),
        title: form.title.trim(),
        assignmentType: form.assignmentType,
        assignmentDescription: form.assignmentDescription.trim() || null,
        sessionAt: fromInputValue(form.sessionAt),
        location: form.location.trim() || null,
        deadline: fromInputValue(form.deadline),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{week ? `${week.weekNo}주차 수정` : '주차 추가'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 2, pt: 1 }}>
          <TextField label="주차" type="number" value={form.weekNo} onChange={set('weekNo')} />
          <TextField label="제목" placeholder="예: Spring Security 세션 인증 정리" value={form.title} onChange={set('title')} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
          <TextField label="세션 일시" type="datetime-local" value={form.sessionAt} onChange={set('sessionAt')} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="장소" placeholder="예: 스터디룸 B" value={form.location} onChange={set('location')} />
          <TextField label="과제 마감일" type="datetime-local" value={form.deadline} onChange={set('deadline')} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField select label="과제 형식" value={form.assignmentType} onChange={set('assignmentType')}>
            {ASSIGNMENT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField label="과제 설명" multiline minRows={3} fullWidth value={form.assignmentDescription} onChange={set('assignmentDescription')} sx={{ mt: 2 }} />
        {error && <Box sx={{ mt: 2, color: 'error.main', fontSize: 14 }}>{error}</Box>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          취소
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? '저장 중…' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
