'use client';

import { Button } from '@mui/material';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Forbidden } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';

/** 운영진(MANAGER) 화면 묶음. 스터디원이 주소를 직접 쳐서 들어오면 403 화면을 보여줘요. */
export default function ManageLayout({ children }: { children: ReactNode }) {
  const { myRole, studyId } = useStudy();
  if (myRole !== 'MANAGER') {
    return (
      <Forbidden
        message="스터디 진행자(운영진)만 볼 수 있는 화면이에요."
        action={
          <Button component={Link} href={`/studies/${studyId}/dashboard`} variant="contained">
            스터디원 대시보드로
          </Button>
        }
      />
    );
  }
  return <>{children}</>;
}
