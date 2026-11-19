// 생성 단계에서 난 오류를 화면에 보여 줄 모양으로 바꾼다.
import Anthropic from '@anthropic-ai/sdk';
import { API_KEY_ENV } from './apiKey.ts';

export type GenerationErrorKind =
  | 'missing-key'
  | 'auth'
  | 'permission'
  | 'rate-limit'
  | 'overloaded'
  | 'bad-request'
  | 'network'
  | 'api'
  | 'unknown';

export type GenerationError = {
  kind: GenerationErrorKind;
  title: string;
  message: string;
  status?: number;
  retryable: boolean;
};

export class MissingApiKeyError extends Error {
  constructor() {
    super(`${API_KEY_ENV}가 설정되지 않았습니다.`);
    this.name = 'MissingApiKeyError';
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Anthropic.APIUserAbortError || (error instanceof DOMException && error.name === 'AbortError');
}

// 가장 구체적인 오류부터 확인한다.
export function toGenerationError(error: unknown): GenerationError {
  if (error instanceof MissingApiKeyError) {
    return {
      kind: 'missing-key',
      title: 'API 키가 없습니다',
      message: `저장소 루트 .env에 ${API_KEY_ENV}를 넣고 개발 서버를 다시 시작하세요.`,
      retryable: false,
    };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    return { kind: 'auth', title: 'API 키를 확인하세요', message: '키가 올바르지 않거나 만료되었습니다.', status: error.status, retryable: false };
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return { kind: 'permission', title: '권한이 없습니다', message: error.message, status: error.status, retryable: false };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { kind: 'rate-limit', title: '요청이 너무 많습니다', message: '잠시 후 다시 시도하세요.', status: error.status, retryable: true };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { kind: 'bad-request', title: '요청을 처리할 수 없습니다', message: error.message, status: error.status, retryable: false };
  }
  if (error instanceof Anthropic.InternalServerError) {
    const overloaded = error.status === 529;
    return {
      kind: overloaded ? 'overloaded' : 'api',
      title: overloaded ? '서버가 혼잡합니다' : '서버 오류',
      message: '잠시 후 다시 시도하세요.',
      status: error.status,
      retryable: true,
    };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { kind: 'network', title: '연결할 수 없습니다', message: '네트워크 상태를 확인하세요.', retryable: true };
  }
  if (error instanceof Anthropic.APIError) {
    return { kind: 'api', title: 'API 오류', message: error.message, status: error.status, retryable: true };
  }
  return {
    kind: 'unknown',
    title: '알 수 없는 오류',
    message: error instanceof Error ? error.message : String(error),
    retryable: true,
  };
}
