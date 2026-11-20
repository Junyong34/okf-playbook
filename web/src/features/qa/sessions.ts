// 앱 전체에서 하나씩 두는 store 모음: 상담은 번들별 대화(저장소에 기록), 디버깅은 번들별 실행 목록(메모리만).
import { createContext, useContext } from 'react';
import type { ChatSession } from '@/features/chat/session.ts';
import type { QaRuns } from './runs.ts';
import type { Registry } from './registry.ts';

export type QaSessions = {
  chat: Registry<ChatSession>;
  debug: Registry<QaRuns>;
};

export const QaSessionsContext = createContext<QaSessions | null>(null);

export function useQaSessions(): QaSessions {
  const value = useContext(QaSessionsContext);
  if (!value) throw new Error('useQaSessions는 QaSessionsProvider 안에서만 쓸 수 있습니다.');
  return value;
}
