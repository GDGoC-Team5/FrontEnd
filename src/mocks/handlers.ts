/**
 * 가짜 서버. api/client.ts 가 USE_MOCK일 때 fetch 대신 여기를 불러요.
 * 진짜 API 목록(URL·Method)과 똑같이 만들어 둬서, 나중에 USE_MOCK=false로 바꾸면 화면 코드는 그대로 써요.
 * 권한 규칙도 백엔드 표(Public / 로그인 / MEMBER / MANAGER)와 똑같이 401/403을 내요.
 */
import type {
  BestMember,
  SessionMaterial,
  StudyDetail,
  StudyMember,
  StudyRole,
  StudySummary,
  StudyTag,
  Submission,
  User,
  Week,
  WeekInput,
} from '@/types/api';
import { ApiError } from '@/api/errors';
import type { Method, RequestOptions } from '@/api/client';
import { toLocalDateTimeString } from '@/lib/dates';
import { pickCurrentWeek } from '@/lib/stats';
import { getDb, nextId, randomInviteCode, saveDb, type MockDb, type MockMember, type MockStudy, type MockUser } from './db';

type Body = Record<string, unknown>;

interface Ctx {
  params: Record<string, string>;
  body: Body;
  form?: FormData | URLSearchParams;
  db: MockDb;
}

type Handler = (ctx: Ctx) => unknown;

const now = () => toLocalDateTimeString(new Date());

// ───────── 권한 체크 도우미 ─────────

function requireLogin(db: MockDb): MockUser {
  const user = db.users.find((u) => u.id === db.sessionUserId);
  if (!user) throw new ApiError(401, '로그인이 필요해요.');
  return user;
}

function findStudy(db: MockDb, studyId: number): MockStudy {
  const study = db.studies.find((s) => s.id === studyId);
  if (!study) throw new ApiError(404, '스터디를 찾을 수 없어요.');
  return study;
}

function requireMember(db: MockDb, studyId: number): { user: MockUser; member: MockMember; study: MockStudy } {
  const user = requireLogin(db);
  const study = findStudy(db, studyId);
  const member = db.members.find((m) => m.studyId === studyId && m.userId === user.id);
  if (!member) throw new ApiError(403, '이 스터디에 속한 사람만 볼 수 있어요.');
  return { user, member, study };
}

function requireManager(db: MockDb, studyId: number) {
  const ctx = requireMember(db, studyId);
  if (ctx.member.role !== 'MANAGER') throw new ApiError(403, '스터디 진행자(운영진)만 할 수 있어요.');
  return ctx;
}

function findWeek(db: MockDb, weekId: number): Week {
  const week = db.weeks.find((w) => w.id === weekId);
  if (!week) throw new ApiError(404, '주차를 찾을 수 없어요.');
  return week;
}

// ───────── 응답 모양 만들기 ─────────

const toUser = (u: MockUser): User => ({ id: u.id, email: u.email, nickname: u.nickname, systemRole: u.systemRole, createdAt: u.createdAt });

function toMember(db: MockDb, m: MockMember): StudyMember {
  const u = db.users.find((x) => x.id === m.userId);
  return { id: m.id, studyId: m.studyId, userId: m.userId, nickname: u?.nickname ?? '(알 수 없음)', email: u?.email, role: m.role, status: m.status, joinedAt: m.joinedAt };
}

function toStudyDetail(db: MockDb, s: MockStudy, myRole: StudyRole): StudyDetail {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    inviteCode: myRole === 'MANAGER' ? s.inviteCode : null,
    createdBy: s.createdBy,
    myRole,
    memberCount: db.members.filter((m) => m.studyId === s.id).length,
    tags: db.tags.filter((t) => t.studyId === s.id),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function withNickname(db: MockDb, s: Submission): Submission {
  const m = db.members.find((x) => x.id === s.memberId);
  const u = m ? db.users.find((x) => x.id === m.userId) : undefined;
  return { ...s, nickname: u?.nickname };
}

function toSummary(db: MockDb, s: MockStudy, me: MockMember): StudySummary {
  const weeks = db.weeks.filter((w) => w.studyId === s.id);
  const current = pickCurrentWeek(weeks);
  const studyMembers = db.members.filter((m) => m.studyId === s.id);
  const targets = studyMembers.filter((m) => m.role === 'MEMBER');
  const currentSubs = current ? db.submissions.filter((x) => x.weekId === current.id) : [];
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    myRole: me.role,
    memberCount: studyMembers.length,
    currentWeekNo: current?.weekNo ?? null,
    nextDeadline: current?.deadline ?? null,
    mySubmitted: current ? currentSubs.some((x) => x.memberId === me.id) : null,
    currentWeekSubmittedCount: currentSubs.filter((x) => targets.some((t) => t.id === x.memberId)).length,
    currentWeekTargetCount: targets.length,
  };
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : v == null ? null : String(v);
}

// ───────── 라우트 (API 명세 순서 그대로) ─────────

const routes: Array<[Method, string, Handler]> = [
  // Auth
  ['POST', '/api/v1/auth/signup', ({ db, body }) => {
    const email = str(body.email)?.trim() ?? '';
    if (db.users.some((u) => u.email === email)) throw new ApiError(409, '이미 가입된 이메일입니다.');
    const user: MockUser = { id: nextId(), email, password: str(body.password) ?? '', nickname: str(body.nickname) ?? '', systemRole: 'USER', createdAt: now() };
    db.users.push(user);
    return toUser(user);
  }],
  ['POST', '/api/v1/auth/login', ({ db, body, form }) => {
    const email = (form instanceof URLSearchParams ? form.get('email') : str(body.email)) ?? '';
    const password = (form instanceof URLSearchParams ? form.get('password') : str(body.password)) ?? '';
    const user = db.users.find((u) => u.email === email.trim() && u.password === password);
    if (!user) throw new ApiError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    db.sessionUserId = user.id;
    return toUser(user);
  }],
  ['POST', '/api/v1/auth/logout', ({ db }) => {
    db.sessionUserId = null;
    return null;
  }],

  // User
  ['GET', '/api/v1/users/me', ({ db }) => toUser(requireLogin(db))],
  ['PATCH', '/api/v1/users/me/password', ({ db, body }) => {
    const user = requireLogin(db);
    if (user.password !== str(body.currentPassword)) throw new ApiError(400, '현재 비밀번호가 올바르지 않습니다.');
    user.password = str(body.newPassword) ?? user.password;
    return null;
  }],
  ['PATCH', '/api/v1/users/me', ({ db, body }) => {
    const user = requireLogin(db);
    if (body.nickname) user.nickname = String(body.nickname);
    return toUser(user);
  }],
  ['DELETE', '/api/v1/users/me', ({ db }) => {
    const user = requireLogin(db);
    db.users = db.users.filter((u) => u.id !== user.id);
    db.members = db.members.filter((m) => m.userId !== user.id);
    db.sessionUserId = null;
    return null;
  }],

  // Study
  ['POST', '/api/v1/studies/join', ({ db, body }) => {
    const user = requireLogin(db);
    const code = (str(body.inviteCode) ?? '').trim().toUpperCase();
    const study = db.studies.find((s) => s.inviteCode.toUpperCase() === code);
    if (!study) throw new ApiError(404, '초대 코드가 올바르지 않아요.');
    if (db.members.some((m) => m.studyId === study.id && m.userId === user.id)) throw new ApiError(409, '이미 참여 중인 스터디예요.');
    db.members.push({ id: nextId(), studyId: study.id, userId: user.id, role: 'MEMBER', status: 'ACTIVE', joinedAt: now() });
    return toStudyDetail(db, study, 'MEMBER');
  }],
  ['POST', '/api/v1/studies', ({ db, body }) => {
    const user = requireLogin(db);
    const study: MockStudy = {
      id: nextId(),
      name: str(body.name) ?? '',
      description: str(body.description) ?? '',
      inviteCode: randomInviteCode(),
      createdBy: user.id,
      totalWeeks: typeof body.totalWeeks === 'number' ? body.totalWeeks : undefined,
      capacity: typeof body.capacity === 'number' ? body.capacity : undefined,
      createdAt: now(),
      updatedAt: now(),
    };
    db.studies.push(study);
    db.members.push({ id: nextId(), studyId: study.id, userId: user.id, role: 'MANAGER', status: 'ACTIVE', joinedAt: now() });
    return toStudyDetail(db, study, 'MANAGER');
  }],
  ['GET', '/api/v1/studies', ({ db }) => {
    const user = requireLogin(db);
    return db.members
      .filter((m) => m.userId === user.id)
      .map((m) => toSummary(db, findStudy(db, m.studyId), m));
  }],
  ['GET', '/api/v1/studies/:studyId', ({ db, params }) => {
    const { study, member } = requireMember(db, Number(params.studyId));
    return toStudyDetail(db, study, member.role);
  }],
  ['PATCH', '/api/v1/studies/:studyId', ({ db, params, body }) => {
    const { study } = requireManager(db, Number(params.studyId));
    if (body.name !== undefined) study.name = String(body.name);
    if (body.description !== undefined) study.description = String(body.description);
    study.updatedAt = now();
    return toStudyDetail(db, study, 'MANAGER');
  }],
  ['DELETE', '/api/v1/studies/:studyId', ({ db, params }) => {
    const { study } = requireManager(db, Number(params.studyId));
    const weekIds = db.weeks.filter((w) => w.studyId === study.id).map((w) => w.id);
    db.studies = db.studies.filter((s) => s.id !== study.id);
    db.members = db.members.filter((m) => m.studyId !== study.id);
    db.tags = db.tags.filter((t) => t.studyId !== study.id);
    db.weeks = db.weeks.filter((w) => w.studyId !== study.id);
    db.submissions = db.submissions.filter((s) => !weekIds.includes(s.weekId));
    db.materials = db.materials.filter((m) => !weekIds.includes(m.weekId));
    db.best = db.best.filter((b) => !weekIds.includes(b.weekId));
    return null;
  }],
  ['POST', '/api/v1/studies/:studyId/invite-code', ({ db, params }) => {
    const { study } = requireManager(db, Number(params.studyId));
    study.inviteCode = randomInviteCode();
    return { inviteCode: study.inviteCode };
  }],

  // Member
  ['GET', '/api/v1/studies/:studyId/members', ({ db, params }) => {
    requireMember(db, Number(params.studyId));
    return db.members.filter((m) => m.studyId === Number(params.studyId)).map((m) => toMember(db, m));
  }],
  ['DELETE', '/api/v1/studies/:studyId/members/me', ({ db, params }) => {
    const { member } = requireMember(db, Number(params.studyId));
    db.members = db.members.filter((m) => m.id !== member.id);
    return null;
  }],
  ['GET', '/api/v1/studies/:studyId/members/:memberId', ({ db, params }) => {
    requireMember(db, Number(params.studyId));
    const m = db.members.find((x) => x.id === Number(params.memberId) && x.studyId === Number(params.studyId));
    if (!m) throw new ApiError(404, '멤버를 찾을 수 없어요.');
    return toMember(db, m);
  }],
  ['PATCH', '/api/v1/studies/:studyId/members/:memberId/role', ({ db, params, body }) => {
    requireManager(db, Number(params.studyId));
    const m = db.members.find((x) => x.id === Number(params.memberId) && x.studyId === Number(params.studyId));
    if (!m) throw new ApiError(404, '멤버를 찾을 수 없어요.');
    m.role = body.role === 'MANAGER' ? 'MANAGER' : 'MEMBER';
    return toMember(db, m);
  }],
  ['DELETE', '/api/v1/studies/:studyId/members/:memberId', ({ db, params }) => {
    const { member: me } = requireManager(db, Number(params.studyId));
    if (me.id === Number(params.memberId)) throw new ApiError(400, '자기 자신은 내보낼 수 없어요.');
    db.members = db.members.filter((m) => m.id !== Number(params.memberId));
    return null;
  }],

  // Tag
  ['GET', '/api/v1/studies/:studyId/tags', ({ db, params }) => {
    requireMember(db, Number(params.studyId));
    return db.tags.filter((t) => t.studyId === Number(params.studyId));
  }],
  ['POST', '/api/v1/studies/:studyId/tags', ({ db, params, body }) => {
    requireManager(db, Number(params.studyId));
    const tag: StudyTag = { id: nextId(), studyId: Number(params.studyId), name: str(body.name) ?? '', description: str(body.description), createdAt: now() };
    db.tags.push(tag);
    return tag;
  }],
  ['DELETE', '/api/v1/studies/:studyId/tags/:tagId', ({ db, params }) => {
    requireManager(db, Number(params.studyId));
    db.tags = db.tags.filter((t) => t.id !== Number(params.tagId));
    return null;
  }],

  // Week
  ['POST', '/api/v1/studies/:studyId/weeks', ({ db, params, body }) => {
    requireManager(db, Number(params.studyId));
    const input = body as unknown as WeekInput;
    const week: Week = { ...input, id: nextId(), studyId: Number(params.studyId), referenceSummary: null, createdAt: now(), updatedAt: now() };
    db.weeks.push(week);
    return week;
  }],
  ['GET', '/api/v1/studies/:studyId/weeks', ({ db, params }) => {
    requireMember(db, Number(params.studyId));
    return db.weeks.filter((w) => w.studyId === Number(params.studyId));
  }],
  ['GET', '/api/v1/weeks/:weekId', ({ db, params }) => {
    const week = findWeek(db, Number(params.weekId));
    requireMember(db, week.studyId);
    return week;
  }],
  ['PATCH', '/api/v1/weeks/:weekId', ({ db, params, body }) => {
    const week = findWeek(db, Number(params.weekId));
    requireManager(db, week.studyId);
    Object.assign(week, body as Partial<WeekInput>, { updatedAt: now() });
    return week;
  }],
  ['DELETE', '/api/v1/weeks/:weekId', ({ db, params }) => {
    const week = findWeek(db, Number(params.weekId));
    requireManager(db, week.studyId);
    db.weeks = db.weeks.filter((w) => w.id !== week.id);
    db.submissions = db.submissions.filter((s) => s.weekId !== week.id);
    db.materials = db.materials.filter((m) => m.weekId !== week.id);
    db.best = db.best.filter((b) => b.weekId !== week.id);
    return null;
  }],

  // Material
  ['POST', '/api/v1/weeks/:weekId/materials', ({ db, params, body }) => {
    const week = findWeek(db, Number(params.weekId));
    const { user, member } = requireMember(db, week.studyId);
    if (member.role !== 'MANAGER') throw new ApiError(403, '운영진만 자료를 등록할 수 있어요.');
    const title = str(body.title)?.trim() ?? '';
    const url = str(body.url)?.trim() ?? '';
    if (!title || title.length > 100 || url.length > 2048 || !/^https?:\/\/\S+$/i.test(url)) {
      throw new ApiError(400, '자료 제목과 HTTP 또는 HTTPS 링크를 확인해 주세요.');
    }
    const material: SessionMaterial = {
      id: nextId(),
      weekId: week.id,
      uploaderId: user.id,
      originalFilename: title,
      downloadUrl: url,
      createdAt: now(),
    };
    db.materials.push(material);
    return material;
  }],
  ['GET', '/api/v1/weeks/:weekId/materials', ({ db, params }) => {
    const week = findWeek(db, Number(params.weekId));
    requireMember(db, week.studyId);
    return db.materials.filter((m) => m.weekId === week.id);
  }],
  ['GET', '/api/v1/materials/:materialId', ({ db, params }) => {
    const m = db.materials.find((x) => x.id === Number(params.materialId));
    if (!m) throw new ApiError(404, '자료를 찾을 수 없어요.');
    requireMember(db, findWeek(db, m.weekId).studyId);
    return m;
  }],
  ['DELETE', '/api/v1/materials/:materialId', ({ db, params }) => {
    const m = db.materials.find((x) => x.id === Number(params.materialId));
    if (!m) throw new ApiError(404, '자료를 찾을 수 없어요.');
    const { member } = requireMember(db, findWeek(db, m.weekId).studyId);
    if (member.role !== 'MANAGER') throw new ApiError(403, '운영진만 자료를 삭제할 수 있어요.');
    db.materials = db.materials.filter((x) => x.id !== m.id);
    return null;
  }],

  // Submission
  ['POST', '/api/v1/weeks/:weekId/submissions', ({ db, params, body }) => {
    const week = findWeek(db, Number(params.weekId));
    const { member } = requireMember(db, week.studyId);
    if (db.submissions.some((s) => s.weekId === week.id && s.memberId === member.id)) throw new ApiError(409, '이미 제출했어요. 수정하기를 이용해 주세요.');
    const sub: Submission = {
      id: nextId(),
      weekId: week.id,
      memberId: member.id,
      title: str(body.title),
      content: str(body.content),
      originalLink: str(body.originalLink),
      submittedAt: now(),
      updatedAt: now(),
      checkStatus: 'UNCHECKED',
      checkedBy: null,
      checkedAt: null,
    };
    db.submissions.push(sub);
    return withNickname(db, sub);
  }],
  ['GET', '/api/v1/weeks/:weekId/submissions/me', ({ db, params }) => {
    const week = findWeek(db, Number(params.weekId));
    const { member } = requireMember(db, week.studyId);
    const sub = db.submissions.find((s) => s.weekId === week.id && s.memberId === member.id);
    if (!sub) throw new ApiError(404, '아직 제출하지 않았어요.');
    return withNickname(db, sub);
  }],
  ['GET', '/api/v1/weeks/:weekId/submissions', ({ db, params }) => {
    const week = findWeek(db, Number(params.weekId));
    requireMember(db, week.studyId);
    return db.submissions.filter((s) => s.weekId === week.id).map((s) => withNickname(db, s));
  }],
  ['PATCH', '/api/v1/submissions/:submissionId/check', ({ db, params, body }) => {
    const sub = db.submissions.find((s) => s.id === Number(params.submissionId));
    if (!sub) throw new ApiError(404, '제출물을 찾을 수 없어요.');
    const { user } = requireManager(db, findWeek(db, sub.weekId).studyId);
    const checked = body.checkStatus === 'CHECKED';
    sub.checkStatus = checked ? 'CHECKED' : 'UNCHECKED';
    sub.checkedBy = checked ? user.id : null;
    sub.checkedAt = checked ? now() : null;
    return withNickname(db, sub);
  }],
  ['GET', '/api/v1/submissions/:submissionId', ({ db, params }) => {
    const sub = db.submissions.find((s) => s.id === Number(params.submissionId));
    if (!sub) throw new ApiError(404, '제출물을 찾을 수 없어요.');
    requireMember(db, findWeek(db, sub.weekId).studyId);
    return withNickname(db, sub);
  }],
  ['PATCH', '/api/v1/submissions/:submissionId', ({ db, params, body }) => {
    const sub = db.submissions.find((s) => s.id === Number(params.submissionId));
    if (!sub) throw new ApiError(404, '제출물을 찾을 수 없어요.');
    const { member } = requireMember(db, findWeek(db, sub.weekId).studyId);
    if (sub.memberId !== member.id) throw new ApiError(403, '본인 제출물만 수정할 수 있어요.');
    if (body.title !== undefined) sub.title = str(body.title);
    if (body.content !== undefined) sub.content = str(body.content);
    if (body.originalLink !== undefined) sub.originalLink = str(body.originalLink);
    sub.updatedAt = now();
    return withNickname(db, sub);
  }],
  ['DELETE', '/api/v1/submissions/:submissionId', ({ db, params }) => {
    const sub = db.submissions.find((s) => s.id === Number(params.submissionId));
    if (!sub) throw new ApiError(404, '제출물을 찾을 수 없어요.');
    const { member } = requireMember(db, findWeek(db, sub.weekId).studyId);
    if (sub.memberId !== member.id) throw new ApiError(403, '본인 제출물만 삭제할 수 있어요.');
    db.submissions = db.submissions.filter((s) => s.id !== sub.id);
    return null;
  }],

  // Best Member
  ['GET', '/api/v1/weeks/:weekId/best-member', ({ db, params }) => {
    const week = findWeek(db, Number(params.weekId));
    requireMember(db, week.studyId);
    const best = db.best.find((b) => b.weekId === week.id);
    if (!best) throw new ApiError(404, '아직 우수 스터디원을 선정하지 않았어요.');
    const m = db.members.find((x) => x.id === best.memberId);
    return { ...best, nickname: m ? db.users.find((u) => u.id === m.userId)?.nickname : undefined };
  }],
  ['POST', '/api/v1/weeks/:weekId/best-member', ({ db, params, body }) => {
    const week = findWeek(db, Number(params.weekId));
    requireManager(db, week.studyId);
    if (db.best.some((b) => b.weekId === week.id)) throw new ApiError(409, '이미 선정했어요. 수정하기를 이용해 주세요.');
    const best: BestMember = { id: nextId(), weekId: week.id, memberId: Number(body.memberId), reason: str(body.reason), createdAt: now() };
    db.best.push(best);
    return best;
  }],
  ['PATCH', '/api/v1/weeks/:weekId/best-member', ({ db, params, body }) => {
    const week = findWeek(db, Number(params.weekId));
    requireManager(db, week.studyId);
    const best = db.best.find((b) => b.weekId === week.id);
    if (!best) throw new ApiError(404, '선정된 우수 스터디원이 없어요.');
    if (body.memberId !== undefined) best.memberId = Number(body.memberId);
    if (body.reason !== undefined) best.reason = str(body.reason);
    return best;
  }],
  ['DELETE', '/api/v1/weeks/:weekId/best-member', ({ db, params }) => {
    const week = findWeek(db, Number(params.weekId));
    requireManager(db, week.studyId);
    db.best = db.best.filter((b) => b.weekId !== week.id);
    return null;
  }],
];

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/');
  const a = path.split('/');
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function handleMock<T>(method: Method, fullPath: string, opts: RequestOptions): Promise<T> {
  await sleep(150); // 진짜 서버처럼 살짝 늦게 대답
  const path = fullPath.split('?')[0];
  const db = getDb();
  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue;
    const params = match(pattern, path);
    if (!params) continue;
    const body = (opts.body && typeof opts.body === 'object' ? opts.body : {}) as Body;
    const result = handler({ params, body, form: opts.form, db });
    saveDb();
    // 진짜 서버처럼 복사본을 돌려줘요 (화면에서 고쳐도 가짜 DB가 안 바뀌게)
    return (result === undefined || result === null ? null : JSON.parse(JSON.stringify(result))) as T;
  }
  throw new ApiError(404, `[가짜 서버] ${method} ${path} 는 아직 없어요.`);
}
