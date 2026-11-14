'use client';

import { Box, Button, Divider, MenuItem, Select, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/api/errors';
import { createSubmission, deleteSubmission, getMySubmission, updateSubmission } from '@/api/submissions';
import { getMaterials, getWeeks } from '@/api/weeks';
import MaterialLinks from '@/components/MaterialLinks';
import StatusChip from '@/components/StatusChip';
import { EmptyBox, ErrorBox, Field, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { fmtMDDayTime } from '@/lib/dates';
import { USE_MOCK } from '@/lib/config';
import { getSubmitState, pickCurrentWeek } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';
import type { Submission } from '@/types/api';

interface Draft {
  title: string;
  content: string;
  originalLink: string;
}

function readDraft(key: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

/** 피그마 Student-homework2 (학습 기록 제출) */
export default function SubmitPage() {
  const { user } = useAuth();
  const { studyId } = useStudy();
  const toast = useToast();
  const { data: weeks, loading, error, reload } = useAsync(() => getWeeks(studyId), [studyId]);
  const [weekId, setWeekId] = useState<number | null>(null);
  const [mine, setMine] = useState<Submission | null>(null);
  const [form, setForm] = useState<Draft>({ title: '', content: '', originalLink: '' });
  const [saving, setSaving] = useState(false);
  const draftKey = USE_MOCK ? `studyhub-draft-${weekId}` : `studyhub-server-draft-${user?.id}-${weekId}`;
  const [loadedDraftKey, setLoadedDraftKey] = useState<string | null>(null);
  const materials = useAsync(() => weekId === null ? Promise.resolve([]) : getMaterials(weekId), [weekId]);

  // 처음엔 ?week= 로 넘어온 주차, 없으면 이번 주차
  useEffect(() => {
    if (!weeks || weekId !== null) return;
    const fromQuery = Number(new URLSearchParams(window.location.search).get('week'));
    const found = weeks.find((w) => w.id === fromQuery);
    setWeekId(found?.id ?? pickCurrentWeek(weeks)?.id ?? null);
  }, [weeks, weekId]);

  const submission = useAsync(async () => {
    if (weekId === null) return null;
    return { key: draftKey, value: await getMySubmission(weekId) };
  }, [weekId, draftKey]);

  useEffect(() => {
    if (!submission.data || submission.data.key !== draftKey) return;
    const sub = submission.data.value;
    setMine(sub);
    setForm(readDraft(draftKey) ?? {
      title: sub?.title ?? '',
      content: sub?.content ?? '',
      originalLink: sub?.originalLink ?? '',
    });
    setLoadedDraftKey(draftKey);
  }, [submission.data, draftKey]);

  const week = weeks?.find((w) => w.id === weekId) ?? null;
  const ready = loadedDraftKey === draftKey && !submission.loading && !submission.error;
  const state = week && ready ? getSubmitState(week, mine) : null;
  const supportsLink = USE_MOCK || week?.assignmentType === 'LINK';

  const saveDraft = () => {
    if (weekId === null) return;
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(form));
      toast('이 브라우저에 임시 저장했어요.', 'info');
    } catch {
      toast('임시 저장에 실패했어요.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (weekId === null || !ready || saving || !supportsLink) return;
    if (!USE_MOCK && !form.originalLink.trim()) {
      toast('과제 링크를 입력해 주세요.', 'warning');
      return;
    }
    if (!form.content.trim() && !form.originalLink.trim()) {
      toast('본문이나 원문 링크 중 하나는 꼭 넣어 주세요.', 'warning');
      return;
    }
    if (form.originalLink && !/^https?:\/\/\S+$/i.test(form.originalLink.trim())) {
      toast('HTTP 또는 HTTPS 링크를 입력해 주세요.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const input = { title: form.title.trim() || null, content: form.content, originalLink: form.originalLink.trim() || null };
      const saved = mine ? await updateSubmission(mine.id, input) : await createSubmission(weekId, input);
      setMine(saved);
      try { window.localStorage.removeItem(draftKey); } catch { /* 서버 제출은 완료됐어요. */ }
      toast(mine ? '수정했어요.' : '제출했어요! 수고했어요 🎉');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeSubmission = async () => {
    if (!mine || !ready || saving || !window.confirm('이 제출물을 삭제할까요?')) return;
    setSaving(true);
    try {
      await deleteSubmission(mine.id);
      setMine(null);
      setForm({ title: '', content: '', originalLink: '' });
      try { window.localStorage.removeItem(draftKey); } catch { /* 서버 삭제는 완료됐어요. */ }
      toast('제출물을 삭제했어요.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !weeks) return <LoadingBox />;
  if (error) return <ErrorBox error={error} onRetry={() => void reload()} />;
  if (!weeks?.length) {
    return (
      <>
        <PageHeader title="학습 기록 제출" />
        <Panel>
          <EmptyBox>아직 등록된 주차가 없어요.</EmptyBox>
        </Panel>
      </>
    );
  }

  return (
    <Box>
      <PageHeader
        title="학습 기록 제출"
        actions={
          state && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StatusChip kind={state} />
              {mine && <Typography sx={{ color: colors.textMuted, fontSize: 14 }}>{fmtMDDayTime(mine.submittedAt)} 제출</Typography>}
            </Box>
          )
        }
      />
      <Panel sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <Field label="주차">
            <Select fullWidth disabled={saving} value={weekId ?? ''} onChange={(e) => setWeekId(Number(e.target.value))} sx={{ borderRadius: '13px', bgcolor: '#fff' }}>
              {weeks.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.weekNo}주차 · {w.title}
                </MenuItem>
              ))}
            </Select>
          </Field>
          {USE_MOCK && ready && <Field label="제목">
            <TextField fullWidth placeholder="예: Spring Security 세션 인증 정리" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>}
        </Box>

        {week?.assignmentDescription && (
          <Box sx={{ mb: 3, p: 2, borderRadius: '13px', bgcolor: colors.primarySoft, color: '#2e2a8a', fontSize: 15 }}>
            <b>이번 과제</b> · {week.assignmentDescription}
            {week.deadline && <> (마감 {fmtMDDayTime(week.deadline)})</>}
          </Box>
        )}

        {submission.error ? (
          <ErrorBox error={submission.error} onRetry={() => void submission.reload()} />
        ) : !ready ? (
          <LoadingBox minHeight={300} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {USE_MOCK && <Field label="본문 (마크다운 지원)">
              <TextField
                fullWidth
                multiline
                minRows={7}
                placeholder="이번주에 배운 내용을 정리해보세요."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>}
            <Field label="원문 링크">
              <TextField fullWidth disabled={saving || !supportsLink} placeholder="https://" value={form.originalLink}
                onChange={(e) => setForm({ ...form, originalLink: e.target.value })} slotProps={{ htmlInput: { maxLength: 2048 } }} />
            </Field>
            {!supportsLink && <Typography color="text.secondary">이 주차는 파일 제출 방식이에요. 현재 화면에서는 링크 과제만 제출할 수 있어요.</Typography>}

            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button disabled={saving || !supportsLink} onClick={saveDraft} sx={{ bgcolor: colors.primarySoft, color: colors.navy, px: 2, '&:hover': { bgcolor: '#d9d6fb' } }}>
                임시 저장
              </Button>
              <Button variant="contained" color="secondary" onClick={() => void handleSubmit()} disabled={saving || !supportsLink}>
                {saving ? '저장 중…' : mine ? '수정하기' : '제출하기'}
              </Button>
              {mine && <Button color="error" disabled={saving} onClick={() => void removeSubmission()}>제출 삭제</Button>}
            </Box>
          </Box>
        )}
      </Panel>
      <Panel title="세션 자료" sx={{ mt: 3 }}>
        {materials.loading ? <LoadingBox minHeight={56} /> : materials.error ? (
          <ErrorBox error={materials.error} onRetry={() => void materials.reload()} />
        ) : materials.data?.length ? (
          <MaterialLinks key={weekId} materials={materials.data} />
        ) : <EmptyBox>등록된 자료가 없어요.</EmptyBox>}
      </Panel>
    </Box>
  );
}
