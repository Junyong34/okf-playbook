// 로컬 API 서버 (server/app.ts, server/generate.ts). 생성기 seam에 가짜를 넣어 실제 HTTP로 검사한다.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../server/app.ts';
import { toGenerationResult, type FinalMessage } from '../server/generate.ts';
import { GenerationFailure, NDJSON, readGeneration } from '../shared/claude/protocol.ts';
import type { Generate, GenerateParams, GenerationResult } from '../shared/claude/types.ts';

const result: GenerationResult = {
  text: '가능합니다.',
  stopReason: 'end_turn',
  servedModel: 'claude-opus-5-5',
  fallbackUsed: false,
  usage: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
  refusal: null,
};

const body = {
  request: { system: '지시문', messages: [{ role: 'user', content: '질문' }] },
  settings: { model: 'claude-opus-5-5', effort: 'low' },
};

async function serve(generate: Generate | null): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = await new Promise((resolve) => {
    const s = createApp({ generate }).listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(() => r())) };
}

function post(url: string, payload: unknown): Promise<Response> {
  return fetch(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

function read(response: Response, onText: (delta: string) => void = () => {}): Promise<GenerationResult> {
  return readGeneration(response.body!.pipeThrough(new TextDecoderStream()), onText);
}

describe('createApp', () => {
  let calls: GenerateParams[] = [];
  let behavior: (params: GenerateParams) => Promise<GenerationResult>;
  let app: Awaited<ReturnType<typeof serve>>;

  before(async () => {
    app = await serve((params) => {
      calls.push(params);
      return behavior(params);
    });
  });
  after(() => app.close());

  test('/api/status는 생성기가 있으면 keyReady', async () => {
    const response = await fetch(`${app.url}/api/status`);
    assert.deepEqual(await response.json(), { keyReady: true });
  });

  test('텍스트 조각을 흘려보낸 뒤 결과로 끝난다', async () => {
    calls = [];
    behavior = async ({ onText }) => {
      onText('가능');
      onText('합니다.');
      return result;
    };
    const response = await post(app.url, body);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type')?.startsWith(NDJSON));
    const deltas: string[] = [];
    assert.deepEqual(await read(response, (d) => deltas.push(d)), result);
    assert.deepEqual(deltas, ['가능', '합니다.']);
  });

  test('허용한 메시지 필드만 생성기에 넘긴다', async () => {
    calls = [];
    behavior = async () => result;
    const extra = { ...body, request: { ...body.request, messages: [{ role: 'user', content: '질문', cache_control: { type: 'ephemeral' } }] } };
    await read(await post(app.url, extra));
    assert.deepEqual(calls[0].request, body.request);
    assert.deepEqual(calls[0].settings, body.settings);
  });

  test('생성기가 실패하면 error 이벤트로 끝난다', async () => {
    behavior = async () => { throw new Error('boom'); };
    await assert.rejects(read(await post(app.url, body)), (error) => {
      assert.ok(error instanceof GenerationFailure);
      assert.equal(error.detail.kind, 'unknown');
      return true;
    });
  });

  test('요청 형식이 틀리면 400과 bad-request', async () => {
    calls = [];
    const response = await post(app.url, { ...body, settings: { model: 'gpt', effort: 'low' } });
    assert.equal(response.status, 400);
    await assert.rejects(read(response), (error) => error instanceof GenerationFailure && error.detail.status === 400);
    assert.equal(calls.length, 0);
  });

  test('JSON이 깨지면 400', async () => {
    const response = await post(app.url, '{');
    assert.equal(response.status, 400);
    await assert.rejects(read(response), (error) => error instanceof GenerationFailure && error.detail.kind === 'bad-request');
  });

  test('1MB를 넘으면 413', async () => {
    const big = { ...body, request: { ...body.request, system: 'x'.repeat(1_100_000) } };
    const response = await post(app.url, big);
    assert.equal(response.status, 413);
    await assert.rejects(read(response), (error) => error instanceof GenerationFailure && error.detail.status === 413);
  });

  test('클라이언트가 끊으면 생성기 signal도 끊긴다', async () => {
    let aborted!: Promise<void>;
    behavior = ({ signal }) => {
      aborted = new Promise((resolve) => signal.addEventListener('abort', () => resolve(), { once: true }));
      return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
    };
    const controller = new AbortController();
    const response = await fetch(`${app.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    assert.equal(response.status, 200);
    controller.abort();
    await aborted;
  });
});

describe('createApp (키 없음)', () => {
  test('생성기가 null이면 status는 keyReady false, generate는 503 missing-key', async () => {
    const app = await serve(null);
    try {
      assert.deepEqual(await (await fetch(`${app.url}/api/status`)).json(), { keyReady: false });
      const response = await post(app.url, body);
      assert.equal(response.status, 503);
      await assert.rejects(read(response), (error) => error instanceof GenerationFailure && error.detail.kind === 'missing-key');
    } finally {
      await app.close();
    }
  });
});

describe('toGenerationResult', () => {
  const message = (patch: Record<string, unknown> = {}) => ({
    model: 'claude-opus-5-5',
    stop_reason: 'end_turn',
    content: [{ type: 'text', text: '가능' }, { type: 'thinking', thinking: '...' }, { type: 'text', text: '합니다.' }],
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 3, cache_creation_input_tokens: null },
    ...patch,
  }) as unknown as FinalMessage;

  test('text 블록만 이어 붙이고 usage의 null은 0으로', () => {
    const got = toGenerationResult(message());
    assert.equal(got.text, '가능합니다.');
    assert.deepEqual(got.usage, { input: 10, output: 5, cacheRead: 3, cacheWrite: 0 });
    assert.equal(got.fallbackUsed, false);
    assert.equal(got.refusal, null);
  });

  test('모르는 stop_reason은 other', () => {
    assert.equal(toGenerationResult(message({ stop_reason: 'model_context_window_exceeded' })).stopReason, 'other');
  });

  test('usage.iterations에 fallback_message가 있으면 fallbackUsed', () => {
    const usage = { input_tokens: 1, output_tokens: 1, iterations: [{ type: 'message' }, { type: 'fallback_message' }] };
    const got = toGenerationResult(message({ model: 'claude-sonnet-5-5', usage }));
    assert.equal(got.fallbackUsed, true);
    assert.equal(got.servedModel, 'claude-sonnet-5-5');
  });

  test('거절이면 stop_details를 refusal로', () => {
    const got = toGenerationResult(message({ stop_reason: 'refusal', stop_details: { category: 'cyber', explanation: null } }));
    assert.equal(got.stopReason, 'refusal');
    assert.deepEqual(got.refusal, { category: 'cyber', explanation: null });
  });
});
