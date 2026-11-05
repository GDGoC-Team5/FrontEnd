'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { Box, Button, Divider, IconButton, MenuItem, Select, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/api/errors';
import { createSubmission, getMySubmission, updateSubmission } from '@/api/submissions';
import { deleteMaterial, getMaterials, getWeeks, uploadMaterial } from '@/api/weeks';
import FileDropzone from '@/components/FileDropzone';
import StatusChip from '@/components/StatusChip';
import { EmptyBox, ErrorBox, Field, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { fmtMDDayTime } from '@/lib/dates';
import { getSubmitState, pickCurrentWeek } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';
import type { SessionMaterial, Submission } from '@/types/api';

interface Draft {
  title: string;
  content: string;
  originalLink: string;
}

const draftKey = (weekId: number) => `studyhub-draft-${weekId}`;

function readDraft(weekId: number): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(weekId));
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
  const [myFiles, setMyFiles] = useState<SessionMaterial[]>([]);
  const [form, setForm] = useState<Draft>({ title: '', content: '', originalLink: '' });
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 처음엔 ?week= 로 넘어온 주차, 없으면 이번 주차
  useEffect(() => {
    if (!weeks || weekId !== null) return;
    const fromQuery = Number(new URLSearchParams(window.location.search).get('week'));
    const found = weeks.find((w) => w.id === fromQuery);
    setWeekId(found?.id ?? pickCurrentWeek(weeks)?.id ?? null);
  }, [weeks, weekId]);

  // 주차를 바꾸면 내 제출물·내가 올린 파일을 불러와요
  useEffect(() => {
    if (weekId === null) return;
    let cancelled = false;
    setLoadingWeek(true);
    Promise.all([getMySubmission(weekId), getMaterials(weekId)])
      .then(([sub, materials]) => {
        if (cancelled) return;
        setMine(sub);
        setMyFiles(materials.filter((m) => m.uploaderId === user?.id));
        const draft = readDraft(weekId);
        setForm(
          draft ?? {
            title: sub?.title ?? '',
            content: sub?.content ?? '',
            originalLink: sub?.originalLink ?? '',
          },
        );
      })
      .catch((e) => toast(errorMessage(e), 'error'))
      .finally(() => !cancelled && setLoadingWeek(false));
    return () => {
      cancelled = true;
    };
  }, [weekId, user?.id, toast]);

  const week = weeks?.find((w) => w.id === weekId) ?? null;
  const state = week ? getSubmitState(week, mine) : null;

  const saveDraft = () => {
    if (weekId === null) return;
    try {
      window.localStorage.setItem(draftKey(weekId), JSON.stringify(form));
      toast('이 브라우저에 임시 저장했어요.', 'info');
    } catch {
      toast('임시 저장에 실패했어요.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (weekId === null) return;
    if (!form.content.trim() && !form.originalLink.trim()) {
      toast('본문이나 원문 링크 중 하나는 꼭 넣어 주세요.', 'warning');
      return;
    }
    if (form.originalLink && !/^https?:\/\//.test(form.originalLink.trim())) {
      toast('원문 링크는 https:// 로 시작해야 해요.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const input = { title: form.title.trim() || null, content: form.content, originalLink: form.originalLink.trim() || null };
      const saved = mine ? await updateSubmission(mine.id, input) : await createSubmission(weekId, input);
      setMine(saved);
      window.localStorage.removeItem(draftKey(weekId));
      toast(mine ? '수정했어요.' : '제출했어요! 수고했어요 🎉');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    if (weekId === null) return;
    setUploading(true);
    try {
      for (const file of files) {
        const uploaded = await uploadMaterial(weekId, file);
        setMyFiles((prev) => [...prev, uploaded]);
      }
      toast('파일을 올렸어요.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (m: SessionMaterial) => {
    try {
      await deleteMaterial(m.id);
      setMyFiles((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      toast(errorMessage(e), 'error');
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
            <Select fullWidth value={weekId ?? ''} onChange={(e) => setWeekId(Number(e.target.value))} sx={{ borderRadius: '13px', bgcolor: '#fff' }}>
              {weeks.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.weekNo}주차 · {w.title}
                </MenuItem>
              ))}
            </Select>
          </Field>
          <Field label="제목">
            <TextField fullWidth placeholder="예: Spring Security 세션 인증 정리" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
        </Box>

        {week?.assignmentDescription && (
          <Box sx={{ mb: 3, p: 2, borderRadius: '13px', bgcolor: colors.primarySoft, color: '#2e2a8a', fontSize: 15 }}>
            <b>이번 과제</b> · {week.assignmentDescription}
            {week.deadline && <> (마감 {fmtMDDayTime(week.deadline)})</>}
          </Box>
        )}

        {loadingWeek ? (
          <LoadingBox minHeight={300} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Field label="본문 (마크다운 지원)">
              <TextField
                fullWidth
                multiline
                minRows={7}
                placeholder="이번주에 배운 내용을 정리해보세요."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>
            <Field label="원문 링크">
              <TextField fullWidth placeholder="https://" value={form.originalLink} onChange={(e) => setForm({ ...form, originalLink: e.target.value })} />
            </Field>
            <Field label="정리 자료 업로드">
              <FileDropzone onFiles={(f) => void handleFiles(f)} busy={uploading} hint="txt · md · pdf 파일을 끌어다 놓기" />
              {myFiles.length > 0 && (
                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {myFiles.map((m) => (
                    <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, borderRadius: '9px', bgcolor: colors.bg }}>
                      <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: colors.textMuted }} />
                      <Typography sx={{ flex: 1, fontSize: 14 }} noWrap>
                        {m.originalFilename}
                      </Typography>
                      <IconButton size="small" aria-label={`${m.originalFilename} 삭제`} onClick={() => void removeFile(m)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Field>

            <Divider />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button onClick={saveDraft} sx={{ bgcolor: colors.primarySoft, color: colors.navy, px: 2, '&:hover': { bgcolor: '#d9d6fb' } }}>
                임시 저장
              </Button>
              <Button variant="contained" color="secondary" onClick={() => void handleSubmit()} disabled={saving}>
                {saving ? '저장 중…' : mine ? '수정하기' : '제출하기'}
              </Button>
            </Box>
          </Box>
        )}
      </Panel>
    </Box>
  );
}
