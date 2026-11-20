// 번들 하나의 상담 대화. 저장소에서 복원한 기록 + 실행 store(runs.ts)의 실행을 한 목록(ChatTurn[])으로 보여 준다.
// - 앱이 떠 있는 동안 번들마다 하나만 만든다(registry). 화면을 떠나도 생성과 저장은 계속된다.
// - 저장은 실행이 생기거나 phase가 바뀔 때만 한다. 스트리밍 조각마다 쓰지 않는다.
// - clear(새 상담)는 이 번들의 복원 기록과 실행을 모두 지운다.
// node 테스트가 별칭을 못 읽으므로 이 파일은 상대 경로로만 import한다.
import type { QaRuns } from '../qa/runs.ts';
import { loadHistory, saveHistory, toChatTurn, type ChatTurn, type HistoryStorage } from './history.ts';

export type ChatSession = Pick<QaRuns, 'start' | 'stop'> & {
  getTurns: () => readonly ChatTurn[]; // 바뀔 때마다 새 배열 (useSyncExternalStore용)
  subscribe: (listener: () => void) => () => void;
  clear: () => void;
};

export type ChatSessionDeps = {
  runs: QaRuns;
  storage: HistoryStorage;
  bundleId: string;
};

export function isTurnRunning(turn: ChatTurn | null | undefined): boolean {
  return turn?.phase === 'streaming';
}

export function createChatSession({ runs, storage, bundleId }: ChatSessionDeps): ChatSession {
  let restored: readonly ChatTurn[] = loadHistory(storage, bundleId);
  const compute = (): readonly ChatTurn[] => [...restored, ...runs.getRuns().map(toChatTurn)];
  let turns = compute();
  let savedShape = shapeOf(runs);
  const listeners = new Set<() => void>();

  const emit = () => {
    turns = compute();
    for (const listener of listeners) listener();
  };
  const save = () => saveHistory(storage, bundleId, turns);

  runs.subscribe(() => {
    emit();
    const shape = shapeOf(runs);
    if (shape !== savedShape) {
      savedShape = shape;
      save();
    }
  });

  const clear = () => {
    restored = [];
    runs.reset(); // 실행이 있었다면 여기서 emit·save가 한 번 돈다
    emit();
    save();
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getTurns: () => turns, subscribe, start: runs.start, stop: runs.stop, clear };
}

// 실행 id와 phase만 본다. 이것이 바뀔 때만 저장한다.
function shapeOf(runs: QaRuns): string {
  return runs.getRuns().map((run) => `${run.id}:${run.phase}`).join(',');
}
