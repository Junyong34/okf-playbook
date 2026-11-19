import Anthropic from '@anthropic-ai/sdk';
import type { GenerationError } from '../src/claude/types.ts';

export function toGenerationError(error: unknown): GenerationError {
  if (error instanceof Anthropic.AuthenticationError) {
    return { kind: 'auth', title: 'API 키를 확인하세요', message: '키가 올바르지 않거나 만료되었습니다.', status: error.status, retryable: false };
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return { kind: 'permission', title: '권한이 없습니다', message: 'Claude API 요청 설정을 확인하세요.', status: error.status, retryable: false };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { kind: 'rate-limit', title: '요청이 너무 많습니다', message: '잠시 후 다시 시도하세요.', status: error.status, retryable: true };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { kind: 'bad-request', title: '요청을 처리할 수 없습니다', message: 'Claude API 요청 설정을 확인하세요.', status: error.status, retryable: false };
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
    return { kind: 'api', title: 'API 오류', message: '잠시 후 다시 시도하세요.', status: error.status, retryable: true };
  }
  return {
    kind: 'unknown',
    title: '알 수 없는 오류',
    message: 'API 서버 로그를 확인하거나 다시 시도하세요.',
    retryable: true,
  };
}
