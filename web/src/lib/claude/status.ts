import { useRouteLoaderData } from 'react-router';
import { MISSING_KEY_MESSAGE } from '@claude/protocol.ts';

type ClaudeStatus = 'ready' | 'missing-key' | 'offline';
export const CLAUDE_STATUS_ROUTE = 'app';

export async function loadClaudeStatus({ request }: { request: Request }): Promise<ClaudeStatus> {
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(2000)]);
    const response = await fetch('/api/status', { signal });
    if (!response.ok) return 'offline';
    const { keyReady } = await response.json();
    return keyReady === true ? 'ready' : keyReady === false ? 'missing-key' : 'offline';
  } catch {
    return 'offline';
  }
}

export function useClaudeStatus() {
  const status = useRouteLoaderData<typeof loadClaudeStatus>(CLAUDE_STATUS_ROUTE) ?? 'offline';
  return {
    keyReady: status === 'ready',
    message: status === 'missing-key'
      ? MISSING_KEY_MESSAGE
      : 'pnpm dev:api로 로컬 API 서버를 실행한 뒤 페이지를 새로고침하세요.',
    label: { ready: 'API 키 설정됨', 'missing-key': 'API 키 없음', offline: 'API 서버 연결 안 됨' }[status],
  };
}
