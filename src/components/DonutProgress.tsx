'use client';

import { Box, Typography } from '@mui/material';
import { colors } from '@/theme/theme';

/** "내 진행률" 도넛 차트 */
export default function DonutProgress({ value, size = 178 }: { value: number | null; size?: number }) {
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`진행률 ${v}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dcdcdc" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeDasharray={`${(c * v) / 100} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Typography
        sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 600, color: '#646262' }}
      >
        {value === null ? '-' : `${v}%`}
      </Typography>
    </Box>
  );
}
