// 좌측 메뉴 (Astryx shell-side-nav 템플릿 구조): 제목 → 번들 선택 → 화면 메뉴 → 상태
import { useLocation } from 'react-router';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';
import { NavIcon } from '@astryxdesign/core/NavIcon';
import { SideNav, SideNavHeading, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { KeyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { NAV_ITEMS, ROUTES } from '@/config/routes.ts';
import { BundleSwitcher } from '@/features/bundles/BundleSwitcher.tsx';
import { BUNDLE_PARAM, useBundles } from '@/features/bundles/BundleContext.ts';
import { hasApiKey } from '@/lib/claude/apiKey.ts';

export function AppSideNav() {
  const { pathname } = useLocation();
  const { current } = useBundles();
  const query = `?${BUNDLE_PARAM}=${encodeURIComponent(current.id)}`;
  const keyReady = hasApiKey();

  return (
    <SideNav
      collapsible
      resizable={{ defaultWidth: 264, minWidth: 220, maxWidth: 360, autoSaveId: 'okf-side-nav' }}
      header={
        <SideNavHeading
          heading="OKF 질의응답"
          subheading="번들 근거 상담 데모"
          icon={<NavIcon icon={<Icon icon={SparklesIcon} size="sm" />} />}
          headingHref={`${ROUTES.chat}${query}`}
        />
      }
      topContent={<BundleSwitcher />}
      footer={
        <SideNavSection title="상태" isHeaderHidden>
          <SideNavItem
            label={keyReady ? 'API 키 설정됨' : 'API 키 없음'}
            icon={KeyIcon}
            endContent={<StatusDot variant={keyReady ? 'success' : 'warning'} label={keyReady ? '연결 가능' : '키 필요'} />}
          />
        </SideNavSection>
      }>
      <SideNavSection title="화면" isHeaderHidden>
        {NAV_ITEMS.map((item) => (
          <SideNavItem
            key={item.path}
            label={item.label}
            icon={item.icon}
            selectedIcon={item.selectedIcon}
            href={item.isReady ? `${item.path}${query}` : undefined}
            isSelected={pathname === item.path}
            isDisabled={!item.isReady}
            endContent={item.isReady ? undefined : <Badge variant="neutral" label="준비 중" />}
          />
        ))}
      </SideNavSection>
    </SideNav>
  );
}
