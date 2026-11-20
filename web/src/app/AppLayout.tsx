// 모든 화면의 틀: 좌측 메뉴(AppShell sideNav) + 본문(라우트).
// 번들은 URL 쿼리에서 정하므로 BundleProvider는 라우터 안에 둔다.
import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { AppShell } from '@astryxdesign/core/AppShell';
import { BundleProvider } from '@/features/bundles/BundleProvider.tsx';
import { FullPageSpinner } from '@/shared/ui/FullPageSpinner.tsx';
import { AppSideNav } from './AppSideNav.tsx';

export function AppLayout() {
  return (
    <Suspense fallback={<FullPageSpinner label="번들을 읽는 중" />}>
      <BundleProvider>
        <AppShell contentPadding={0} mobileNav={false} sideNav={<AppSideNav />}>
          <Outlet />
        </AppShell>
      </BundleProvider>
    </Suspense>
  );
}
