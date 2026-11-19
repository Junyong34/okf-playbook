import Anthropic from '@anthropic-ai/sdk';
import express, { type ErrorRequestHandler, type Response } from 'express';
import { EFFORTS, MODEL_OPTIONS } from '../shared/claude/models.ts';
import type { GenerateInput, GenerationEvent } from '../shared/claude/types.ts';
import { toGenerationError } from './errors.ts';
import { generate } from './generate.ts';

const app = express();
const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
const client = apiKey ? new Anthropic({ apiKey }) : null;

function isGenerateInput(body: GenerateInput | undefined): body is GenerateInput {
  const { request, settings } = body ?? {};
  return typeof request?.system === 'string'
    && Array.isArray(request.messages)
    && request.messages.length === 1
    && request.messages[0]?.role === 'user'
    && typeof request.messages[0]?.content === 'string'
    && MODEL_OPTIONS.some(({ id }) => id === settings?.model)
    && EFFORTS.some((effort) => effort === settings?.effort);
}

function writeEvent(response: Response, event: GenerationEvent): void {
  if (!response.destroyed) response.write(JSON.stringify(event) + '\n');
}

function invalidRequest(response: Response, status: number): void {
  response.status(status).type('application/x-ndjson');
  writeEvent(response, {
    type: 'error',
    error: {
      kind: 'bad-request',
      title: '요청을 처리할 수 없습니다',
      message: status === 413 ? '모델 요청이 1MB를 넘습니다.' : '모델 요청 형식이나 생성 설정을 확인하세요.',
      status,
      retryable: false,
    },
  });
  response.end();
}

app.get('/api/status', (_request, response) => {
  response.set('Cache-Control', 'no-store').json({ keyReady: client !== null });
});

app.post('/api/generate', express.json({ limit: '1mb' }), async (request, response) => {
  if (!isGenerateInput(request.body)) {
    invalidRequest(response, 400);
    return;
  }

  response.type('application/x-ndjson').set('Cache-Control', 'no-store');
  if (!client) {
    response.status(503);
    writeEvent(response, {
      type: 'error',
      error: {
        kind: 'missing-key',
        title: 'API 키가 없습니다',
        message: '저장소 루트 .env에 ANTHROPIC_API_KEY를 넣고 API 서버를 다시 시작하세요.',
        retryable: false,
      },
    });
    response.end();
    return;
  }

  const abort = new AbortController();
  const onClose = () => abort.abort();
  response.once('close', onClose);
  const { request: modelRequest, settings } = request.body;
  // 허용한 메시지 필드만 SDK에 넘긴다.
  const { system, messages: [{ content }] } = modelRequest;

  try {
    response.flushHeaders();
    const result = await generate(client, {
      request: { system, messages: [{ role: 'user', content }] },
      settings,
      signal: abort.signal,
      onText: (delta) => writeEvent(response, { type: 'text', delta }),
    });
    writeEvent(response, { type: 'result', result });
  } catch (error) {
    if (!abort.signal.aborted) writeEvent(response, { type: 'error', error: toGenerationError(error) });
  } finally {
    response.off('close', onClose);
    if (!response.destroyed) response.end();
  }
});

const handleInvalidJson: ErrorRequestHandler = (error, _request, response, next) => {
  if (error?.status === 400 || error?.status === 413) {
    invalidRequest(response, error.status);
    return;
  }
  next(error);
};
app.use(handleInvalidJson);

app.listen(3001, '127.0.0.1', () => {
  console.log('OKF API http://127.0.0.1:3001');
});
