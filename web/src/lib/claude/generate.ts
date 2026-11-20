// 생성기 seam의 브라우저 adapter: /api/generate에 요청을 보내고 NDJSON 응답을 프로토콜 module로 읽는다.
import { NDJSON, readGeneration } from '@claude/protocol.ts';
import type { GenerateParams, GenerationResult } from '@claude/types.ts';

export async function generate({ request, settings, signal, onText }: GenerateParams): Promise<GenerationResult> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request, settings }),
    signal,
  });
  if (!response.body || !response.headers.get('content-type')?.startsWith(NDJSON)) {
    throw new Error('API 서버의 응답 형식이 올바르지 않습니다.');
  }
  return readGeneration(chunksOf(response.body.pipeThrough(new TextDecoderStream())), onText);
}

// ReadableStream의 for await는 Safari 26.4부터라 reader로 직접 읽는다. 중간에 멈추면 스트림을 취소한다.
async function* chunksOf(stream: ReadableStream<string>): AsyncGenerator<string> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
