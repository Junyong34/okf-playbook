// 실행 목록 store(runs.ts)를 화면에 잇는 adapter. 화면마다 store를 하나씩 만들고, 화면을 떠나면 생성을 멈춘다.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { generate } from '@/lib/claude/generate.ts';
import { createQaRuns, isRunning, type QaRun, type QaRuns } from './runs.ts';

export type QaRunsApi = Pick<QaRuns, 'start' | 'stop' | 'reset'> & {
  runs: readonly QaRun[];
  latest: QaRun | null;
  isRunning: boolean;
};

export function useQaRuns(): QaRunsApi {
  const [store] = useState(() => createQaRuns({ generate }));
  const runs = useSyncExternalStore(store.subscribe, store.getRuns);
  useEffect(() => store.stop, [store]);

  const latest = runs.at(-1) ?? null;
  return { runs, latest, isRunning: isRunning(latest), start: store.start, stop: store.stop, reset: store.reset };
}
