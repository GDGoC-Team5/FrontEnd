/** NEXT_PUBLIC_USE_MOCK=false 로 바꾸기 전까지는 가짜 데이터로 돌아가요. */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

/**
 * 백엔드 주소를 직접 부르고 싶을 때만 씀 (예: https://api.studyhub.com).
 * 비워두면 같은 주소의 /api/... 로 요청하고, next.config.ts의 프록시가 백엔드로 넘겨줘요.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/** Spring Security csrf.spa() 기본값 */
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
