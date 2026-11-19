// 번들 읽기의 유일한 입구. 화면은 이 함수만 쓴다.
// bundles/ 아래 디렉터리를 자동으로 찾는다 (config/bundles.ts). 지금은 빌드할 때 묶은 파일(import.meta.glob)을 읽고,
// 배포할 때는 내부만 서버 fetch로 바꾼다. 그래서 지금도 Promise를 돌려준다.
import type { Bundle } from '@okf/types.ts';
import type { VoiceGuide } from '@okf/request.ts';
import { readConcepts } from '@okf/concept.ts';
import { BUNDLE_ASSET_KEYS, BUNDLE_DOCUMENTS, BUNDLE_SETTINGS, BUNDLES_DIR, DEFAULT_VOICE } from '@/config/bundles.ts';
import { readBundleMeta } from './bundleMeta.ts';
import { groupByBundle, orderBundleIds } from './groupByBundle.ts';
import { toBundle } from './toBundle.ts';

export type ConceptSummary = { path: string; title: string; type: string };

export type LoadedBundle = {
  id: string;           // URL ?bundle= 값 (bundles/ 아래 디렉터리 이름)
  label: string;        // index.md title, 없으면 id
  description: string;  // index.md description
  root: string;         // 저장소 루트 기준 번들 루트 (bundles/<이름>)
  okfVersion: string;
  bundle: Bundle;
  voice: VoiceGuide | null;
  sampleQuestions: string[];
  concepts: ConceptSummary[];
};

function discover(): LoadedBundle[] {
  const loaded: LoadedBundle[] = [];
  for (const files of groupByBundle(BUNDLES_DIR, BUNDLE_DOCUMENTS, BUNDLE_ASSET_KEYS)) {
    const bundle = toBundle(files.root, files.documents, files.assetKeys);
    const meta = readBundleMeta(bundle);
    if (meta === null) {
      console.warn(`[bundles] ${files.root}/index.md에 okf_version이 없어 번들로 읽지 않았습니다.`);
      continue;
    }
    const settings = BUNDLE_SETTINGS[files.id] ?? {};
    loaded.push({
      id: files.id,
      label: meta.title || files.id,
      description: meta.description,
      root: files.root,
      okfVersion: meta.okfVersion,
      bundle,
      voice: settings.voice === undefined ? DEFAULT_VOICE : settings.voice,
      sampleQuestions: settings.sampleQuestions ?? [],
      concepts: readConcepts(bundle).map((c) => ({ path: c.path, title: c.title || c.path, type: c.type })),
    });
  }
  const order = orderBundleIds(
    loaded.map((b) => b.id),
    Object.keys(BUNDLE_SETTINGS),
  );
  return order.map((id) => loaded.find((b) => b.id === id)!);
}

let cache: Promise<LoadedBundle[]> | null = null;

export function loadBundles(): Promise<LoadedBundle[]> {
  cache ??= Promise.resolve(discover());
  return cache;
}
