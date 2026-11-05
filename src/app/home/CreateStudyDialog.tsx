'use client';

import { Box, Button, Chip, Dialog, DialogContent, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { errorMessage } from '@/api/errors';
import { addTag, createStudy } from '@/api/studies';
import { Field } from '@/components/ui';
import { colors } from '@/theme/theme';
import type { StudyDetail } from '@/types/api';

/** 피그마 "스터디 만들기" 모달 */
export default function CreateStudyDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (study: StudyDetail) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagText, setTagText] = useState('');
  const [totalWeeks, setTotalWeeks] = useState('8');
  const [capacity, setCapacity] = useState('12');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tags = tagText
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const reset = () => {
    setName('');
    setDescription('');
    setTagText('');
    setTotalWeeks('8');
    setCapacity('12');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('스터디 이름을 입력해 주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const study = await createStudy({
        name: name.trim(),
        description: description.trim(),
        totalWeeks: Number(totalWeeks) || undefined,
        capacity: Number(capacity) || undefined,
      });
      // '스터디 속성'은 태그 API로 따로 저장해요
      for (const tag of tags) {
        await addTag(study.id, { name: tag });
      }
      reset();
      onCreated(study);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: colors.bg } }}>
      <DialogContent sx={{ px: { xs: 3, sm: 6.5 }, py: 6 }}>
        <Typography component="h2" sx={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.03em' }}>
          스터디 만들기
        </Typography>
        <Typography sx={{ color: colors.textSub, fontSize: 17, mt: 0.5, mb: 4 }}>누구나 스터디를 만들고 멤버를 모집할 수 있어요.</Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          <Field label="스터디 이름">
            <TextField fullWidth placeholder="예: 백엔드 스터디" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="소개">
            <TextField fullWidth multiline minRows={3} placeholder="어떤 스터디인지 소개해 주세요." value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="스터디 속성">
            <TextField fullWidth placeholder="예: Spring, 백엔드 (쉼표로 구분)" value={tagText} onChange={(e) => setTagText(e.target.value)} />
            {tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {tags.map((t) => (
                  <Chip key={t} label={t} size="small" sx={{ bgcolor: colors.primarySoft, color: colors.primary }} />
                ))}
              </Box>
            )}
          </Field>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Field label="총 주차">
              <TextField fullWidth type="number" value={totalWeeks} onChange={(e) => setTotalWeeks(e.target.value)} />
            </Field>
            <Field label="모집 인원">
              <TextField fullWidth type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </Field>
          </Box>

          <Box sx={{ bgcolor: '#d7d6fc', borderRadius: '9px', px: 3, py: 2, fontSize: 15, color: '#1e1b4b', textAlign: 'center' }}>
            만든 사람은 자동으로 <b>운영진</b>이 됩니다. 스터디원에게 참여코드를 전송해 주세요.
          </Box>

          {error && (
            <Box role="alert" sx={{ bgcolor: colors.missBg, color: colors.missText, borderRadius: '9px', px: 2.5, py: 1.25, fontSize: 15 }}>
              {error}
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting} sx={{ bgcolor: '#fff', borderColor: colors.border }}>
              취소
            </Button>
            <Button variant="contained" color="secondary" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? '만드는 중…' : '만들고 모집 시작'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
