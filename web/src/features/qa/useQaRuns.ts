// 질문 실행 훅: 조립(prepareRun) → 생성(generate, 스트리밍) → 인용 검사(checkAnswer).
// 한 번에 하나만 생성한다. 새 실행을 시작하면 진행 중인 생성은 중단한다.
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { checkAnswer } from '@okf/answer.ts';
import { generate } from '@/lib/claude/generate.ts';
import { isAbortError, toGenerationError } from '@/lib/claude/errors.ts';
import type { LoadedBundle } from '@/lib/bundles/loadBundles.ts';
import { prepareRun } from './prepareRun.ts';
import { runReducer } from './runReducer.ts';
import { isActive, type QaInput, type QaRun } from './types.ts';

export type StartOptions = {
  dryRun?: boolean; // 조립만 보기: 모델을 부르지 않는다
};

export type QaRunsApi = {
  runs: QaRun[];
  latest: QaRun | null;
  isRunning: boolean;
  start: (loaded: LoadedBundle, input: QaInput, options?: StartOptions) => void;
  stop: () => void;
  reset: () => void;
};

let sequence = 0;
const nextId = () => `run-${Date.now().toString(36)}-${(sequence++).toString(36)}`;

export function useQaRuns(): QaRunsApi {
  const [runs, dispatch] = useReducer(runReducer, []);
  const controller = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
  }, []);

  // 화면을 떠나면 진행 중인 생성을 멈춘다.
  useEffect(() => stop, [stop]);

  const start = useCallback(
    (loaded: LoadedBundle, input: QaInput, options: StartOptions = {}) => {
      stop();
      const startedAt = Date.now();
      const prepared = prepareRun(loaded, input, new Date(startedAt));
      const request = prepared.assembled.request;
      const id = nextId();
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

      if (request === null) {
        dispatch({ type: 'start', run: { ...base, phase: 'skipped', finishedAt: startedAt } });
        return;
      }
      if (options.dryRun) {
        dispatch({ type: 'start', run: { ...base, phase: 'assembled', finishedAt: startedAt } });
        return;
      }

      const abort = new AbortController();
      controller.current = abort;
      dispatch({ type: 'start', run: base });

      generate({
        request,
        settings: input.generation,
        signal: abort.signal,
        onText: (delta) => dispatch({ type: 'text', id, delta }),
      })
        .then((result) => {
          const check = result.refusal ? null : checkAnswer(result.text, prepared.assembled.record.providedPaths);
          dispatch({ type: 'done', id, result, check, at: Date.now() });
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) dispatch({ type: 'stopped', id, at: Date.now() });
          else dispatch({ type: 'error', id, error: toGenerationError(error), at: Date.now() });
        })
        .finally(() => {
          if (controller.current === abort) controller.current = null;
        });
    },
    [stop],
  );

  const reset = useCallback(() => {
    stop();
    dispatch({ type: 'reset' });
  }, [stop]);

  const latest = runs.at(-1) ?? null;
  return { runs, latest, isRunning: isActive(latest), start, stop, reset };
}
