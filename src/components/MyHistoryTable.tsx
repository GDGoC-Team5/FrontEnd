'use client';

import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import StatusChip from '@/components/StatusChip';
import { fmtMD } from '@/lib/dates';
import type { MyWeekRow } from '@/lib/stats';

/** 내 제출 이력 표 (대시보드·내 제출 이력 화면 공용) */
export default function MyHistoryTable({ rows, onRowClick }: { rows: MyWeekRow[]; onRowClick?: (row: MyWeekRow) => void }) {
  return (
    <Table size="small" sx={{ tableLayout: 'fixed' }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 72 }}>주차</TableCell>
          <TableCell>제목</TableCell>
          <TableCell sx={{ width: 84 }}>제출일</TableCell>
          <TableCell sx={{ width: 96 }} align="center">
            제출 상태
          </TableCell>
          <TableCell sx={{ width: 100 }} align="center">
            운영진 확인
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow
            key={r.week.id}
            hover={!!onRowClick}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            <TableCell>{r.week.weekNo}주차</TableCell>
            <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 0 }}>{r.submission?.title || r.week.title}</TableCell>
            <TableCell>{r.submission ? fmtMD(r.submission.submittedAt) : '-'}</TableCell>
            <TableCell align="center">
              <StatusChip kind={r.state} size="sm" />
            </TableCell>
            <TableCell align="center">
              {r.submission ? (r.submission.checkStatus === 'CHECKED' ? '확인 완료' : '확인 대기') : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
