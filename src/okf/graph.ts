// 9회차(심화 3) 실습: buildGraph·backlinks 구현 완료 (tests/graph.test.ts). 순서: G1단계 → G2단계.
// 레슨: learn/lessons/0009-read-bundle-differently.html
import type { Bundle } from './types.ts';
import { readConcepts } from './retrieve.ts';
import { classifyResource, readProvenance } from './provenance.ts';
import { resolveLink } from './validate.ts';

// ── 그래프 ────────────────────────────────────────────────────────────
// 노드는 개념, 간선은 두 종류다.
//  link:   본문 링크 (§6.1). 개념 사이에 관계가 있다는 사실.
//  source: frontmatter sources[].resource가 번들 경로일 때 (§5.1). 개념이 그 자료를 보고 썼다는 사실.
export type GraphNode = { path: string; type: string; title: string };
export type EdgeKind = 'link' | 'source';
export type GraphEdge = {
  from: string;
  to: string;      // 번들 루트 기준 경로
  kind: EdgeKind;
  raw: string;     // 개념에 쓰인 그대로 (../processes/refunds.md, /references/returns-faq.md)
  broken: boolean; // to가 노드에 없다 (§6.1: 끊어진 링크도 거부하지 않는다)
};
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; warnings: string[] };

// G1단계: 번들에서 그래프를 만든다.
//  - nodes: readConcepts(bundle) 순서 그대로 (경로순, index.md·log.md·파싱 실패 제외). type·title만 담는다.
//  - 개념마다 link 간선을 먼저, 그다음 source 간선을 만든다.
//    link:   concept.links의 각 raw를 resolveLink(path, raw)로 푼다.
//    source: readProvenance(bundle, path).sources 가운데 resource가 있고 classifyResource가 'path'인 것만. URL·범위 설명은 간선이 아니다.
//  - resolveLink가 null(번들 밖)이면 간선을 만들지 않고 warnings에 한 줄 남긴다. 문구는 자유다.
//  - 자기 자신을 가리키면 건너뛴다. 같은 (from, to, kind)는 한 번만.
//  - broken: to가 nodes에 없으면 true. 간선은 그래도 만든다.
export function buildGraph(bundle: Bundle): Graph {
  // G1단계 (완료)
  const concepts = readConcepts(bundle);
  const nodes = concepts.map((c) => ({ path: c.path, type: c.type, title: c.title }));
  const has = new Set(nodes.map((n) => n.path));
  const edges: GraphEdge[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  const add = (from: string, raw: string, kind: EdgeKind) => {
    const to = resolveLink(from, raw); // '/'는 번들 루트, 아니면 개념 위치 기준
    if (to === null) {
      warnings.push(`${from}의 ${kind === 'link' ? '링크' : '출처'} ${raw}가 번들 밖을 가리켜 그리지 않는다.`);
      return;
    }
    const key = `${from}\n${to}\n${kind}`;
    if (to === from || seen.has(key)) return; // 자기 자신, 같은 (from, to, kind)는 건너뛴다
    seen.add(key);
    edges.push({ from, to, kind, raw, broken: !has.has(to) });
  };
  for (const c of concepts) {
    for (const raw of c.links) add(c.path, raw, 'link');
    for (const s of readProvenance(bundle, c.path)?.sources ?? []) {
      if (s.resource && classifyResource(s.resource) === 'path') add(c.path, s.resource, 'source');
    }
  }
  return { nodes, edges, warnings };
}

// G2단계: path를 가리키는 간선의 출발 개념 목록 ("Cited by").
//  - 끊어진 간선도 to가 같으면 포함한다 (없는 개념을 누가 가리키는지 알 수 있다).
//  - from 경로순, 같으면 link가 source보다 먼저.
export function backlinks(graph: Graph, path: string): { from: string; kind: EdgeKind }[] {
  // G2단계 (완료)
  const order: Record<EdgeKind, number> = { link: 0, source: 1 };
  return graph.edges
    .filter((e) => e.to === path)
    .map((e) => ({ from: e.from, kind: e.kind }))
    .sort((a, b) => a.from.localeCompare(b.from) || order[a.kind] - order[b.kind]);
}

// ── 출력 (제공) ─────────────────────────────────────────────────────
const KIND: Record<EdgeKind, string> = { link: '링크', source: '출처' };

export function formatGraph(graph: Graph): string[] {
  const out: string[] = [];
  const links = graph.edges.filter((e) => e.kind === 'link').length;
  out.push(`개념 ${graph.nodes.length}개, 링크 간선 ${links}개, 출처 간선 ${graph.edges.length - links}개`);
  for (const n of graph.nodes) {
    out.push('', `${n.path}  [${n.type}] ${n.title}`);
    for (const e of graph.edges.filter((x) => x.from === n.path)) {
      out.push(`  → ${e.to}  (${KIND[e.kind]}${e.broken ? ', 번들에 없음' : ''})  ${e.raw}`);
    }
    const back = backlinks(graph, n.path);
    out.push(`  ← 가리키는 개념: ${back.length === 0 ? '없음' : back.map((b) => `${b.from}(${KIND[b.kind]})`).join(', ')}`);
  }
  for (const w of graph.warnings) out.push(`WARN ${w}`);
  return out;
}

// Mermaid flowchart. GitHub·에디터 미리보기가 그림으로 그린다. 링크는 실선, 출처는 점선이다.
export function toMermaid(graph: Graph): string[] {
  const ids = new Map<string, string>();
  const id = (path: string) => {
    if (!ids.has(path)) ids.set(path, `n${ids.size}`);
    return ids.get(path)!;
  };
  const label = (s: string) => s.replace(/"/g, '#quot;');
  const out = ['flowchart LR'];
  for (const n of graph.nodes) out.push(`  ${id(n.path)}["${label(n.title || n.path)}<br/><small>${label(n.type)} · ${label(n.path)}</small>"]`);
  for (const e of graph.edges) {
    if (e.broken && !ids.has(e.to)) out.push(`  ${id(e.to)}["${label(e.to)}<br/><small>번들에 없음</small>"]:::missing`);
    out.push(e.kind === 'link' ? `  ${id(e.from)} --> ${id(e.to)}` : `  ${id(e.from)} -. 출처 .-> ${id(e.to)}`);
  }
  out.push('  classDef missing stroke-dasharray: 4 4,stroke:#c00');
  return out;
}
