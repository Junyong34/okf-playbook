// glob 결과를 번들 디렉터리별로 나눈다: "../../../bundles/<이름>/..." → <이름>.
// 점으로 시작하는 디렉터리(.git 등)는 번들이 아니다 (§3.2-4). DOM·OKF를 모르는 순수 함수라 node:test로 검사한다.

export type BundleFiles = {
  id: string;                         // bundles/ 아래 디렉터리 이름
  root: string;                       // 저장소 루트 기준 번들 루트 (bundles/<이름>)
  documents: Record<string, string>;  // glob 키 → .md 내용
  assetKeys: string[];                // glob 키 (.md가 아닌 파일)
};

// glob 키에서 번들 이름을 뽑는다. bundles/ 바로 아래 파일(번들 디렉터리 밖)은 null.
export function bundleIdOf(globKey: string, bundlesDir: string): string | null {
  const marker = `/${bundlesDir}/`;
  const at = globKey.indexOf(marker);
  if (at === -1) return null;
  const rest = globKey.slice(at + marker.length).split('/');
  if (rest.length < 2 || rest[0] === '' || rest[0].startsWith('.')) return null;
  return rest[0];
}

export function groupByBundle(
  bundlesDir: string,
  documents: Record<string, string>,
  assetKeys: readonly string[],
): BundleFiles[] {
  const groups = new Map<string, BundleFiles>();
  const groupOf = (id: string) => {
    let group = groups.get(id);
    if (!group) {
      group = { id, root: `${bundlesDir}/${id}`, documents: {}, assetKeys: [] };
      groups.set(id, group);
    }
    return group;
  };
  for (const [key, text] of Object.entries(documents)) {
    const id = bundleIdOf(key, bundlesDir);
    if (id !== null) groupOf(id).documents[key] = text;
  }
  for (const key of assetKeys) {
    const id = bundleIdOf(key, bundlesDir);
    if (id !== null) groupOf(id).assetKeys.push(key);
  }
  return [...groups.values()];
}

// 설정에 적은 순서가 먼저, 나머지는 이름순
export function orderBundleIds(ids: readonly string[], preferred: readonly string[]): string[] {
  const rank = (id: string) => {
    const i = preferred.indexOf(id);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };
  return [...ids].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
