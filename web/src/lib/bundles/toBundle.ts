// glob 결과를 OKF Bundle(번들 루트 기준 경로 → 내용)로 바꾼다. src/okf/load.ts(loadBundle)와 같은 규칙:
//  - .md는 내용을 담고, 그 밖(asset)은 경로만 담는다 (§3.2-3)
//  - 이름이 '.'으로 시작하는 파일·디렉터리는 번들이 아니다 (§3.2-4)
import type { Bundle } from '@okf/types.ts';

// "../../../knowledge/policies/returns.md" → "policies/returns.md"
export function bundleKey(globKey: string, root: string): string | null {
  const marker = `/${root}/`;
  const at = globKey.indexOf(marker);
  if (at === -1) return null;
  const key = globKey.slice(at + marker.length);
  if (key === '' || key.split('/').some((part) => part.startsWith('.'))) return null;
  return key;
}

export function toBundle(root: string, documents: Record<string, string>, assetKeys: readonly string[]): Bundle {
  const entries: [string, string][] = [];
  for (const [globKey, text] of Object.entries(documents)) {
    const key = bundleKey(globKey, root);
    if (key !== null) entries.push([key, text]);
  }
  for (const globKey of assetKeys) {
    const key = bundleKey(globKey, root);
    if (key !== null) entries.push([key, '']);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  return new Map(entries);
}
