'use client';

import { Box, Button, ButtonBase, Chip, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { errorMessage } from '@/api/errors';
import { addTag, changeMemberRole, deleteStudy, deleteTag, getMyStudies, getStudy, getTags, kickMember, reissueInviteCode, updateStudy } from '@/api/studies';
import InviteCodeDialog from '@/components/InviteCodeDialog';
import StatusChip from '@/components/StatusChip';
import { ErrorBox, Field, PageHeader, Panel } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';
import { useToast } from '@/contexts/ToastContext';
import { fmtMD } from '@/lib/dates';
import { useAsync } from '@/lib/useAsync';
import { colors } from '@/theme/theme';
import type { StudyRole, StudyTag } from '@/types/api';

/** 피그마 Student-study-management (스터디 관리) */
export default function StudyManagePage() {
  const { studyId, study, members, myMemberId, reload } = useStudy();
  const router = useRouter();
  const toast = useToast();
  const { data: myStudies } = useAsync(getMyStudies, [studyId]);
  const managed = (myStudies ?? []).filter((s) => s.myRole === 'MANAGER');
  const studyList: Array<{ id: number; name: string; memberCount?: number }> = managed.length
    ? managed
    : [{ id: studyId, name: study.name, memberCount: members.length }];

  const [name, setName] = useState(study.name);
  const [description, setDescription] = useState(study.description ?? '');
  const tagsQuery = useAsync(() => getTags(studyId), [studyId]);
  const tags = tagsQuery.data ?? [];
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null | undefined>(study.inviteCode);
  const [reissuing, setReissuing] = useState(false);

  useEffect(() => {
    setName(study.name);
    setDescription(study.description ?? '');
    setInviteCode(study.inviteCode);
  }, [study]);

  const save = async () => {
    if (!name.trim()) {
      toast('스터디 이름을 입력해 주세요.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await updateStudy(studyId, { name: name.trim(), description });
      await reload();
      toast('저장했어요.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openInvite = async () => {
    setInviteOpen(true);
    if (!inviteCode) {
      try {
        const detail = await getStudy(studyId);
        setInviteCode(detail.inviteCode);
      } catch (e) {
        toast(errorMessage(e), 'error');
      }
    }
  };

  const reissue = async () => {
    setReissuing(true);
    try {
      const res = await reissueInviteCode(studyId);
      setInviteCode(res.inviteCode);
      toast('새 초대 코드를 만들었어요. 예전 코드는 더 이상 못 써요.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setReissuing(false);
    }
  };

  const onAddTag = async () => {
    const tagName = newTag.trim();
    if (!tagName) return;
    try {
      await addTag(studyId, { name: tagName });
      await tagsQuery.reload();
      setNewTag('');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const onDeleteTag = async (tag: StudyTag) => {
    try {
      await deleteTag(studyId, tag.id);
      await tagsQuery.reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const onRoleChange = async (memberId: number, role: StudyRole) => {
    try {
      await changeMemberRole(studyId, memberId, role);
      await reload();
      toast(role === 'MANAGER' ? '운영진으로 바꿨어요.' : '스터디원으로 바꿨어요.');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const onKick = async (memberId: number, nickname: string) => {
    if (!window.confirm(`${nickname}님을 스터디에서 내보낼까요?`)) return;
    try {
      await kickMember(studyId, memberId);
      await reload();
      toast(`${nickname}님을 내보냈어요.`);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const onDeleteStudy = async () => {
    if (!window.confirm(`정말 '${study.name}'을(를) 삭제할까요? 주차·제출 기록이 모두 사라져요.`)) return;
    try {
      await deleteStudy(studyId);
      toast('스터디를 삭제했어요.');
      router.push('/home');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <Box>
      <PageHeader title="스터디 관리" />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.65fr) minmax(0, 1fr)' }, gap: 1, alignItems: 'start', mb: 3 }}>
        <Panel title="스터디 목록">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {studyList.map((s) => {
              const selected = s.id === studyId;
              return (
                <ButtonBase
                  key={s.id}
                  onClick={() => router.push(`/studies/${s.id}/manage/study`)}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    px: 1.25,
                    py: 0.75,
                    borderRadius: '6px',
                    fontSize: 17,
                    border: `1px solid ${selected ? colors.primary : 'transparent'}`,
                    bgcolor: selected ? colors.primarySoft : 'transparent',
                    color: selected ? colors.primary : colors.textStrong,
                  }}
                >
                  {s.name}
                  {s.memberCount !== undefined && ` · ${s.memberCount}명`}
                </ButtonBase>
              );
            })}
          </Box>
        </Panel>

        <Panel title="스터디 상세">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontSize: 12, color: colors.textSub, mb: 0.5 }}>스터디 이름</Typography>
              <TextField fullWidth size="small" value={name} onChange={(e) => setName(e.target.value)} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: colors.textSub, mb: 0.5 }}>소개</Typography>
              <TextField fullWidth size="small" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" onClick={() => void save()} disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </Button>
              <Button size="small" onClick={() => void openInvite()} sx={{ bgcolor: colors.primarySoft, '&:hover': { bgcolor: '#d9d6fb' } }}>
                멤버 초대
              </Button>
            </Box>
          </Box>
        </Panel>
      </Box>

      <Panel title={`멤버 (${members.length}명)`} sx={{ mb: 3 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>닉네임</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>참여일</TableCell>
                <TableCell>역할</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => {
                const isMe = m.id === myMemberId;
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.nickname} {isMe && <StatusChip kind="MEMBER" label="나" size="sm" />}
                    </TableCell>
                    <TableCell sx={{ color: colors.textMuted }}>{m.email ?? '-'}</TableCell>
                    <TableCell sx={{ color: colors.textMuted }}>{fmtMD(m.joinedAt)}</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={m.role}
                        disabled={isMe}
                        onChange={(e) => void onRoleChange(m.id, e.target.value as StudyRole)}
                        sx={{ minWidth: 110, height: 34, fontSize: 14 }}
                      >
                        <MenuItem value="MANAGER">운영진</MenuItem>
                        <MenuItem value="MEMBER">스터디원</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="right">
                      {!isMe && (
                        <Button size="small" color="error" onClick={() => void onKick(m.id, m.nickname)}>
                          내보내기
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Panel>

      <Panel title="스터디 속성 (태그)" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {tagsQuery.error && <ErrorBox error={tagsQuery.error} onRetry={() => void tagsQuery.reload()} />}
          {tagsQuery.loading && <Typography sx={{ color: colors.textSub }}>태그를 불러오는 중이에요.</Typography>}
          {!tagsQuery.loading && !tagsQuery.error && tags.length === 0 && <Typography sx={{ color: colors.textSub }}>아직 태그가 없어요.</Typography>}
          {tags.map((t) => (
            <Chip key={t.id} label={t.name} onDelete={() => void onDeleteTag(t)} sx={{ bgcolor: colors.primarySoft, color: colors.primary }} />
          ))}
        </Box>
        <Field label="태그 추가">
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              void onAddTag();
            }}
            sx={{ display: 'flex', gap: 1 }}
          >
            <TextField size="small" placeholder="예: Spring" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
            <Button type="submit" variant="outlined">
              추가
            </Button>
          </Box>
        </Field>
      </Panel>

      <Panel>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>스터디 삭제</Typography>
            <Typography sx={{ color: colors.textMuted, fontSize: 14 }}>주차, 제출물, 자료가 모두 함께 지워지고 되돌릴 수 없어요.</Typography>
          </Box>
          <Button variant="outlined" color="error" onClick={() => void onDeleteStudy()}>
            삭제
          </Button>
        </Box>
      </Panel>

      <InviteCodeDialog open={inviteOpen} code={inviteCode} onClose={() => setInviteOpen(false)} onReissue={() => void reissue()} reissuing={reissuing} />
    </Box>
  );
}
