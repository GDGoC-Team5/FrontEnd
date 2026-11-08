'use client';

import { Box, Button } from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { isApiError } from '@/api/errors';
import { getMembers, getStudy } from '@/api/studies';
import AppSidebar, { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from '@/components/AppSidebar';
import { ErrorBox, Forbidden, LoadingBox } from '@/components/ui';
import { useRequireAuth } from '@/contexts/AuthContext';
import { StudyContext, type StudyContextValue } from '@/contexts/StudyContext';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';

/**
 * /studies/[studyId]/... 공통 틀.
 * 스터디 정보 + 멤버 목록을 한 번 불러와서 사이드바를 그리고, 아래 화면들이 useStudy()로 꺼내 써요.
 */
export default function StudyLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ studyId: string }>();
  const studyId = Number(params.studyId);
  const user = useRequireAuth();

  const { data, loading, error, reload } = useAsync(async () => {
    if (!user) return null;
    const [study, members] = await Promise.all([getStudy(studyId), getMembers(studyId)]);
    return { study, members };
  }, [studyId, user?.id]);

  const value = useMemo<StudyContextValue | null>(() => {
    if (!data || !user) return null;
    const me = data.members.find((m) => m.userId === user.id) ?? null;
    return {
      studyId,
      study: data.study,
      members: data.members,
      myRole: data.study.myRole ?? me?.role ?? 'MEMBER',
      myMemberId: me?.id ?? null,
      reload: async () => {
        await reload();
      },
    };
  }, [data, user, studyId, reload]);

  const backHome = (
    <Button component={Link} href="/home" variant="contained">
      내 스터디로 돌아가기
    </Button>
  );

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg, pt: 6 }}>
        {isApiError(error, 403) ? (
          <Forbidden message="이 스터디에 속한 사람만 볼 수 있어요." action={backHome} />
        ) : isApiError(error, 404) ? (
          <Forbidden message="스터디를 찾을 수 없어요." action={backHome} />
        ) : (
          <ErrorBox error={error} onRetry={() => void reload()} />
        )}
      </Box>
    );
  }

  if (!value || (loading && !data)) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg }}>
        <LoadingBox minHeight={500} />
      </Box>
    );
  }

  return (
    <StudyContext.Provider value={value}>
      <Box sx={{ minHeight: '100vh', bgcolor: colors.bg }}>
        <AppSidebar studyId={studyId} studyName={value.study.name} role={value.myRole} />
        {/* 큰 모니터에서도 왼쪽에 쏠리지 않게: 최대 1440px까지 넓어지고 가운데 정렬 */}
        <Box
          component="main"
          sx={{
            ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
            px: { xs: 2, sm: 3, md: 5, lg: 6 },
            pt: { xs: `${TOPBAR_HEIGHT + 28}px`, md: 8 },
            pb: 8,
          }}
        >
          <Box sx={{ maxWidth: 1440, mx: 'auto' }}>{children}</Box>
        </Box>
      </Box>
    </StudyContext.Provider>
  );
}
