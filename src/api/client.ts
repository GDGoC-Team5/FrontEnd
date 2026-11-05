/**
 * 모든 API 호출이 지나가는 곳.
 *
 * - 세션 쿠키 방식이라 fetch에 credentials: 'include' 를 꼭 붙여요.
 * - Spring Security csrf.spa() 를 쓰니까 POST/PATCH/DELETE 때 XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 보내요.
 * - 401(로그인 안 함)이면 로그인 화면으로 보내고, 403(권한 없음)은 에러로 던져서 화면이 처리해요.
 * - USE_MOCK이 true면 진짜 서버 대신 src/mocks 의 가짜 데이터가 대답해요.
 */
import { API_BASE_URL, CSRF_COOKIE_NAME, CSRF_HEADER_NAME, USE_MOCK } from '@/lib/config';
import { handleMock } from '@/mocks/handlers';
import { ApiError, defaultMessage } from './errors';

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  /** JSON으로 보낼 내용 */
  body?: unknown;
  /** 파일 업로드(FormData)나 폼 로그인(URLSearchParams)처럼 JSON이 아닌 내용 */
  form?: FormData | URLSearchParams;
  /** true면 401이 나도 로그인 화면으로 보내지 않아요 (로그인 여부 확인용) */
  skipAuthRedirect?: boolean;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * CSRF 쿠키가 아직 없으면 GET 요청을 한 번 보내서 받아와요.
 * (스프링이 GET 응답에 XSRF-TOKEN 쿠키를 심어줘요. 백엔드가 전용 엔드포인트를 만들면 그걸로 바꾸면 돼요.)
 */
async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) return existing;
  try {
    await fetch(`${API_BASE_URL}/api/v1/users/me`, { credentials: 'include' });
  } catch {
    // 서버가 꺼져 있으면 아래 실제 요청에서 에러가 나요
  }
  return readCookie(CSRF_COOKIE_NAME);
}

function handleAuthError(err: ApiError, opts: RequestOptions) {
  if (err.status !== 401 || opts.skipAuthRedirect || typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/signup')) return;
  window.location.href = '/login';
}

function extractMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return null;
}

/**
 * 백엔드가 { success, data, message } 같은 공통 응답으로 감싸서 줄 수도 있어서,
 * 그런 모양이면 data만 꺼내요. 감싸지 않으면 그대로 써요.
 */
function unwrap<T>(data: unknown): T {
  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'data' in data &&
    ('success' in data || 'status' in data || 'code' in data || 'message' in data)
  ) {
    return (data as { data: T }).data;
  }
  return data as T;
}

export async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  if (USE_MOCK) {
    try {
      return await handleMock<T>(method, path, opts);
    } catch (e) {
      if (e instanceof ApiError) handleAuthError(e, opts);
      throw e;
    }
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form; // Content-Type은 브라우저가 알아서 붙여요
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  if (method !== 'GET') {
    const token = await ensureCsrfToken();
    if (token) headers[CSRF_HEADER_NAME] = token;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body, credentials: 'include' });
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해 주세요.');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const err = new ApiError(res.status, extractMessage(data) ?? defaultMessage(res.status), data);
    handleAuthError(err, opts);
    throw err;
  }
  return unwrap<T>(data);
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
  delete: <T = void>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  upload: <T>(path: string, form: FormData, opts?: RequestOptions) => request<T>('POST', path, { ...opts, form }),
};
