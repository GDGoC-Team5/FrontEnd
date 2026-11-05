'use client';

import { Box, ButtonBase, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import StatusChip from '@/components/StatusChip';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/theme';
import type { StudyRole } from '@/types/api';

export const SIDEBAR_WIDTH = 239;

interface NavItem {
  label: string;
  href: string;
}

export function studentNav(studyId: number): NavItem[] {
  return [
    { label: '대시보드', href: `/studies/${studyId}/dashboard` },
    { label: '기록 제출', href: `/studies/${studyId}/submit` },
    { label: '내 제출 이력', href: `/studies/${studyId}/history` },
  ];
}

export function managerNav(studyId: number): NavItem[] {
  return [
    { label: '대시보드', href: `/studies/${studyId}/manage` },
    { label: '스터디 관리', href: `/studies/${studyId}/manage/study` },
    { label: '주차·세션', href: `/studies/${studyId}/manage/weeks` },
    { label: '과제 체크', href: `/studies/${studyId}/manage/check` },
    { label: '우수 스터디원', href: `/studies/${studyId}/manage/best` },
  ];
}

const linkSx = {
  display: 'block',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 15,
  textDecoration: 'none',
  py: 0.5,
  '&:hover': { color: '#fff' },
};

export default function AppSidebar({ studyId, studyName, role }: { studyId: number; studyName: string; role: StudyRole }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isManageView = pathname.includes('/manage');
  const items = isManageView ? managerNav(studyId) : studentNav(studyId);

  // 가장 길게 일치하는 메뉴를 선택 상태로 (…/manage 와 …/manage/weeks 구분)
  const active = items
    .filter((it) => pathname === it.href || pathname.startsWith(`${it.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        inset: '0 auto 0 0',
        width: SIDEBAR_WIDTH,
        bgcolor: colors.navy,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        px: '21px',
        pt: '45px',
        pb: 4,
        zIndex: 10,
        overflowY: 'auto',
      }}
    >
      <Link href="/home" style={{ color: 'inherit', textDecoration: 'none' }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, px: '3px' }}>스터디 기록 허브</Typography>
      </Link>
      <Typography sx={{ fontSize: 19, mt: 1, px: '3px', opacity: 0.95 }} noWrap title={studyName}>
        {studyName}
      </Typography>

      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {items.map((it) => {
          const selected = it.href === active;
          return (
            <ButtonBase
              key={it.href}
              component={Link}
              href={it.href}
              sx={{
                justifyContent: 'flex-start',
                height: 48,
                px: '15px',
                borderRadius: '15px',
                fontSize: 19,
                fontWeight: selected ? 600 : 400,
                color: selected ? '#fbfdff' : 'rgba(251,253,255,0.85)',
                bgcolor: selected ? colors.navyActive : 'transparent',
                '&:hover': { bgcolor: selected ? colors.navyActive : 'rgba(255,255,255,0.08)' },
              }}
            >
              {it.label}
            </ButtonBase>
          );
        })}
      </Box>

      <Box sx={{ mt: 'auto', pt: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#fff',
              color: '#9b9b9b',
              fontSize: 28,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {user?.nickname?.slice(0, 1) ?? '?'}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
              {user?.nickname ?? ''}
            </Typography>
            <StatusChip kind={role} size="sm" />
          </Box>
        </Box>

        <Box sx={{ mt: 3, px: 1 }}>
          {role === 'MANAGER' && (
            <Box component={Link} href={isManageView ? `/studies/${studyId}/dashboard` : `/studies/${studyId}/manage`} sx={linkSx}>
              {isManageView ? '스터디원 화면 보기 →' : '운영진 화면 보기 →'}
            </Box>
          )}
          <Box component={Link} href="/home" sx={linkSx}>
            ← 내 스터디 목록
          </Box>
          <Box component="button" type="button" onClick={() => void logout()} sx={{ ...linkSx, background: 'none', border: 0, p: 0, py: 0.5, cursor: 'pointer', font: 'inherit', fontSize: 15 }}>
            로그아웃
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
