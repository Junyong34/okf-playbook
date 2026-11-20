// 그래프 화면의 선 합치기와 연결 구조 배치 (web/src/features/graph/graphLayout.ts)
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Graph, GraphEdge, GraphNode } from '../src/okf/graph.ts';
import { conceptPositions, mergeEdges } from '../web/src/features/graph/graphLayout.ts';

const node = (path: string, type: string): GraphNode => ({ path, type, title: path });
const edge = (from: string, to: string, kind: GraphEdge['kind'] = 'link'): GraphEdge => ({ from, to, kind, raw: to });

describe('mergeEdges', () => {
  test('같은 두 개념 사이의 간선은 방향·종류가 달라도 선 하나로 합친다', () => {
    const nodes = [node('faqs/a.md', 'FAQ'), node('topics/t.md', 'Topic')];
    const drawn = mergeEdges(nodes, [
      edge('faqs/a.md', 'topics/t.md'),
      edge('topics/t.md', 'faqs/a.md'),
      edge('topics/t.md', 'faqs/a.md', 'source'),
    ]);
    assert.equal(drawn.length, 1);
    assert.deepEqual(drawn[0].kinds, ['source', 'link']); // 본문 링크는 색 우선순위가 가장 낮다
    assert.equal(drawn[0].bidirectional, true);
    assert.equal(drawn[0].secondary, false);
  });

  test('한쪽 방향만 있으면 bidirectional이 아니고, 같은 유형끼리면 보조 선이다', () => {
    const nodes = [node('faqs/a.md', 'FAQ'), node('faqs/b.md', 'FAQ')];
    const [drawn] = mergeEdges(nodes, [edge('faqs/a.md', 'faqs/b.md')]);
    assert.equal(drawn.bidirectional, false);
    assert.equal(drawn.secondary, true);
    assert.equal(drawn.from, 'faqs/a.md');
  });
});

describe('conceptPositions: 연결 구조', () => {
  // 주제 둘에 FAQ가 다섯 개씩 달리고, 무리 사이에 FAQ↔FAQ 보조 선이 하나 있다.
  const nodes: GraphNode[] = [node('topics/a.md', 'Topic'), node('topics/b.md', 'Topic')];
  const edges: GraphEdge[] = [edge('faqs/a/0.md', 'faqs/b/0.md')];
  for (const t of ['a', 'b']) {
    for (let i = 0; i < 5; i++) {
      const faq = `faqs/${t}/${i}.md`;
      nodes.push(node(faq, 'FAQ'));
      edges.push(edge(faq, `topics/${t}.md`), edge(`topics/${t}.md`, faq, 'source'));
    }
  }
  const graph: Graph = { nodes, edges, dangling: [], warnings: [] };

  test('같은 그래프는 늘 같은 위치에 그린다', () => {
    assert.deepEqual(conceptPositions(graph, 'force'), conceptPositions(graph, 'force'));
  });

  test('FAQ는 다른 주제보다 자기 주제에 가깝다', () => {
    const at = new Map(conceptPositions(graph, 'force').map((n) => [n.path, n]));
    const distance = (p: string, q: string) => Math.hypot(at.get(p)!.x - at.get(q)!.x, at.get(p)!.y - at.get(q)!.y);
    for (const { path, type } of nodes) {
      if (type !== 'FAQ') continue;
      const own = path.startsWith('faqs/a/') ? 'topics/a.md' : 'topics/b.md';
      const other = own === 'topics/a.md' ? 'topics/b.md' : 'topics/a.md';
      assert.ok(distance(path, own) < distance(path, other), `${path}가 ${own}에 더 가까워야 한다`);
      assert.ok(Number.isFinite(at.get(path)!.x) && Number.isFinite(at.get(path)!.y));
    }
  });
});
