/** API 호출이 실패했을 때 던지는 에러. status로 401/403/404 등을 구분해요. */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function isApiError(e: unknown, status?: number): e is ApiError {
  return e instanceof ApiError && (status === undefined || e.status === status);
}

/** 화면에 보여줄 에러 문구 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return '알 수 없는 오류가 발생했어요.';
}

export function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return '입력한 내용을 다시 확인해 주세요.';
    case 401:
      return '로그인이 필요해요.';
    case 403:
      return '이 기능을 쓸 권한이 없어요.';
    case 404:
      return '찾을 수 없어요.';
    case 409:
      return '이미 처리된 요청이에요.';
    default:
      return status >= 500 ? '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' : '요청에 실패했어요.';
  }
}
