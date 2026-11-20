// 앱 루트: 테마(neutral, 시스템 다크 모드) → 링크 어댑터 → 상담·디버깅 store 모음 → 라우터
import { RouterProvider } from 'react-router';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { QaSessionsProvider } from '@/features/qa/QaSessionsProvider.tsx';
import { RouterLink } from './RouterLink.tsx';
import { router } from './router.tsx';

export function App() {
  return (
    <Theme theme={neutralTheme} mode="system">
      <LinkProvider component={RouterLink}>
        <QaSessionsProvider>
          <RouterProvider router={router} />
        </QaSessionsProvider>
      </LinkProvider>
    </Theme>
  );
}
