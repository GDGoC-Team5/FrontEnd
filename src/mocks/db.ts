/**
 * 가짜 데이터베이스. 백엔드가 없어도 화면을 만들고 눌러볼 수 있게 해줘요.
 * 브라우저 localStorage에 저장돼서 새로고침해도 유지돼요.
 * 처음 상태로 되돌리고 싶으면 개발자도구 콘솔에서 localStorage.removeItem('studyhub-mock-db-v1') 하거나
 * 로그인 화면 아래 '가짜 데이터 초기화'를 누르세요.
 */
import type { BestMember, SessionMaterial, StudyRole, StudyTag, Submission, Week } from '@/types/api';
import { toLocalDateTimeString } from '@/lib/dates';

export interface MockUser {
  id: number;
  email: string;
  password: string;
  nickname: string;
  systemRole: string;
  createdAt: string;
}

export interface MockStudy {
  id: number;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: number;
  totalWeeks?: number;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockMember {
  id: number;
  studyId: number;
  userId: number;
  role: StudyRole;
  status: string;
  joinedAt: string;
}

export interface MockDb {
  seq: number;
  sessionUserId: number | null;
  users: MockUser[];
  studies: MockStudy[];
  members: MockMember[];
  tags: StudyTag[];
  weeks: Week[];
  materials: SessionMaterial[];
  submissions: Submission[];
  best: BestMember[];
}

const KEY = 'studyhub-mock-db-v1';
let db: MockDb | null = null;

const DAY = 24 * 60 * 60 * 1000;

function at(base: Date, dayOffset: number, hour: number, minute: number) {
  const d = new Date(base.getTime() + dayOffset * DAY);
  d.setHours(hour, minute, 0, 0);
  return toLocalDateTimeString(d);
}

export function randomInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function seed(): MockDb {
  const now = new Date();
  const nowStr = toLocalDateTimeString(now);
  let seq = 1000;
  const id = () => ++seq;

  const users: MockUser[] = [
    { id: 1, email: 'demo@gdgoc.com', password: 'demo1234!', nickname: '혜민', systemRole: 'USER', createdAt: nowStr },
    ...['혜리', '현우', '승윤', '유리', '민지', '서연', '지훈', '도윤'].map((nickname, i) => ({
      id: i + 2,
      email: `member${i + 2}@gdgoc.com`,
      password: 'demo1234!',
      nickname,
      systemRole: 'USER',
      createdAt: nowStr,
    })),
  ];

  const studies: MockStudy[] = [
    { id: 101, name: 'Dev 스터디', description: 'Spring Boot로 서비스를 만들며 매주 학습 내용을 정리합니다.', inviteCode: 'DEV2026A', createdBy: 1, totalWeeks: 8, capacity: 12, createdAt: nowStr, updatedAt: nowStr },
    { id: 102, name: 'Design 스터디', description: 'KRDS와 피그마로 UI 기본기를 다져요.', inviteCode: 'DSGN2026', createdBy: 2, totalWeeks: 8, capacity: 12, createdAt: nowStr, updatedAt: nowStr },
    { id: 103, name: 'ML 스터디', description: '머신러닝 기초를 함께 공부해요.', inviteCode: 'ML2026XY', createdBy: 3, totalWeeks: 8, capacity: 12, createdAt: nowStr, updatedAt: nowStr },
  ];

  const members: MockMember[] = [];
  const addMember = (studyId: number, userId: number, role: StudyRole) => {
    const m: MockMember = { id: id(), studyId, userId, role, status: 'ACTIVE', joinedAt: nowStr };
    members.push(m);
    return m;
  };

  // Dev: 내가 운영진, 2~9번이 스터디원
  addMember(101, 1, 'MANAGER');
  const devMembers = [2, 3, 4, 5, 6, 7, 8, 9].map((u) => addMember(101, u, 'MEMBER'));
  // Design: 혜리가 운영진, 내가 스터디원
  addMember(102, 2, 'MANAGER');
  const meInDesign = addMember(102, 1, 'MEMBER');
  [3, 4, 5].forEach((u) => addMember(102, u, 'MEMBER'));
  // ML: 현우가 운영진, 내가 스터디원
  addMember(103, 3, 'MANAGER');
  const meInMl = addMember(103, 1, 'MEMBER');
  [4, 6, 7].forEach((u) => addMember(103, u, 'MEMBER'));

  const weeks: Week[] = [];
  const makeWeeks = (studyId: number, titles: string[], currentDeadlineInDays: number, hour: number) =>
    titles.map((title, i) => {
      const weeksAgo = titles.length - 1 - i;
      const deadlineOffset = currentDeadlineInDays - weeksAgo * 7;
      const w: Week = {
        id: id(),
        studyId,
        weekNo: i + 1,
        title,
        assignmentType: 'LINKEDIN',
        assignmentDescription: '세션 내용을 정리해 링크드인에 올리고 링크를 제출해 주세요.',
        sessionAt: at(now, deadlineOffset - 6, hour, 0),
        location: '스터디룸 B',
        deadline: at(now, deadlineOffset, 23, 59),
        referenceSummary: null,
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      weeks.push(w);
      return w;
    });

  const devWeeks = makeWeeks(
    101,
    ['자바 기본기 복습', 'DI와 IoC 컨테이너', 'Spring MVC 요청 흐름', 'REST API 설계 원칙', 'JPA 연관관계 매핑', 'Spring Security 세션 인증 정리'],
    6,
    22,
  );
  const designWeeks = makeWeeks(102, ['KRDS 훑어보기', '타이포그래피', '컬러 시스템', '컴포넌트 설계', '피그마 오토레이아웃'], 5, 19);
  const mlWeeks = makeWeeks(103, ['파이썬 데이터 다루기', '선형회귀', '로지스틱 회귀'], 2, 20);

  const submissions: Submission[] = [];
  const addSub = (week: Week, memberId: number, late: boolean, nickname?: string) => {
    const deadline = new Date(week.deadline as string);
    const submittedAt = toLocalDateTimeString(new Date(deadline.getTime() + (late ? 1 : -2) * DAY));
    const due = deadline.getTime() < now.getTime();
    submissions.push({
      id: id(),
      weekId: week.id,
      memberId,
      nickname,
      title: `${week.title} 정리`,
      content: `## ${week.title}\n\n- 이번 주에 배운 핵심 개념을 정리했어요.\n- 예제 코드를 직접 돌려보고 느낀 점을 적었어요.`,
      originalLink: `https://www.linkedin.com/posts/${memberId}-week${week.weekNo}`,
      submittedAt,
      updatedAt: submittedAt,
      checkStatus: due ? 'CHECKED' : 'UNCHECKED',
      checkedBy: due ? 1 : null,
      checkedAt: due ? submittedAt : null,
    });
  };

  // D=제출, L=지연, M=미제출, -=아직 안 냄(이번 주)
  const patterns = ['DDDDLD', 'DDDLD-', 'DDDDD-', 'DDDLM-', 'DDDDDD', 'DDLDDD', 'DDDDL-', 'DMDDDD'];
  devMembers.forEach((m, mi) => {
    patterns[mi].split('').forEach((p, wi) => {
      if (p === 'D' || p === 'L') addSub(devWeeks[wi], m.id, p === 'L');
    });
  });
  designWeeks.forEach((w) => addSub(w, meInDesign.id, false));
  mlWeeks.slice(0, 2).forEach((w) => addSub(w, meInMl.id, false));

  const tags: StudyTag[] = [
    { id: id(), studyId: 101, name: 'Spring', description: null, createdAt: nowStr },
    { id: id(), studyId: 101, name: '백엔드', description: null, createdAt: nowStr },
    { id: id(), studyId: 102, name: 'Figma', description: null, createdAt: nowStr },
  ];

  const materials: SessionMaterial[] = [
    { id: id(), weekId: devWeeks[4].id, uploaderId: 1, originalFilename: 'jpa-연관관계.pdf', contentType: 'application/pdf', fileSize: 1240000, downloadUrl: null, createdAt: nowStr },
  ];

  const best: BestMember[] = [
    { id: id(), weekId: devWeeks[4].id, memberId: devMembers[4].id, reason: '세션 흐름을 다이어그램으로 정리', createdAt: nowStr },
  ];

  return { seq, sessionUserId: null, users, studies, members, tags, weeks, materials, submissions, best };
}

export function getDb(): MockDb {
  if (db) return db;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        db = JSON.parse(raw) as MockDb;
        return db;
      }
    } catch {
      // 저장소를 못 쓰면 메모리에만 둬요
    }
  }
  db = seed();
  saveDb();
  return db;
}

export function saveDb() {
  if (!db || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // 무시
  }
}

export function resetDb() {
  db = seed();
  saveDb();
}

export function nextId() {
  const d = getDb();
  d.seq += 1;
  return d.seq;
}
