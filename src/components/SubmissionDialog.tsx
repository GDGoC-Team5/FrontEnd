'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { fmtMDDayTime } from '@/lib/dates';
import { colors } from '@/theme/theme';
import type { Submission } from '@/types/api';

/** 제출물 자세히 보기 */
export default function SubmissionDialog({ submission, nickname, onClose }: { submission: Submission | null; nickname?: string; onClose: () => void }) {
  return (
    <Dialog open={!!submission} onClose={onClose} maxWidth="md" fullWidth>
      {submission && (
        <>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {nickname ?? submission.nickname ?? '스터디원'}님의 기록
            <Typography sx={{ color: colors.textMuted, fontSize: 14 }}>
              {submission.title ? `${submission.title} · ` : ''}
              {fmtMDDayTime(submission.submittedAt)} 제출
              {submission.updatedAt && submission.updatedAt !== submission.submittedAt ? ` · ${fmtMDDayTime(submission.updatedAt)} 수정` : ''}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            {submission.originalLink && (
              <Typography sx={{ mb: 2, wordBreak: 'break-all' }}>
                원문 링크:{' '}
                <a href={submission.originalLink} target="_blank" rel="noreferrer" style={{ color: colors.primary }}>
                  {submission.originalLink}
                </a>
              </Typography>
            )}
            <Box sx={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.7, bgcolor: colors.bg, borderRadius: '13px', p: 2, minHeight: 120 }}>
              {submission.content || '(본문 없이 링크만 제출했어요)'}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>닫기</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
