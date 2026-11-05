'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { colors } from '@/theme/theme';

/** 초대 코드 보여주기 + 복사 (+ 재발급 버튼은 선택) */
export default function InviteCodeDialog({
  open,
  code,
  onClose,
  onReissue,
  reissuing = false,
  extraAction,
}: {
  open: boolean;
  code: string | null | undefined;
  onClose: () => void;
  onReissue?: () => void;
  reissuing?: boolean;
  extraAction?: ReactNode;
}) {
  const toast = useToast();
  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast('초대 코드를 복사했어요.');
    } catch {
      toast('복사하지 못했어요. 직접 선택해서 복사해 주세요.', 'warning');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>멤버 초대</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: colors.textMuted, mb: 2 }}>스터디원에게 아래 코드를 보내 주세요. 홈 화면의 ‘초대 코드로 참여하기’에 입력하면 돼요.</Typography>
        <Box
          sx={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textAlign: 'center',
            py: 2,
            borderRadius: '13px',
            bgcolor: colors.primarySoft,
            color: colors.primary,
            userSelect: 'all',
          }}
        >
          {code ?? '코드 없음'}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {onReissue && (
          <Button onClick={onReissue} disabled={reissuing} color="inherit" sx={{ mr: 'auto' }}>
            {reissuing ? '재발급 중…' : '코드 재발급'}
          </Button>
        )}
        <Button variant="outlined" onClick={() => void copy()} disabled={!code}>
          복사
        </Button>
        {extraAction ?? (
          <Button variant="contained" onClick={onClose}>
            닫기
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
