import { createContext, useContext } from 'react';
import type { LoadedBundle } from '@/lib/bundles/loadBundles.ts';

// URL 쿼리 이름: /chat?bundle=knowledge
export const BUNDLE_PARAM = 'bundle';

export type BundleContextValue = {
  bundles: readonly LoadedBundle[];
  current: LoadedBundle;
  select: (id: string) => void;
  titleOf: (path: string) => string | undefined;
};

export const BundleContext = createContext<BundleContextValue | null>(null);

export function useBundles(): BundleContextValue {
  const value = useContext(BundleContext);
  if (!value) throw new Error('useBundles는 BundleProvider 안에서만 쓸 수 있습니다.');
  return value;
}
