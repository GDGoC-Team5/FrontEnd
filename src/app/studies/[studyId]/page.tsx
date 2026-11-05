'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingBox } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';

/** /studies/1 로 들어오면 역할에 맞는 대시보드로 보내요 */
export default function StudyIndex() {
  const { studyId, myRole } = useStudy();
  const router = useRouter();
  useEffect(() => {
    router.replace(myRole === 'MANAGER' ? `/studies/${studyId}/manage` : `/studies/${studyId}/dashboard`);
  }, [myRole, studyId, router]);
  return <LoadingBox />;
}
