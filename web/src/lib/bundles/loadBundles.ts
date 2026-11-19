// 번들 읽기의 유일한 입구. 화면은 이 함수만 쓴다.
// 지금은 빌드할 때 묶은 파일(import.meta.glob)을 읽고, 배포할 때는 내부만 서버 fetch로 바꾼다.
// 그래서 지금도 Promise를 돌려준다.
import type { Bundle } from '@okf/types.ts';
import type { VoiceGuide } from '@okf/request.ts';
import { readConcepts } from '@okf/concept.ts';
import { BUNDLE_SOURCES } from '@/config/bundles.ts';
import { toBundle } from './toBundle.ts';

export type ConceptSummary = { path: string; title: string; type: string };

export type LoadedBundle = {
  id: string;
  label: string;
  description: string;
  root: string;
  bundle: Bundle;
  voice: VoiceGuide | null;
  sampleQuestions: string[];
  concepts: ConceptSummary[];
};

let cache: Promise<LoadedBundle[]> | null = null;

export function loadBundles(): Promise<LoadedBundle[]> {
  cache ??= Promise.resolve(
    BUNDLE_SOURCES.map((source): LoadedBundle => {
      const bundle = toBundle(source.root, source.documents, source.assetKeys);
      return {
        id: source.id,
        label: source.label,
        description: source.description,
        root: source.root,
        bundle,
        voice: source.voice,
        sampleQuestions: source.sampleQuestions,
        concepts: readConcepts(bundle).map((c) => ({ path: c.path, title: c.title || c.path, type: c.type })),
      };
    }),
  );
  return cache;
}
