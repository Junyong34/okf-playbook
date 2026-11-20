// 사이드바 맨 위의 번들 선택기.
import { Selector } from '@astryxdesign/core/Selector';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { useBundles } from './BundleContext.ts';

export function BundleSwitcher() {
  const { bundles, current, select } = useBundles();
  return (
    <Selector
      label="번들"
      isLabelHidden
      size="sm"
      width="100%"
      variant="secondary"
      startIcon={RectangleStackIcon}
      value={current.id}
      onChange={(id) => id && select(id)}
      options={bundles.map((b) => ({ value: b.id, label: b.label, description: `${b.root}/ · ${b.concepts.length}개 개념` }))}
    />
  );
}
