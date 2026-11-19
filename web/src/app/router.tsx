// 라우트: / → /chat, /chat(상담), /debug(디버깅), /graph(준비 중). 쿼리(?bundle=)는 이동할 때 유지한다.
// 상담 화면은 첫 화면이라 바로 싣고, 디버깅·그래프 화면은 처음 열 때 불러온다 (코드 분할).
import { createBrowserRouter, Navigate, useLocation } from 'react-router';
import { ROUTES } from '@/config/routes.ts';
import { ChatPage } from '@/features/chat/ChatPage.tsx';
import { FullPageSpinner } from '@/shared/ui/FullPageSpinner.tsx';
import { CLAUDE_STATUS_ROUTE, loadClaudeStatus } from '@/lib/claude/status.ts';
import { AppLayout } from './AppLayout.tsx';

function RedirectToChat() {
  const { search } = useLocation();
  return <Navigate replace to={{ pathname: ROUTES.chat, search }} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    id: CLAUDE_STATUS_ROUTE,
    loader: loadClaudeStatus,
    element: <AppLayout />,
    hydrateFallbackElement: <FullPageSpinner label="화면을 불러오는 중" />,
    children: [
      { index: true, element: <RedirectToChat /> },
      { path: ROUTES.chat, element: <ChatPage /> },
      {
        path: ROUTES.debug,
        lazy: async () => ({ Component: (await import('@/features/debug/DebugPage.tsx')).DebugPage }),
      },
      {
        path: ROUTES.graph,
        lazy: async () => ({ Component: (await import('@/features/graph/GraphPage.tsx')).GraphPage }),
      },
      { path: '*', element: <RedirectToChat /> },
    ],
  },
]);
