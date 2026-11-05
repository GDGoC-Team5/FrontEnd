'use client';

import { MenuItem, Select } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { getMyStudies } from '@/api/studies';
import { useStudy } from '@/contexts/StudyContext';
import { useAsync } from '@/lib/useAsync';

/**
 * 운영진 화면 오른쪽 위 "Dev 스터디 ⌄".
 * 내가 운영진인 다른 스터디를 고르면 같은 화면(…/manage/weeks 등)의 그 스터디로 이동해요.
 */
export default function ManagerStudySelect() {
  const { studyId, study } = useStudy();
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useAsync(getMyStudies, []);
  const managed = (data ?? []).filter((s) => s.myRole === 'MANAGER' || s.id === studyId);
  const options = managed.some((s) => s.id === studyId) ? managed : [{ id: studyId, name: study.name }, ...managed];

  return (
    <Select
      size="small"
      value={studyId}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (next !== studyId) router.push(pathname.replace(`/studies/${studyId}`, `/studies/${next}`));
      }}
      sx={{ minWidth: 140, height: 44, borderRadius: '9px', fontSize: 18, bgcolor: '#fff' }}
    >
      {options.map((s) => (
        <MenuItem key={s.id} value={s.id}>
          {s.name}
        </MenuItem>
      ))}
    </Select>
  );
}
