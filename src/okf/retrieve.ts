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
  boostMeta: boolean;           // body+meta일 때 title·tags에서도 겹친 키워드를 한 번 더 센다 (번들마다 켠다)
};

export const DEFAULT_OPTIONS: Options = { fields: 'body+meta', followLinks: true, maxDocs: 3, minScore: 2, boostMeta: false };

// 주제 허브 개념의 type. 여러 개념을 묶어 링크하는 목차라 검색에서 직접 고르지 않는다 (docs/adr/0001-topic-retrieval.md).
//  - 키워드 검색 후보에서 뺀다. 요약이 많아 어느 질문에나 점수가 잘 나오고, 뽑히면 자리 하나에 2차 요약이 통째로 들어간다.
//  - 질문 키워드가 title·tags에 있는 Topic이 링크하는 개념은 점수 +1 (그 주제 영역을 먼저 본다).
//  - 링크 따라가기도 Topic으로는 가지 않는다 (FAQ → 소속 주제 같은 위쪽 링크).
export const TOPIC_TYPE = 'Topic';

export type Pick = {
  path: string;
  via: 'keyword' | 'link';
  score: number;      // keyword: 겹친 키워드 수 + 가산, link: 0
  matched: string[];  // keyword: 겹친 키워드, link: []
  from?: string;      // link: 링크를 따라온 출발 개념
  metaMatched?: string[]; // keyword, boostMeta: title·tags에서도 겹쳐 한 번 더 센 키워드
  topic?: string;         // keyword: +1을 준 주제 허브(Topic) 경로
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

// title·tags에서 겹친 키워드. boostMeta 가산과 주제 허브 매칭에 쓴다 (description은 "어떻게" 같은 말이 많아 뺀다).
export function metaMatches(question: string, c: Concept): string[] {
  const meta = bigrams([c.title, c.tags.join(' ')].join('\n'));
  return [...bigrams(question)].filter((b) => meta.has(b)).sort();
}

const isTopic = (c: Concept) => c.type === TOPIC_TYPE;

// 질문 키워드가 title·tags에 있는 주제 허브 → 그 허브가 링크하는 개념(경로 → 허브 경로). 겹친 수가 많은 허브가 먼저다.
function topicArea(question: string, concepts: Concept[], byPath: Map<string, Concept>): Map<string, string> {
  const hits = concepts
    .filter(isTopic)
    .map((t) => ({ t, n: metaMatches(question, t).length }))
    .filter((h) => h.n > 0)
    .sort((a, b) => b.n - a.n || a.t.path.localeCompare(b.t.path));
  const area = new Map<string, string>();
  for (const { t } of hits) {
    for (const raw of t.links) {
      const target = resolveLink(t.path, raw);
      if (target === null || area.has(target)) continue;
      const c = byPath.get(target);
      if (c && !isTopic(c)) area.set(target, t.path);
    }
  }
  return area;
}

export function retrieve(bundle: Bundle, question: string, options: Partial<Options> = {}): Result {
  const opt = { ...DEFAULT_OPTIONS, ...options };
  const concepts = readConcepts(bundle);
  const byPath = new Map(concepts.map((c) => [c.path, c]));
  const picks: Pick[] = [];
  const warnings: string[] = [];

  // 1) 키워드로 고르기: 점수 내림차순, 같으면 경로순. minScore 이상, maxDocs까지.
  //    점수 = 겹친 키워드 수 + title·tags 가산(boostMeta) + 주제 영역 가산(1). 주제 허브는 후보가 아니다.
  const area = topicArea(question, concepts, byPath);
  const ranked = concepts
    .filter((c) => !isTopic(c))
    .map((c) => {
      const base = score(question, c, opt.fields);
      const meta = opt.boostMeta && opt.fields === 'body+meta' ? metaMatches(question, c) : [];
      const topic = area.get(c.path);
      return { c, ...base, meta, topic, total: base.score + meta.length + (topic ? 1 : 0) };
    })
    .filter((r) => r.total >= opt.minScore)
    .sort((a, b) => b.total - a.total || a.c.path.localeCompare(b.c.path));
  for (const r of ranked.slice(0, opt.maxDocs)) {
    picks.push({
      path: r.c.path,
      via: 'keyword',
      score: r.total,
      matched: r.matched,
      ...(r.meta.length > 0 ? { metaMatched: r.meta } : {}),
      ...(r.topic ? { topic: r.topic } : {}),
    });
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
          // 번들에 없거나, 파일은 있어도 개념이 아니다(type 없음, 디렉터리 등). 링크가 개념을 가리킬 때만 따라간다 (§6.1).
          const why = bundle.has(target) || bundle.has(`${target}/index.md`) ? '개념이 아니어서' : '번들에 없어';
          warnings.push(`${seed.path}의 링크 ${raw}(${target})가 ${why} 건너뛴다.`);
          continue;
        }
        if (isTopic(byPath.get(target)!)) continue; // 주제 허브로 올라가는 링크는 따라가지 않는다 (경고 없이)
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
