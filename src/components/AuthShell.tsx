'use client';

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '@/theme/theme';

/** 로그인·회원가입 공통 틀: 왼쪽 보라 그라데이션 + 오른쪽 입력 영역 (피그마 Log-in) */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 1061,
          minHeight: 611,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          borderRadius: '17px',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
          bgcolor: colors.white,
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: `linear-gradient(180deg, ${colors.gradientFrom} 0%, ${colors.gradientTo} 100%)`,
            color: '#fefefe',
            p: '28px',
          }}
        >
          <Box />
          <Box sx={{ pl: '41px' }}>
            <Typography sx={{ fontSize: 42, fontWeight: 700, lineHeight: '52px', letterSpacing: '-0.03em' }}>
              스터디 기록은 한 곳에,
              <br />
              빈틈은 한눈에
            </Typography>
            <Typography sx={{ mt: 3, fontSize: 18, fontWeight: 600, lineHeight: '25px', color: 'rgba(254,254,254,0.85)' }}>
              주차별 과제 제출부터 이해도 확인까지,
              <br />
              운영진과 스터디원이 같은 화면을 봐요
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="GDGoC 로고" width={46} height={46} style={{ borderRadius: '50%' }} />
            <Typography sx={{ fontSize: 18, fontWeight: 600 }}>GDGoC SMU Team5</Typography>
          </Box>
        </Box>
        <Box sx={{ px: { xs: 3, md: '64px' }, py: { xs: 4, md: '56px' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
