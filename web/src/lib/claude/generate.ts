// 생성 요청을 보내고 NDJSON 응답을 한 줄씩 처리한다.
import { GenerationFailure } from './errors.ts';
import type { GenerateParams, GenerationEvent, GenerationResult } from '@claude/types.ts';

export async function generate({ request, settings, signal, onText }: GenerateParams): Promise<GenerationResult> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, settings }),
    signal,
  });
  if (!response.body || !response.headers.get('content-type')?.startsWith('application/x-ndjson')) {
    throw new Error('API 서버의 응답 형식이 올바르지 않습니다.');
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) throw new Error('최종 결과를 받기 전에 응답이 종료되었습니다.');
      pending += value;

      let lineEnd = pending.indexOf('\n');
      while (lineEnd !== -1) {
        const event = JSON.parse(pending.slice(0, lineEnd)) as GenerationEvent;
        pending = pending.slice(lineEnd + 1);
        if (event.type === 'result') return event.result;
        if (event.type === 'error') throw new GenerationFailure(event.error);
        onText(event.delta);
        lineEnd = pending.indexOf('\n');
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
