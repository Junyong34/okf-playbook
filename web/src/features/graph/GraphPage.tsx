// 그래프 화면 (/graph): 스펙의 마지막 단계에서 따로 정한다. 메뉴에는 "준비 중"으로 비활성화되어 있다.
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, VStack } from '@astryxdesign/core/Layout';
import { ShareIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';

export function GraphPage() {
  return (
    <Layout
      height="fill"
      header={<PageHeader title="그래프" description="개념·링크·출처 그래프" />}
      content={
        <LayoutContent>
          <VStack height="100%" hAlign="center" vAlign="center">
            <EmptyState
              icon={<Icon icon={ShareIcon} size="lg" color="secondary" />}
              title="준비 중입니다"
              description="번들의 개념을 링크와 출처로 이은 그래프를 sigma.js로 보여 줄 예정입니다."
            />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
