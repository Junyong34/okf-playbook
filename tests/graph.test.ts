// 9회차 피드백 루프: `pnpm test`의 graph 부분이 모두 통과하면 src/okf/graph.ts 구현이 끝난 것이다.
// 단계별로: node --test --test-name-pattern="G1단계" "tests/**/*.test.ts"
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { backlinks, buildGraph, toMermaid, type Graph } from '../src/okf/graph.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
const concept = (fm: string, body: string) => `---\n${fm}\n---\n\n${body}\n`;
const pairs = (g: Graph) => g.edges.map((e) => `${e.from} -${e.kind}-> ${e.to}${e.broken ? ' (broken)' : ''}`);

describe('G0단계 제공 함수 확인 (이미 통과)', () => {
  test('toMermaid: 링크는 실선, 출처는 점선, 없는 개념은 missing', () => {
    const g: Graph = {
      nodes: [{ path: 'a.md', type: 'Policy', title: 'A' }, { path: 'b.md', type: 'Reference', title: 'B' }],
      edges: [
        { from: 'a.md', to: 'b.md', kind: 'source', raw: 'b.md', broken: false },
        { from: 'a.md', to: 'c.md', kind: 'link', raw: 'c.md', broken: true },
      ],
      warnings: [],
    };
    const m = toMermaid(g);
    assert.equal(m[0], 'flowchart LR');
    assert.ok(m.includes('  n0 -. 출처 .-> n1'));
    assert.ok(m.includes('  n0 --> n2'));
    assert.ok(m.some((l) => l.includes('n2["c.md') && l.endsWith(':::missing')));
  });
});

describe('G1단계 buildGraph', () => {
  const b = bundle({
    'index.md': '# 목차\n\n- [정책](policies/returns.md)\n',
    'policies/returns.md': concept(
      'type: Policy\ntitle: 반품 정책\nsources:\n  - { id: faq, resource: /references/faq.md }\n  - { id: web, resource: "https://example.com/faq" }\n  - { id: all, resource: all tickets in queue }',
      '[예외](exceptions.md) · [환불](../processes/refunds.md) · [다시 환불](/processes/refunds.md) · [나](returns.md) · [밖](../../etc.md)',
    ),
    'policies/exceptions.md': concept('type: Policy\ntitle: 반품 예외', '[정책](returns.md) · [없음](gone.md)'),
    'processes/refunds.md': concept('type: Process\ntitle: 환불', '본문'),
    'references/faq.md': concept('type: Reference\ntitle: FAQ', '본문'),
  });
  const graph = () => buildGraph(b); // 테스트마다 부른다: TODO면 테스트마다 실패 메시지가 보인다

  test('노드는 index.md를 뺀 개념, 경로순, type·title', () => {
    assert.deepEqual(graph().nodes, [
      { path: 'policies/exceptions.md', type: 'Policy', title: '반품 예외' },
      { path: 'policies/returns.md', type: 'Policy', title: '반품 정책' },
      { path: 'processes/refunds.md', type: 'Process', title: '환불' },
      { path: 'references/faq.md', type: 'Reference', title: 'FAQ' },
    ]);
  });
  test('간선: 개념마다 링크 먼저, 출처 나중. 상대·/ 경로를 같은 대상으로 풀고 한 번만', () => {
    assert.deepEqual(pairs(graph()), [
      'policies/exceptions.md -link-> policies/returns.md',
      'policies/exceptions.md -link-> policies/gone.md (broken)',
      'policies/returns.md -link-> policies/exceptions.md',
      'policies/returns.md -link-> processes/refunds.md',
      'policies/returns.md -source-> references/faq.md',
    ]);
  });
  test('raw는 개념에 쓰인 그대로 남긴다 (처음 나온 것)', () => {
    assert.equal(graph().edges[3].raw, '../processes/refunds.md');
    assert.equal(graph().edges[4].raw, '/references/faq.md');
  });
  test('URL·범위 설명 출처는 간선이 아니고, 번들 밖 링크는 경고 한 줄', () => {
    const g = graph();
    assert.equal(g.edges.filter((e) => e.kind === 'source').length, 1);
    assert.equal(g.warnings.length, 1);
    assert.ok(g.warnings[0].includes('../../etc.md'));
  });
  test('파싱할 수 없는 개념은 노드가 아니다', () => {
    const g2 = buildGraph(bundle({ 'a.md': '---\ntype: [\n---\n', 'b.md': concept('type: Policy', '[a](a.md)') }));
    assert.deepEqual(g2.nodes.map((n) => n.path), ['b.md']);
    assert.deepEqual(pairs(g2), ['b.md -link-> a.md (broken)']);
  });
});

describe('G2단계 backlinks', () => {
  const g: Graph = {
    nodes: [],
    edges: [
      { from: 'z.md', to: 't.md', kind: 'link', raw: 't.md', broken: false },
      { from: 'a.md', to: 't.md', kind: 'source', raw: 't.md', broken: false },
      { from: 'a.md', to: 't.md', kind: 'link', raw: 't.md', broken: false },
      { from: 'a.md', to: 'other.md', kind: 'link', raw: 'other.md', broken: false },
      { from: 'm.md', to: 'gone.md', kind: 'link', raw: 'gone.md', broken: true },
    ],
    warnings: [],
  };
  test('대상을 가리키는 개념을 경로순, link 먼저', () => {
    assert.deepEqual(backlinks(g, 't.md'), [
      { from: 'a.md', kind: 'link' },
      { from: 'a.md', kind: 'source' },
      { from: 'z.md', kind: 'link' },
    ]);
  });
  test('없는 개념을 누가 가리키는지도 알 수 있다', () => {
    assert.deepEqual(backlinks(g, 'gone.md'), [{ from: 'm.md', kind: 'link' }]);
  });
  test('아무도 가리키지 않으면 빈 목록', () => {
    assert.deepEqual(backlinks(g, 'z.md'), []);
  });
});

describe('G3단계 실제 번들', () => {
  test('링크 3개와 출처 1개. FAQ는 출처 간선으로만 이어진다', async () => {
    const g = buildGraph(await loadBundle('knowledge'));
    assert.deepEqual(pairs(g), [
      'policies/return-exceptions.md -link-> policies/returns.md',
      'policies/returns.md -link-> policies/return-exceptions.md',
      'policies/returns.md -link-> processes/refunds.md',
      'policies/returns.md -source-> references/returns-faq.md',
    ]);
    assert.deepEqual(backlinks(g, 'references/returns-faq.md'), [{ from: 'policies/returns.md', kind: 'source' }]);
  });
});
