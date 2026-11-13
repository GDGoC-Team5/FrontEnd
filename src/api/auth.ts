import type { User } from '@/types/api';
import { USE_MOCK } from '@/lib/config';
import { api } from './client';

const authPath = USE_MOCK ? '/api/v1/auth' : '/api/auth';
const mePath = USE_MOCK ? '/api/v1/users/me' : '/api/users/me';
type ServerUser = Omit<User, 'nickname'> & { name: string };

function toUser(user: User | ServerUser): User {
  return 'name' in user ? { ...user, nickname: user.name } : user;
}

export async function login(email: string, password: string) {
  const user = await api.post<User | ServerUser>(`${authPath}/login`, { email, password }, { skipAuthRedirect: true });
  return toUser(user);
}

export interface SignupInput {
  email: string;
  nickname: string;
  password: string;
}

export async function signup(input: SignupInput) {
  const body = USE_MOCK ? input : { email: input.email, password: input.password, name: input.nickname };
  return toUser(await api.post<User | ServerUser>(`${authPath}/signup`, body, { skipAuthRedirect: true }));
}

export function logout() {
  return api.post<void>(`${authPath}/logout`, undefined, { skipAuthRedirect: true });
}

/** 내 정보. 로그인 안 했으면 401 에러가 나요. */
export async function getMe(opts?: { skipAuthRedirect?: boolean }) {
  return toUser(await api.get<User | ServerUser>(mePath, opts));
}

export function updateMe(input: { nickname: string }) {
  return api.patch<User>('/api/v1/users/me', input);
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return api.patch<void>('/api/v1/users/me/password', input);
}

export function withdraw() {
  return api.delete('/api/v1/users/me');
}
