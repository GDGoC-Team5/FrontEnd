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
  compact = false, 
}: {
  weeks: Week[];
  value: number | null;
  onChange: (weekId: number) => void;
  highlight?: boolean;
  disabled?: boolean;
  /** 카드 제목 옆에 붙이는 작은 버전 (스터디원 대시보드 '우수 스터디원') */
  compact?: boolean; 
}) {
  return (
    <Select
      size="small"
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      displayEmpty
      sx={{
        minWidth: compact ? 84 : 110,          
        height: compact ? 30 : 44,             
        borderRadius: compact ? '6px' : '9px', 
        fontSize: compact ? 13 : 18,          
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