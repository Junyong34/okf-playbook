// 번들 목록을 읽고, URL 쿼리 ?bundle=<id>로 현재 번들을 정한다. 쿼리가 없거나 모르는 id면 첫 번들.
// 번들이 하나도 없으면 화면 대신 안내를 보여 준다.
import { use, useCallback, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { loadBundles, type LoadedBundle } from '@/lib/bundles/loadBundles.ts';
import { BUNDLE_PARAM, BundleContext, type BundleContextValue } from './BundleContext.ts';
import { NoBundles } from './NoBundles.tsx';

type BundleProviderProps = { children: ReactNode };

export function BundleProvider({ children }: BundleProviderProps) {
  const bundles = use(loadBundles());
  if (bundles.length === 0) return <NoBundles />;
  return <BundleSelection bundles={bundles}>{children}</BundleSelection>;
}

type BundleSelectionProps = { bundles: readonly LoadedBundle[]; children: ReactNode };

function BundleSelection({ bundles, children }: BundleSelectionProps) {
  const [params, setParams] = useSearchParams();
  const requested = params.get(BUNDLE_PARAM);
  const current = bundles.find((b) => b.id === requested) ?? bundles[0];

  const select = useCallback(
    (id: string) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(BUNDLE_PARAM, id);
        return next;
      }),
    [setParams],
  );

  const titles = useMemo(() => new Map(current.concepts.map((c) => [c.path, c.title])), [current]);
  const value = useMemo<BundleContextValue>(
    () => ({ bundles, current, select, titleOf: (path) => titles.get(path) }),
    [bundles, current, select, titles],
  );

  return <BundleContext value={value}>{children}</BundleContext>;
}
