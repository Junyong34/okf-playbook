// 4회차 실습: score·retrieve 구현 완료 (tests/retrieve.test.ts).
// 순서: R2단계 score → R3단계 retrieve 키워드 → R4단계 retrieve 링크 (0003 resolveLink 필요)
// 레슨: learn/lessons/0004-retrieve.html
import type { Bundle } from './types.ts';
import { readConcepts, resolveLink, type Concept } from './concept.ts';

// ── 개념 읽기 (제공) ──────────────────────────────────────────────────
// 개념 읽기 모듈(concept.ts)로 옮겼다. 레슨·테스트가 이 경로로 import하므로 다시 내보낸다.
export { readConcepts, type Concept } from './concept.ts';

// ── 한국어 키워드: 두 글자 묶음(bigram) (제공) ────────────────────────
// "할인 상품을" → ["할인", "상품", "품을"]. 조사가 붙어도 "상품"이 남는다.
export function bigrams(text: string): Set<string> {
  const out = new Set<string>();
  for (const word of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    const chars = [...word];
    for (let i = 0; i + 1 < chars.length; i++) out.add(chars[i] + chars[i + 1]);
  }
  return out;
}

// ── 검색 ────────────────────────────────────────────────────────────
export type Options = {
  fields: 'body' | 'body+meta'; // body: 본문만, body+meta: 본문 + type·title·description·tags
  followLinks: boolean;         // 처음 고른 개념의 링크를 한 단계 따라갈지
  maxDocs: number;              // 모델에 넘길 개념 수 상한 (링크로 추가한 것 포함)
  minScore: number;             // 이 점수 미만이면 고르지 않는다
};

export const DEFAULT_OPTIONS: Options = { fields: 'body+meta', followLinks: true, maxDocs: 3, minScore: 2 };

export type Pick = {
  path: string;
  via: 'keyword' | 'link';
  score: number;      // keyword: 겹친 키워드 수, link: 0
  matched: string[];  // keyword: 겹친 키워드, link: []
  from?: string;      // link: 링크를 따라온 출발 개념
};

export type Result = { picks: Pick[]; warnings: string[] };

export function searchText(c: Concept, fields: Options['fields']): string {
  if (fields === 'body') return c.body;
  return [c.type, c.title, c.description, c.tags.join(' '), c.body].join('\n');
}

export function score(question: string, c: Concept, fields: Options['fields']): { score: number; matched: string[] } {
  const doc = bigrams(searchText(c, fields));
  const matched = [...bigrams(question)].filter((b) => doc.has(b)).sort();
  return { score: matched.length, matched };
}

export function retrieve(bundle: Bundle, question: string, options: Partial<Options> = {}): Result {
  const opt = { ...DEFAULT_OPTIONS, ...options };
  const concepts = readConcepts(bundle);
  const byPath = new Map(concepts.map((c) => [c.path, c]));
  const picks: Pick[] = [];
  const warnings: string[] = [];

  // 1) 키워드로 고르기: 점수 내림차순, 같으면 경로순. minScore 이상, maxDocs까지.
  const ranked = concepts
    .map((c) => ({ c, ...score(question, c, opt.fields) }))
    .filter((r) => r.score >= opt.minScore)
    .sort((a, b) => b.score - a.score || a.c.path.localeCompare(b.c.path));
  for (const r of ranked.slice(0, opt.maxDocs)) {
    picks.push({ path: r.c.path, via: 'keyword', score: r.score, matched: r.matched });
  }

  // 2) 링크 한 단계: 키워드로 고른 개념의 링크만 본다. 링크로 추가한 개념의 링크는 따라가지 않는다.
  if (opt.followLinks) {
    const seeds = picks.filter((p) => p.via === 'keyword');
    for (const seed of seeds) {
      for (const raw of byPath.get(seed.path)!.links) {
        const target = resolveLink(seed.path, raw);
        if (target === null) {
          warnings.push(`${seed.path}의 링크 ${raw}가 번들 밖을 가리켜 건너뛴다.`);
          continue;
        }
        if (picks.some((p) => p.path === target)) continue; // 중복 제거 (정규화한 경로로 비교)
        if (!byPath.has(target)) {
          warnings.push(`${seed.path}의 링크 ${raw}(${target})가 번들에 없어 건너뛴다.`);
          continue;
        }
        if (picks.length >= opt.maxDocs) {
          warnings.push(`상한 ${opt.maxDocs}개에 걸려 ${target}를 추가하지 않았다.`);
          continue;
        }
        picks.push({ path: target, via: 'link', score: 0, matched: [], from: seed.path });
      }
    }
  }
  return { picks, warnings };
}
