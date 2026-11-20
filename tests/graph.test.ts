// 9회차 피드백 루프: `pnpm test`의 graph 부분이 모두 통과하면 src/okf/graph.ts 구현이 끝난 것이다.
// 단계별로: node --test --test-name-pattern="G1단계" "tests/**/*.test.ts"
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { backlinks, buildGraph, toMermaid, type Graph } from '../src/okf/graph.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
const concept = (fm: string, body: string) => `---\n${fm}\n---\n\n${body}\n`;
const pairs = (g: Graph) => g.edges.map((e) => `${e.from} -${e.kind}-> ${e.to}${e.legacy ? ' (legacy)' : ''}`);
const dangling = (g: Graph) => g.dangling.map((d) => `${d.from} -${d.kind}-> ${d.to} (${d.reason})`);

describe('G0단계 제공 함수 확인 (이미 통과)', () => {
  test('toMermaid: 링크는 실선, 경로 필드는 종류 이름을 단 점선, 번들에 없는 대상은 missing', () => {
    const g: Graph = {
      nodes: [{ path: 'a.md', type: 'Policy', title: 'A' }, { path: 'b.md', type: 'Reference', title: 'B' }],
      edges: [
        { from: 'a.md', to: 'b.md', kind: 'source', raw: 'b.md' },
        { from: 'a.md', to: 'b.md', kind: 'superseded-by', raw: 'b.md' },
      ],
      dangling: [
        { from: 'a.md', to: 'c.md', kind: 'link', raw: 'c.md', reason: 'missing' },
        { from: 'a.md', to: 'README.md', kind: 'link', raw: 'README.md', reason: 'not-a-concept' },
      ],
      warnings: [],
    };
    const m = toMermaid(g);
    assert.equal(m[0], 'flowchart LR');
    assert.ok(m.includes('  n0 -. 출처 .-> n1'));
    assert.ok(m.includes('  n0 -. 대체 .-> n1'));
    assert.ok(m.includes('  n0 --> n2'));
    assert.ok(!m.some((l) => l.includes('README.md'))); // 개념이 아닌 파일은 그리지 않는다
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
      'policies/returns.md -link-> policies/exceptions.md',
      'policies/returns.md -link-> processes/refunds.md',
      'policies/returns.md -source-> references/faq.md',
    ]);
  });
  test('개념을 가리키지 않는 링크는 간선이 아니고 dangling에 남는다 (§6.4)', () => {
    assert.deepEqual(dangling(graph()), ['policies/exceptions.md -link-> policies/gone.md (missing)']);
  });
  test('raw는 개념에 쓰인 그대로 남긴다 (처음 나온 것)', () => {
    assert.equal(graph().edges[2].raw, '../processes/refunds.md');
    assert.equal(graph().edges[3].raw, '/references/faq.md');
  });
  test('URL·범위 설명 출처는 간선이 아니고, 번들 밖 링크는 경고 한 줄', () => {
    const g = graph();
    assert.equal(g.edges.filter((e) => e.kind === 'source').length, 1);
    assert.equal(g.warnings.length, 1);
    assert.ok(g.warnings[0].includes('../../etc.md'));
  });
  test('파싱할 수 없는 파일, type 없는 파일, 디렉터리는 노드가 아니고 그쪽 링크는 간선이 아니다 (§3.2, §6.1)', () => {
    const g2 = buildGraph(bundle({
      'a.md': '---\ntype: [\n---\n',
      'README.md': '# 안내',
      'b.md': concept('type: Policy', '[a](a.md) [r](README.md) [p](policies/)'),
      'policies/index.md': '# 정책',
    }));
    assert.deepEqual(g2.nodes.map((n) => n.path), ['b.md']);
    assert.deepEqual(pairs(g2), []);
    assert.deepEqual(dangling(g2), ['b.md -link-> a.md (not-a-concept)', 'b.md -link-> README.md (not-a-concept)', 'b.md -link-> policies (not-a-concept)']);
  });
  test('경로 필드 superseded_by·resource도 간선이다. 필드마다 종류가 다르다 (§6.2, §6.4)', () => {
    const g2 = buildGraph(bundle({
      'index.md': '---\nokf_version: "0.3"\n---\n',
      'policies/old.md': concept('type: Policy\nstatus: deprecated\nsuperseded_by: new.md\nresource: /tables/t.md', '본문'),
      'policies/new.md': concept('type: Policy', '본문'),
      'tables/t.md': concept('type: Table', '본문'),
    }));
    assert.deepEqual(pairs(g2), ['policies/old.md -resource-> tables/t.md', 'policies/old.md -superseded-by-> policies/new.md']);
  });
  test('v0.2·버전 선언 없는 번들은 경로 필드에만 번들 루트 기준 대체 해석을 쓴다 (§6.2, §12.1)', () => {
    const files = {
      'policies/a.md': concept('type: Policy\nsources:\n  - { id: faq, resource: references/faq.md }', '[faq](references/faq.md)'),
      'references/faq.md': concept('type: Reference', '본문'),
    };
    const v02 = buildGraph(bundle({ ...files, 'index.md': '---\nokf_version: "0.2"\n---\n' }));
    assert.deepEqual(pairs(v02), ['policies/a.md -source-> references/faq.md (legacy)']);
    assert.deepEqual(dangling(v02), ['policies/a.md -link-> policies/references/faq.md (missing)']); // 본문 링크는 대체 해석 없음
    const v03 = buildGraph(bundle({ ...files, 'index.md': '---\nokf_version: "0.3"\n---\n' }));
    assert.deepEqual(pairs(v03), []);
    assert.deepEqual(dangling(v03).length, 2);
  });
});

describe('G2단계 backlinks', () => {
  const g: Graph = {
    nodes: [],
    edges: [
      { from: 'z.md', to: 't.md', kind: 'link', raw: 't.md' },
      { from: 'a.md', to: 't.md', kind: 'superseded-by', raw: 't.md' },
      { from: 'a.md', to: 't.md', kind: 'source', raw: 't.md' },
      { from: 'a.md', to: 't.md', kind: 'link', raw: 't.md' },
      { from: 'a.md', to: 'other.md', kind: 'link', raw: 'other.md' },
    ],
    dangling: [{ from: 'm.md', to: 'gone.md', kind: 'link', raw: 'gone.md', reason: 'missing' }],
    warnings: [],
  };
  test('대상을 가리키는 개념을 경로순, 같으면 link → source → superseded-by', () => {
    assert.deepEqual(backlinks(g, 't.md'), [
      { from: 'a.md', kind: 'link' },
      { from: 'a.md', kind: 'source' },
      { from: 'a.md', kind: 'superseded-by' },
      { from: 'z.md', kind: 'link' },
    ]);
  });
  test('없는 개념을 누가 가리키는지도 알 수 있다 (dangling 포함)', () => {
    assert.deepEqual(backlinks(g, 'gone.md'), [{ from: 'm.md', kind: 'link' }]);
  });
  test('아무도 가리키지 않으면 빈 목록', () => {
    assert.deepEqual(backlinks(g, 'z.md'), []);
  });
});

describe('G3단계 실제 번들', () => {
  test('링크 3개와 출처 1개. FAQ는 출처 간선으로만 이어진다', async () => {
    const g = buildGraph(await loadBundle('bundles/knowledge'));
    assert.deepEqual(pairs(g), [
      'policies/return-exceptions.md -link-> policies/returns.md',
      'policies/returns.md -link-> policies/return-exceptions.md',
      'policies/returns.md -link-> processes/refunds.md',
      'policies/returns.md -source-> references/returns-faq.md',
    ]);
    assert.deepEqual(g.dangling, []);
    assert.deepEqual(backlinks(g, 'references/returns-faq.md'), [{ from: 'policies/returns.md', kind: 'source' }]);
  });
});
