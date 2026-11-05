'use client';

import { createTheme } from '@mui/material/styles';

/** 피그마에서 뽑은 색. 화면에서 색을 쓸 땐 웬만하면 여기 이름으로 써 주세요. */
export const colors = {
  navy: '#1e1b4b', // 사이드바, 진한 버튼
  navyActive: '#52527c', // 사이드바 선택된 메뉴
  primary: '#4f46e5', // 보라 포인트 (이번 주 배너, 제출 버튼)
  primarySoft: '#e6e4fd', // 연보라 배경 (선택된 목록, 우수 선정 버튼)
  primaryBorder: '#c7c3f7',
  bg: '#f5f6f8', // 화면 배경
  white: '#ffffff',
  border: 'rgba(155, 152, 152, 0.45)', // 카드·입력칸 테두리 (피그마 #9b9898 0.45px)
  textStrong: '#111111',
  textBody: '#333333',
  textMuted: '#747474',
  textSub: '#9b9898',
  gradientFrom: '#1e1b4b',
  gradientTo: '#4740b1',
  // 상태 칩
  doneBg: '#d4fbd1',
  doneText: '#479d0e',
  lateBg: '#faf0bd',
  lateText: '#c98317',
  missBg: '#fde4e4',
  missText: '#dc2626',
  dotDone: '#16a34a',
  dotLate: '#f59e0b',
  dotMiss: '#dc2626',
  dotPending: '#d4d4d8',
  barDone: '#3b3690',
  barCurrent: '#7c6fdc',
};

export const theme = createTheme({
  palette: {
    primary: { main: colors.primary },
    secondary: { main: colors.navy },
    background: { default: colors.bg, paper: colors.white },
    text: { primary: colors.textStrong, secondary: colors.textMuted },
    success: { main: colors.doneText },
    warning: { main: colors.dotLate },
    error: { main: colors.missText },
  },
  typography: {
    fontFamily:
      "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif",
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.02em' },
    allVariants: { letterSpacing: '-0.02em' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
        sizeLarge: { minHeight: 54, fontSize: 18, borderRadius: 13 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 13,
          backgroundColor: colors.white,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.textSub },
        },
      },
    },
    MuiSelect: {
      styleOverrides: { select: { fontWeight: 600 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${colors.border}`, fontSize: 16, padding: '12px 10px' },
        head: { color: colors.textMuted, fontWeight: 500, fontSize: 16 },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 17 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});
