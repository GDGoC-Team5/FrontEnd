'use client';

import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { loadStudySubmissions } from '@/api/dashboard';
import ManagerStudySelect from '@/components/ManagerStudySelect';
import StatusChip from '@/components/StatusChip';
import WeekSelect from '@/components/WeekSelect';
import { EmptyBox, ErrorBox, LoadingBox, PageHeader, Panel } from '@/components/ui';
import { useStudy } from '@/contexts/StudyContext';
import { computeManagerStats, type SubmitState } from '@/lib/stats';
import { useAsync } from '@/lib/useAsync';
import { useSelectedWeek } from '@/lib/useSelectedWeek';
import { colors } from '@/theme/theme';

const DOT: Record<SubmitState, string> = {
  DONE: colors.dotDone,
  LATE: colors.dotLate,
  MISSING: colors.dotMiss,
  PENDING: colors.dotPending,
};

function Dot({ color, label }: { color: string; label?: string }) {
  return <Box component="span" title={label} sx={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', bgcolor: color }} />;
}

function StatCard({ label, value, sub, subColor, danger }: { label: string; value: string; sub: string; subColor?: string; danger?: boolean }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '13px', border: `1px solid ${danger ? '#f19c9c' : colors.border}`, p: 2.5, minHeight: 142 }}>
      <Typography sx={{ color: colors.textMuted, fontSize: 15 }}>{label}</Typography>
      <Typography sx={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', mt: 1.5, lineHeight: 1.1, color: danger ? colors.missText : colors.textStrong }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 15, mt: 0.5, color: subColor ?? colors.textMuted }}>{sub}</Typography>
    </Box>
  );
}

/** 피그마 Management-dashboard (운영진 대시보드) */
export default function ManagerDashboardPage() {
  const { studyId } = useStudy();
  const { data, loading, error, reload } = useAsync(() => loadStudySubmissions(studyId), [studyId]);
  const { weekId, setWeekId, week } = useSelectedWeek(data?.weeks);

  if (loading && !data) return <LoadingBox />;
  if (error) return <ErrorBox error={error} onRetry={() => void reload()} />;
  if (!data) return null;

  const s = computeManagerStats(data.weeks, data.members, data.subsByWeek, week);
  const pctText = (v: number | null) => (v === null ? '-' : `${v}%`);
  const diffText =
    s.overallDiff === null ? '이번 주가 첫 주차예요' : `지난 주 대비 ${s.overallDiff >= 0 ? '+' : ''}${s.overallDiff}%p`;
  const alertCount = s.rows.filter((r) => r.health === 'ALERT').length;

  return (
    <Box>
      <PageHeader
        title="운영진 대시보드"
        actions={
          <>
            <ManagerStudySelect />
            <WeekSelect weeks={data.weeks} value={weekId} onChange={setWeekId} />
          </>
        }
      />

      {data.weeks.length === 0 ? (
        <Panel>
          <EmptyBox>아직 주차가 없어요. ‘주차·세션’에서 첫 주차를 만들어 보세요.</EmptyBox>
        </Panel>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.25, mb: 3 }}>
            <StatCard label="전체 제출률" value={pctText(s.overallRate)} sub={diffText} subColor={s.overallDiff === null ? undefined : s.overallDiff >= 0 ? colors.dotDone : colors.missText} />
            <StatCard
              label="이번 주 제출률"
              value={pctText(s.selectedRate)}
              sub={s.daysLeft === null ? '-' : s.daysLeft < 0 ? '마감됨' : s.daysLeft === 0 ? '오늘 마감' : `마감일까지 ${s.daysLeft}일`}
            />
            <StatCard label="미제출자" value={`${s.missingMembers.length}명`} sub={`전체 ${s.targets.length}명 중`} />
            <StatCard label="주의 필요 멤버" value={`${alertCount}명`} sub="2주 연속 지연·미제출" danger={alertCount > 0} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.75fr) minmax(0, 1fr)' }, gap: 1, mb: 3 }}>
            <Panel title="주차별 제출률">
              <Box sx={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.weeklyRates} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: colors.textMuted, fontSize: 14 }} />
                    <YAxis hide domain={[0, 100]} />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={60} isAnimationActive={false}>
                      <LabelList dataKey="rate" position="top" style={{ fontSize: 12, fill: '#333' }} />
                      {s.weeklyRates.map((d) => (
                        <Cell key={d.weekId} fill={d.selected ? colors.barCurrent : colors.barDone} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Panel>

            <Panel title="주의 필요 멤버">
              {s.attention.length === 0 ? (
                <EmptyBox>모두 잘 따라오고 있어요 👏</EmptyBox>
              ) : (
                <Box>
                  {s.attention.map((r) => (
                    <Box key={r.member.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, borderBottom: `1px solid ${colors.border}` }}>
                      <Box>
                        <Typography sx={{ fontSize: 15 }}>{r.member.nickname}</Typography>
                        <Typography sx={{ fontSize: 11, color: colors.textMuted }}>{r.reason}</Typography>
                      </Box>
                      <StatusChip kind={r.health} size="sm" />
                    </Box>
                  ))}
                </Box>
              )}
            </Panel>
          </Box>

          <Panel
            title="멤버별 제출 현황"
            action={
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', fontSize: 12, color: colors.textMuted }}>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Dot color={colors.dotDone} /> 제출
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Dot color={colors.dotLate} /> 지연
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Dot color={colors.dotMiss} /> 미제출
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <Dot color={colors.dotPending} /> 제출 전
                </Box>
              </Box>
            }
          >
            {s.rows.length === 0 ? (
              <EmptyBox>아직 스터디원이 없어요. ‘스터디 관리’에서 초대 코드를 보내 보세요.</EmptyBox>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>멤버</TableCell>
                      {s.columns.map((w) => (
                        <TableCell key={w.id} align="center">
                          {w.weekNo}주
                        </TableCell>
                      ))}
                      <TableCell>제출률</TableCell>
                      <TableCell align="center">상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {s.rows.map((r) => (
                      <TableRow key={r.member.id}>
                        <TableCell>{r.member.nickname}</TableCell>
                        {r.cells.map((c) => (
                          <TableCell key={c.week.id} align="center">
                            <Dot color={DOT[c.state]} label={c.state} />
                          </TableCell>
                        ))}
                        <TableCell>{pctText(r.rate)}</TableCell>
                        <TableCell align="center">
                          <StatusChip kind={r.health} size="sm" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Panel>
        </>
      )}
    </Box>
  );
}
