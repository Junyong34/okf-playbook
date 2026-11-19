import type { GenerationError } from '@claude/types.ts';

export class GenerationFailure extends Error {
  readonly detail: GenerationError;

  constructor(detail: GenerationError) {
    super(detail.message);
    this.detail = detail;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function toGenerationError(error: unknown): GenerationError {
  if (error instanceof GenerationFailure) return error.detail;
  return {
    kind: 'network',
    title: '응답을 받을 수 없습니다',
    message: '로컬 API 서버가 실행 중인지 확인하고 다시 시도하세요.',
    retryable: true,
  };
}
