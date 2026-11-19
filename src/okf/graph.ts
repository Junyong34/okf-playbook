// 9회차(심화 3) 실습: buildGraph·backlinks 구현 완료 (tests/graph.test.ts). 순서: G1단계 → G2단계.
// OKF v0.3 기준으로 고쳤다 (2026-11-19): 간선은 개념을 가리키는 링크와 경로 필드만(§6.4), superseded_by 등 경로 필드 간선 추가.
// 레슨: learn/lessons/0009-read-bundle-differently.html
import type { Bundle } from './types.ts';
import { pathFields, readBundle, resolveLink, resolvePathField, toConcept, type PathFieldName } from './concept.ts';

// ── 그래프 (§6.4) ─────────────────────────────────────────────────────
// 노드는 개념, 간선은 방향이 있는 두 갈래다.
//  링크:     본문 링크 가운데 번들의 개념을 가리키는 것 (§6.1). 개념 사이에 관계가 있다는 사실. 종류는 'link'.
//  경로 필드: frontmatter 경로 필드 가운데 번들의 개념으로 풀리는 것 (§6.2). 필드마다 종류를 나눈다.
//            source: sources[].resource (§5.1, 개념이 그 자료를 보고 썼다) / superseded-by: superseded_by (§5.4, 대체 개념)
//            resource: resource (§4.1) / computation·executor·attester: §10 필드
export type GraphNode = { path: string; type: string; title: string };
export type EdgeKind = 'link' | 'source' | 'superseded-by' | 'resource' | 'computation' | 'executor' | 'attester';
export type GraphEdge = {
  from: string;
  to: string;       // 번들 루트 기준 경로. 언제나 노드(개념)다
  kind: EdgeKind;
  raw: string;      // 개념에 쓰인 그대로 (../processes/refunds.md, /references/returns-faq.md)
  legacy?: true;    // 경로 필드를 v0.2 대체 해석(번들 루트 기준)으로 찾았다 (§6.2, §12.1)
};
// 개념을 가리키지 않는 번들 안 참조. 간선이 아니지만 끊어진 링크도 거부하지 않으므로(§6.1) 따로 모아 보여 준다.
//  missing: 번들에 파일이 없다 / not-a-concept: 파일(또는 디렉터리 index.md)은 있지만 개념이 아니다 (§3.2)
export type DanglingRef = { from: string; to: string; kind: EdgeKind; raw: string; reason: 'missing' | 'not-a-concept' };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; dangling: DanglingRef[]; warnings: string[] };

const FIELD_KIND: Record<PathFieldName, EdgeKind> = {
  resource: 'resource',
  'sources[].resource': 'source',
  superseded_by: 'superseded-by',
  computation: 'computation',
  'executor.resource': 'executor',
  'attester.resource': 'attester',
};

const KIND: Record<EdgeKind, string> = {
  link: '링크', source: '출처', 'superseded-by': '대체', resource: 'resource', computation: '계산', executor: '실행기', attester: '검증기',
};

// G1단계: 번들에서 그래프를 만든다.
//  - nodes: readConcepts(bundle)와 같은 순서 (경로순, index.md·log.md·개념이 아닌 파일 제외). type·title만 담는다.
//  - 개념마다 link 간선을 먼저, 그다음 경로 필드 간선을 pathFields 순서(resource → sources → superseded_by → …)로 만든다.
//    link:      concept.links의 각 raw를 resolveLink(path, raw)로 푼다. 본문 링크에는 v0.2 대체 해석을 쓰지 않는다.
//    경로 필드: pathFields(frontmatter)의 각 값을 resolvePathField(bundle, path, value)로 푼다. URL·범위 설명은 간선이 아니다.
//  - 번들 밖(null)이면 간선을 만들지 않고 warnings에 한 줄 남긴다. 문구는 자유다.
//  - 자기 자신을 가리키면 건너뛴다. 같은 (from, to, kind)는 한 번만.
//  - 대상이 개념이 아니면(번들에 없음, type 없는 파일, 디렉터리) 간선이 아니다(§6.4). dangling에 남긴다.
export function buildGraph(bundle: Bundle): Graph {
  // G1단계 (완료)
  // 번들을 한 번 읽어 개념과 경로 필드를 같은 파싱 결과에서 꺼낸다.
  const read = readBundle(bundle).flatMap((file) => {
    const c = toConcept(file); // index.md·log.md·개념이 아닌 파일은 null
    return c === null ? [] : [{ file, c }];
  });
  const nodes = read.map(({ c }) => ({ path: c.path, type: c.type, title: c.title }));
  const has = new Set(nodes.map((n) => n.path));
  const edges: GraphEdge[] = [];
  const dangling: DanglingRef[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  const add = (from: string, raw: string, kind: EdgeKind, to: string | null, legacy = false) => {
    if (to === null) {
      warnings.push(`${from}의 ${KIND[kind]} ${raw}가 번들 밖을 가리켜 그리지 않는다.`);
      return;
    }
    const key = `${from}\n${to}\n${kind}`;
    if (to === from || seen.has(key)) return; // 자기 자신, 같은 (from, to, kind)는 건너뛴다
    seen.add(key);
    if (has.has(to)) edges.push(legacy ? { from, to, kind, raw, legacy: true } : { from, to, kind, raw });
    else {
      const exists = bundle.has(to) || bundle.has(`${to.replace(/\/$/, '')}/index.md`);
      dangling.push({ from, to, kind, raw, reason: exists ? 'not-a-concept' : 'missing' });
    }
  };
  for (const { file, c } of read) {
    for (const raw of file.links) add(file.path, raw, 'link', resolveLink(file.path, raw));
    for (const f of pathFields(c.frontmatter)) {
      const r = resolvePathField(bundle, file.path, f.value);
      add(file.path, f.value, FIELD_KIND[f.field], r.target, r.legacy);
    }
  }
  return { nodes, edges, dangling, warnings };
}

// G2단계: path를 가리키는 개념 목록 ("Cited by").
//  - 간선과 dangling을 함께 본다. 없는 개념을 누가 가리키는지도 알 수 있다.
//  - from 경로순, 같으면 EdgeKind 정의 순서(link → source → superseded-by → …).
const ORDER: EdgeKind[] = ['link', 'source', 'superseded-by', 'resource', 'computation', 'executor', 'attester'];

export function backlinks(graph: Graph, path: string): { from: string; kind: EdgeKind }[] {
  // G2단계 (완료)
  return [...graph.edges, ...graph.dangling]
    .filter((e) => e.to === path)
    .map((e) => ({ from: e.from, kind: e.kind }))
    .sort((a, b) => a.from.localeCompare(b.from) || ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

// ── 출력 (제공) ─────────────────────────────────────────────────────
const REASON: Record<DanglingRef['reason'], string> = { missing: '번들에 없음', 'not-a-concept': '개념이 아님' };

export function formatGraph(graph: Graph): string[] {
  const out: string[] = [];
  const counts = ORDER.map((k) => [k, graph.edges.filter((e) => e.kind === k).length] as const).filter(([k, n]) => n > 0 || k === 'link' || k === 'source');
  out.push(`개념 ${graph.nodes.length}개, ${counts.map(([k, n]) => `${KIND[k]} 간선 ${n}개`).join(', ')}, 개념이 아닌 대상 ${graph.dangling.length}개`);
  for (const n of graph.nodes) {
    out.push('', `${n.path}  [${n.type}] ${n.title}`);
    for (const e of graph.edges.filter((x) => x.from === n.path)) {
      out.push(`  → ${e.to}  (${KIND[e.kind]}${e.legacy ? ', v0.2 대체 해석' : ''})  ${e.raw}`);
    }
    for (const d of graph.dangling.filter((x) => x.from === n.path)) {
      out.push(`  ⇢ ${d.to}  (${KIND[d.kind]}, ${REASON[d.reason]}, 간선 아님)  ${d.raw}`);
    }
    const back = backlinks(graph, n.path);
    out.push(`  ← 가리키는 개념: ${back.length === 0 ? '없음' : back.map((b) => `${b.from}(${KIND[b.kind]})`).join(', ')}`);
  }
  for (const w of graph.warnings) out.push(`WARN ${w}`);
  return out;
}

// Mermaid flowchart. GitHub·에디터 미리보기가 그림으로 그린다. 링크는 실선, 경로 필드는 종류 이름을 단 점선이다.
// 번들에 없는 대상(dangling missing)은 간선이 아니지만 빨간 점선 노드로 그려 둔다.
export function toMermaid(graph: Graph): string[] {
  const ids = new Map<string, string>();
  const id = (path: string) => {
    if (!ids.has(path)) ids.set(path, `n${ids.size}`);
    return ids.get(path)!;
  };
  const label = (s: string) => s.replace(/"/g, '#quot;');
  const out = ['flowchart LR'];
  for (const n of graph.nodes) out.push(`  ${id(n.path)}["${label(n.title || n.path)}<br/><small>${label(n.type)} · ${label(n.path)}</small>"]`);
  const arrow = (from: string, to: string, kind: EdgeKind) =>
    kind === 'link' ? `  ${id(from)} --> ${id(to)}` : `  ${id(from)} -. ${KIND[kind]} .-> ${id(to)}`;
  for (const e of graph.edges) out.push(arrow(e.from, e.to, e.kind));
  for (const d of graph.dangling) {
    if (d.reason !== 'missing') continue;
    if (!ids.has(d.to)) out.push(`  ${id(d.to)}["${label(d.to)}<br/><small>번들에 없음</small>"]:::missing`);
    out.push(arrow(d.from, d.to, d.kind));
  }
  out.push('  classDef missing stroke-dasharray: 4 4,stroke:#c00');
  return out;
}
