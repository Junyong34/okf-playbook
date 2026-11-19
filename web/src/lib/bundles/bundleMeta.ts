// 번들 루트 index.md의 번들 메타데이터(§8.1)를 읽는다. okf_version이 없으면 번들로 치지 않는다.
import type { Bundle } from '@okf/types.ts';
import { bundleVersion, frontmatterData, isBlank, readBundleFile } from '@okf/concept.ts';

export type BundleMeta = { okfVersion: string; title: string; description: string };

export function readBundleMeta(bundle: Bundle): BundleMeta | null {
  const okfVersion = bundleVersion(bundle);
  if (okfVersion === null) return null;
  const index = readBundleFile(bundle, 'index.md');
  const fm = (index && frontmatterData(index)) ?? {};
  const text = (v: unknown) => (isBlank(v) ? '' : String(v));
  return { okfVersion, title: text(fm.title), description: text(fm.description) };
}
