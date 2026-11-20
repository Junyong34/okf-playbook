// 번들 하나의 상담 대화(session.ts)를 화면에 잇는 adapter.
import { useSyncExternalStore } from 'react';
import { useQaSessions } from '@/features/qa/sessions.ts';
import type { ChatTurn } from './history.ts';
import { isTurnRunning, type ChatSession } from './session.ts';

export type ChatSessionApi = Pick<ChatSession, 'start' | 'stop' | 'clear'> & {
  turns: readonly ChatTurn[];
  isRunning: boolean;
};

export function useChatSession(bundleId: string): ChatSessionApi {
  const session = useQaSessions().chat.get(bundleId);
  const turns = useSyncExternalStore(session.subscribe, session.getTurns);
  return { turns, isRunning: isTurnRunning(turns.at(-1)), start: session.start, stop: session.stop, clear: session.clear };
}
