// bundles/ 아래에 번들이 하나도 없을 때의 안내.
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/Layout';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { BUNDLES_DIR } from '@/config/bundles.ts';

export function NoBundles() {
  return (
    <VStack height="100%" hAlign="center" vAlign="center">
      <EmptyState
        icon={<Icon icon={RectangleStackIcon} size="lg" color="secondary" />}
        title="번들이 없습니다"
        description={`${BUNDLES_DIR}/<이름>/ 디렉터리를 만들고 index.md에 okf_version을 넣으면 여기에 나옵니다.`}
      />
    </VStack>
  );
}
