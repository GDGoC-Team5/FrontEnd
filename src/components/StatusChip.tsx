'use client';

import { Box } from '@mui/material';
import { colors } from '@/theme/theme';

export type ChipKind =
  | 'DONE'
  | 'LATE'
  | 'MISSING'
  | 'PENDING'
  | 'GOOD'
  | 'WATCH'
  | 'ALERT'
  | 'MANAGER'
  | 'MEMBER'
  | 'CURRENT'
  | 'ENDED'
  | 'UPCOMING'
  | 'SUBMITTED'
  | 'NOT_SUBMITTED';

const STYLES: Record<ChipKind, { label: string; bg: string; color: string; border?: string }> = {
  DONE: { label: '완료', bg: colors.doneBg, color: colors.doneText },
  LATE: { label: '지연', bg: colors.lateBg, color: colors.lateText },
  MISSING: { label: '미제출', bg: colors.missBg, color: colors.missText },
  PENDING: { label: '제출 전', bg: '#eeeeF2', color: colors.textMuted },
  GOOD: { label: '양호', bg: colors.doneBg, color: colors.doneText },
  WATCH: { label: '지켜보기', bg: colors.lateBg, color: colors.lateText },
  ALERT: { label: '주의 필요', bg: colors.missBg, color: colors.missText },
  MANAGER: { label: '운영진', bg: '#d9d7fb', color: '#2e2a8a' },
  MEMBER: { label: '스터디원', bg: '#e6e6e9', color: '#3f3f46' },
  CURRENT: { label: '진행중', bg: colors.white, color: colors.primary, border: colors.primary },
  ENDED: { label: '종료', bg: colors.white, color: colors.doneText, border: colors.doneText },
  UPCOMING: { label: '예정', bg: colors.white, color: colors.textMuted, border: colors.textSub },
  SUBMITTED: { label: '제출 완료', bg: '#d6ecfb', color: '#1d6fa5' },
  NOT_SUBMITTED: { label: '미제출', bg: colors.missBg, color: '#b91c1c' },
};

/** 상태 표시 알약 (완료/지연/미제출, 양호/지켜보기/주의 필요, 운영진/스터디원 등) */
export default function StatusChip({ kind, label, size = 'md' }: { kind: ChipKind; label?: string; size?: 'sm' | 'md' }) {
  const s = STYLES[kind];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: size === 'sm' ? 1.25 : 1.75,
        height: size === 'sm' ? 24 : 30,
        minWidth: size === 'sm' ? 52 : 64,
        borderRadius: 999,
        fontSize: size === 'sm' ? 13 : 15,
        fontWeight: 600,
        bgcolor: s.bg,
        color: s.color,
        border: s.border ? `1px solid ${s.border}` : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label ?? s.label}
    </Box>
  );
}
