// 번들 목록을 읽고, URL 쿼리 ?bundle=<id>로 현재 번들을 정한다. 쿼리가 없거나 모르는 id면 첫 번들.
import { use, useCallback, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { loadBundles } from '@/lib/bundles/loadBundles.ts';
import { BUNDLE_PARAM, BundleContext, type BundleContextValue } from './BundleContext.ts';

export function BundleProvider({ children }: { children: ReactNode }) {
  const bundles = use(loadBundles());
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
