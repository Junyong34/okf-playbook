// 실행 목록 store(runs.ts)를 화면에 잇는 adapter. store는 앱 루트(QaSessionsProvider)가 들고 있어서
// 화면을 떠나도 생성을 멈추지 않고, 돌아오면 같은 결과가 보인다.
import { useSyncExternalStore } from 'react';
import { isRunning, type QaRun, type QaRuns } from './runs.ts';

export type QaRunsApi = Pick<QaRuns, 'start' | 'stop' | 'reset'> & {
  runs: readonly QaRun[];
  latest: QaRun | null;
  isRunning: boolean;
};

export function useQaRuns(store: QaRuns): QaRunsApi {
  const runs = useSyncExternalStore(store.subscribe, store.getRuns);
  const latest = runs.at(-1) ?? null;
  return { runs, latest, isRunning: isRunning(latest), start: store.start, stop: store.stop, reset: store.reset };
}
