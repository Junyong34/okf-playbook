// 실행 목록 상태. 상담 화면은 목록 전체를, 디버깅 화면은 마지막 실행을 보여 준다.
import type { AnswerCheck } from '@okf/answer.ts';
import type { GenerationError } from '@/lib/claude/errors.ts';
import type { GenerationResult } from '@/lib/claude/types.ts';
import type { QaRun } from './types.ts';

export type RunAction =
  | { type: 'start'; run: QaRun }
  | { type: 'text'; id: string; delta: string }
  | { type: 'done'; id: string; result: GenerationResult; check: AnswerCheck | null; at: number }
  | { type: 'stopped'; id: string; at: number }
  | { type: 'error'; id: string; error: GenerationError; at: number }
  | { type: 'reset' };

function update(runs: QaRun[], id: string, patch: (run: QaRun) => QaRun): QaRun[] {
  return runs.map((run) => (run.id === id ? patch(run) : run));
}

export function runReducer(runs: QaRun[], action: RunAction): QaRun[] {
  switch (action.type) {
    case 'start':
      return [...runs, action.run];
    case 'text':
      return update(runs, action.id, (run) => ({ ...run, text: run.text + action.delta }));
    case 'done':
      return update(runs, action.id, (run) => ({
        ...run,
        phase: 'done',
        text: action.result.text,
        result: action.result,
        check: action.check,
        finishedAt: action.at,
      }));
    case 'stopped':
      return update(runs, action.id, (run) => ({ ...run, phase: 'stopped', finishedAt: action.at }));
    case 'error':
      return update(runs, action.id, (run) => ({ ...run, phase: 'error', error: action.error, finishedAt: action.at }));
    case 'reset':
      return [];
  }
}
