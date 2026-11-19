// Express app. 생성기는 밖에서 받는다: 실행할 때는 SDK adapter(index.ts), 테스트할 때는 가짜. 키가 없으면 null.
import express, { type ErrorRequestHandler, type Express, type Response } from 'express';
import { badRequestError, encodeEvent, isGenerateInput, MISSING_KEY_ERROR, NDJSON } from '../shared/claude/protocol.ts';
import type { Generate, GenerationEvent } from '../shared/claude/types.ts';
import { toGenerationError } from './errors.ts';

export type AppOptions = { generate: Generate | null };

function writeEvent(response: Response, event: GenerationEvent): void {
  if (!response.destroyed) response.write(encodeEvent(event));
}

function failWith(response: Response, status: number, event: GenerationEvent): void {
  response.status(status).type(NDJSON).set('Cache-Control', 'no-store');
  writeEvent(response, event);
  response.end();
}

export function createApp({ generate }: AppOptions): Express {
  const app = express();

  app.get('/api/status', (_request, response) => {
    response.set('Cache-Control', 'no-store').json({ keyReady: generate !== null });
  });

  app.post('/api/generate', express.json({ limit: '1mb' }), async (request, response) => {
    if (!isGenerateInput(request.body)) {
      failWith(response, 400, { type: 'error', error: badRequestError(400) });
      return;
    }
    if (!generate) {
      failWith(response, 503, { type: 'error', error: MISSING_KEY_ERROR });
      return;
    }

    response.type(NDJSON).set('Cache-Control', 'no-store');
    const abort = new AbortController();
    const onClose = () => abort.abort();
    response.once('close', onClose);
    const { request: modelRequest, settings } = request.body;
    // 허용한 메시지 필드만 생성기에 넘긴다.
    const { system, messages: [{ content }] } = modelRequest;

    try {
      response.flushHeaders();
      const result = await generate({
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
      failWith(response, error.status, { type: 'error', error: badRequestError(error.status) });
      return;
    }
    next(error);
  };
  app.use(handleInvalidJson);

  return app;
}
