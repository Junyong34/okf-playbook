// 서버와 브라우저 사이의 생성 이벤트 프로토콜. 양쪽이 이 module 하나를 쓴다.
// - 응답은 NDJSON: 한 줄에 GenerationEvent 하나
// - text 이벤트가 0개 이상 온 뒤 result 또는 error 하나로 끝난다. 그 전에 끊기면 실패다.
import { EFFORTS, MODEL_OPTIONS } from './models.ts';
import type { GenerateInput, GenerationError, GenerationEvent, GenerationResult } from './types.ts';

export const NDJSON = 'application/x-ndjson';

// 서버가 error 이벤트로 알려 준 실패
export class GenerationFailure extends Error {
  readonly detail: GenerationError;

  constructor(detail: GenerationError) {
    super(detail.message);
    this.detail = detail;
  }
}

export function encodeEvent(event: GenerationEvent): string {
  return JSON.stringify(event) + '\n';
}

// 청크 열을 읽어 최종 결과를 돌려준다. 줄 경계는 청크 경계와 상관없다.
// error 이벤트면 GenerationFailure, 결과 없이 끝나면 Error를 던진다.
export async function readGeneration(
  chunks: AsyncIterable<string>,
  onText: (delta: string) => void,
): Promise<GenerationResult> {
  let pending = '';
  for await (const chunk of chunks) {
    pending += chunk;
    let lineEnd = pending.indexOf('\n');
    while (lineEnd !== -1) {
      const line = pending.slice(0, lineEnd);
      pending = pending.slice(lineEnd + 1);
      lineEnd = pending.indexOf('\n');
      if (line.trim() === '') continue;
      const event = JSON.parse(line) as GenerationEvent;
      if (event.type === 'result') return event.result;
      if (event.type === 'error') throw new GenerationFailure(event.error);
      onText(event.delta);
    }
  }
  throw new Error('최종 결과를 받기 전에 응답이 종료되었습니다.');
}

// 서버가 받는 요청 본문 검사. 메시지는 user 하나만 허용한다.
export function isGenerateInput(body: unknown): body is GenerateInput {
  const { request, settings } = (body ?? {}) as Partial<GenerateInput>;
  return typeof request?.system === 'string'
    && Array.isArray(request.messages)
    && request.messages.length === 1
    && request.messages[0]?.role === 'user'
    && typeof request.messages[0]?.content === 'string'
    && MODEL_OPTIONS.some(({ id }) => id === settings?.model)
    && EFFORTS.some((effort) => effort === settings?.effort);
}

export const MISSING_KEY_MESSAGE = '저장소 루트 .env에 ANTHROPIC_API_KEY를 넣고 API 서버를 다시 시작하세요.';

export const MISSING_KEY_ERROR: GenerationError = {
  kind: 'missing-key',
  title: 'API 키가 없습니다',
  message: MISSING_KEY_MESSAGE,
  retryable: false,
};

export function badRequestError(status: 400 | 413): GenerationError {
  return {
    kind: 'bad-request',
    title: '요청을 처리할 수 없습니다',
    message: status === 413 ? '모델 요청이 1MB를 넘습니다.' : '모델 요청 형식이나 생성 설정을 확인하세요.',
    status,
    retryable: false,
  };
}

// 브라우저 쪽 분류: 서버가 알려 준 실패는 그대로, 나머지(연결 실패, 형식 오류, 중간 끊김)는 network다.
export function toClientError(error: unknown): GenerationError {
  if (error instanceof GenerationFailure) return error.detail;
  return {
    kind: 'network',
    title: '응답을 받을 수 없습니다',
    message: '로컬 API 서버가 실행 중인지 확인하고 다시 시도하세요.',
    retryable: true,
  };
}
