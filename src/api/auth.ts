import type { User } from '@/types/api';
import { api } from './client';

/**
 * 로그인. Spring Security "폼 로그인"은 기본적으로 JSON이 아니라
 * application/x-www-form-urlencoded (username=...&password=...) 로 받아요.
 *
 * ⚠️ 백엔드에 확인할 것
 *   1) 파라미터 이름: 기본은 username/password. usernameParameter("email")로 바꿨다면 아래 'email' 그대로.
 *   2) 로그인 성공 시 302 리다이렉트 말고 200 + 유저 정보(JSON)를 주도록 successHandler 설정
 *   3) 실패 시 401 + { message } 로 응답
 *   JSON으로 받기로 했다면 아래를 api.post('/api/v1/auth/login', { email, password }) 로 바꾸면 돼요.
 */
export function login(email: string, password: string) {
  const form = new URLSearchParams();
  form.set('email', email);
  form.set('password', password);
  return api.post<User | null>('/api/v1/auth/login', undefined, { form, skipAuthRedirect: true });
}

export interface SignupInput {
  email: string;
  nickname: string;
  password: string;
}

export function signup(input: SignupInput) {
  return api.post<User>('/api/v1/auth/signup', input, { skipAuthRedirect: true });
}

export function logout() {
  return api.post<void>('/api/v1/auth/logout', undefined, { skipAuthRedirect: true });
}

/** 내 정보. 로그인 안 했으면 401 에러가 나요. */
export function getMe(opts?: { skipAuthRedirect?: boolean }) {
  return api.get<User>('/api/v1/users/me', opts);
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
