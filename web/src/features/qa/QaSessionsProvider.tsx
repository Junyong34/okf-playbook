// 앱 루트에 store 모음을 한 번 만든다. 화면을 떠나도 store가 남아 생성이 계속되고 결과가 보존된다.
import { useState, type ReactNode } from 'react';
import { createChatSession } from '@/features/chat/session.ts';
import type { HistoryStorage } from '@/features/chat/history.ts';
import { generate } from '@/lib/claude/generate.ts';
import { createRegistry } from './registry.ts';
import { createQaRuns } from './runs.ts';
import { QaSessionsContext, type QaSessions } from './sessions.ts';

// 저장소를 쓸 수 없는 환경(차단된 쿠키 등)에서는 기록만 남지 않게 한다.
const memoryStorage = (): HistoryStorage => {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
};

function browserStorage(): HistoryStorage {
  try {
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
}

function createQaSessions(): QaSessions {
  const storage = browserStorage();
  return {
    chat: createRegistry((bundleId) => createChatSession({ runs: createQaRuns({ generate }), storage, bundleId })),
    debug: createRegistry(() => createQaRuns({ generate })),
  };
}

export function QaSessionsProvider({ children }: { children: ReactNode }) {
  const [sessions] = useState(createQaSessions);
  return <QaSessionsContext value={sessions}>{children}</QaSessionsContext>;
}
