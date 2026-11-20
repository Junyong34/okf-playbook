// 실행 목록 store. 질문 하나를 조립 → 생성(스트리밍) → 인용 검사까지 처리하고, 상태를 React 없이 들고 있다.
// - 한 번에 하나만 생성한다. 새 실행을 시작하면 진행 중인 생성은 멈춘다(stopped).
// - 고른 개념이 0개면 모델을 부르지 않는다(skipped). dryRun이면 조립만 한다(assembled).
// - 거절된 답변은 인용 검사를 하지 않는다.
// - 생성기는 밖에서 받는다(Generate seam): 화면은 /api/generate adapter, 테스트는 가짜.
// node 테스트가 별칭을 못 읽으므로 이 파일은 상대 경로로만 import한다.
import { ask, type Asked } from '../../../../src/okf/ask.ts';
import { checkAnswer, type AnswerCheck } from '../../../../src/okf/answer.ts';
import { buildModelRequest, type Assembled, type VoiceGuide } from '../../../../src/okf/request.ts';
import type { Options as RetrievalOptions } from '../../../../src/okf/retrieve.ts';
import type { Bundle } from '../../../../src/okf/types.ts';
import { toApiRequest } from '../../../../shared/claude/apiRequest.ts';
import type { GenerationSettings } from '../../../../shared/claude/models.ts';
import { toClientError } from '../../../../shared/claude/protocol.ts';
import type { ApiRequestPreview, Generate, GenerationError, GenerationResult } from '../../../../shared/claude/types.ts';

export type { RetrievalOptions };

// 실행에 필요한 번들 정보. LoadedBundle이 이 모양을 만족한다.
export type RunBundle = { bundle: Bundle; voice: VoiceGuide | null };

export type QaInput = {
  bundleId: string;
  question: string;
  retrieval: RetrievalOptions;
  voiceEnabled: boolean;
  generation: GenerationSettings;
};

// 모델을 부르기 전까지 만든 것: 검색 결과 + 모델 요청 + 요청 조립 기록 + API 파라미터 미리보기
export type PreparedRun = {
  asked: Asked;
  assembled: Assembled;
  apiRequest: ApiRequestPreview | null; // 고른 개념이 없으면 null
};

// assembled | skipped | streaming → done | stopped | error
export type RunPhase = 'streaming' | 'done' | 'stopped' | 'error' | 'assembled' | 'skipped';

export type QaRun = {
  id: string;
  input: QaInput;
  startedAt: number;
  finishedAt: number | null;
  prepared: PreparedRun;
  phase: RunPhase;
  text: string;                     // 지금까지 받은 답변 (스트리밍 중에는 부분)
  result: GenerationResult | null;
  check: AnswerCheck | null;        // 답변이 끝난 뒤 인용 검사
  error: GenerationError | null;
};

export type StartOptions = {
  dryRun?: boolean; // 조립만 보기: 모델을 부르지 않는다
};

export type QaRunsDeps = {
  generate: Generate;
  clock?: () => number;
  newId?: () => string;
};

export type QaRuns = {
  getRuns: () => readonly QaRun[];  // 바뀔 때마다 새 배열 (useSyncExternalStore용)
  subscribe: (listener: () => void) => () => void;
  // 실행이 끝나면(done·stopped·error, 또는 바로 끝나는 skipped·assembled) resolve한다. reject하지 않는다.
  start: (source: RunBundle, input: QaInput, options?: StartOptions) => Promise<void>;
  stop: () => void;
  reset: () => void;
};

export function isRunning(run: QaRun | null | undefined): boolean {
  return run?.phase === 'streaming';
}

let sequence = 0;
const defaultId = () => `run-${Date.now().toString(36)}-${(sequence++).toString(36)}`;

function prepare(source: RunBundle, input: QaInput, now: Date): PreparedRun {
  const asked = ask(source.bundle, input.question, input.retrieval, now);
  const voice = input.voiceEnabled ? source.voice : null;
  const assembled = buildModelRequest(source.bundle, input.question, asked.picks, { voice, now });
  return {
    asked,
    assembled,
    apiRequest: assembled.request ? toApiRequest(assembled.request, input.generation) : null,
  };
}

export function createQaRuns({ generate, clock = Date.now, newId = defaultId }: QaRunsDeps): QaRuns {
  let runs: readonly QaRun[] = [];
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();

  const set = (next: readonly QaRun[]) => {
    runs = next;
    for (const listener of listeners) listener();
  };
  // 이미 지운(reset) 실행에 늦게 온 이벤트는 무시된다.
  const update = (id: string, patch: (run: QaRun) => QaRun) => {
    if (runs.some((run) => run.id === id)) set(runs.map((run) => (run.id === id ? patch(run) : run)));
  };

  const stop = () => {
    controller?.abort();
    controller = null;
  };

  const start = (source: RunBundle, input: QaInput, options: StartOptions = {}): Promise<void> => {
    stop();
    const startedAt = clock();
    const prepared = prepare(source, input, new Date(startedAt));
    const request = prepared.assembled.request;
    const id = newId();
    const base: QaRun = {
      id,
      input,
      startedAt,
      finishedAt: null,
      prepared,
      phase: 'streaming',
      text: '',
      result: null,
      check: null,
      error: null,
    };

    if (request === null || options.dryRun) {
      set([...runs, { ...base, phase: request === null ? 'skipped' : 'assembled', finishedAt: startedAt }]);
      return Promise.resolve();
    }

    const abort = new AbortController();
    controller = abort;
    set([...runs, base]);

    return new Promise<GenerationResult>((resolve) => resolve(generate({
      request,
      settings: input.generation,
      signal: abort.signal,
      onText: (delta) => update(id, (run) => ({ ...run, text: run.text + delta })),
    })))
      .then((result) => {
        const check = result.refusal ? null : checkAnswer(result.text, prepared.assembled.record.providedPaths);
        update(id, (run) => ({ ...run, phase: 'done', text: result.text, result, check, finishedAt: clock() }));
      })
      .catch((error: unknown) => {
        const at = clock();
        if (abort.signal.aborted) update(id, (run) => ({ ...run, phase: 'stopped', finishedAt: at }));
        else update(id, (run) => ({ ...run, phase: 'error', error: toClientError(error), finishedAt: at }));
      })
      .finally(() => {
        if (controller === abort) controller = null;
      });
  };

  const reset = () => {
    stop();
    set([]);
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getRuns: () => runs, subscribe, start, stop, reset };
}
