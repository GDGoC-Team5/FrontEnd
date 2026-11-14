'use client';

import { MenuItem, Select } from '@mui/material';
import type { Week } from '@/types/api';

/** 주차 고르기 드롭다운 (피그마 오른쪽 위 "6주차 ⌄") */
export default function WeekSelect({
  weeks,
  value,
  onChange,
  highlight = false,
  disabled = false,
}: {
  weeks: Week[];
  value: number | null;
  onChange: (weekId: number) => void;
  highlight?: boolean;
  disabled?: boolean;
}) {
  return (
    <Select
      size="small"
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      displayEmpty
      sx={{
        minWidth: 110,
        height: 44,
        borderRadius: '9px',
        fontSize: 18,
        ...(highlight && {
          bgcolor: 'primary.main',
          color: '#fff',
          '& .MuiSvgIcon-root': { color: '#fff' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.dark' },
        }),
      }}
    >
      {weeks.length === 0 && (
        <MenuItem value="" disabled>
          주차 없음
        </MenuItem>
      )}
      {weeks.map((w) => (
        <MenuItem key={w.id} value={w.id}>
          {w.weekNo}주차
        </MenuItem>
      ))}
    </Select>
  );
}
