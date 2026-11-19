// 7회차 피드백 루프: `pnpm test`의 provenance 부분이 모두 통과하면 src/okf/provenance.ts 구현이 끝난 것이다.
// 단계별로: node --test --test-name-pattern="P1단계" "tests/**/*.test.ts"
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { checkAttribution, classifyResource, readProvenance, trace } from '../src/okf/provenance.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
const POLICY = [
  '---',
  'type: Policy',
  'sources:',
  '  - id: faq',
  '    resource: /references/faq.md',
  '---',
  '',
  '# 반품 조건',
  '',
  '수령 후 7일 이내에 신청할 수 있다.[^faq]',
  '',
  '[^faq]: 반품 FAQ',
  '',
].join('\n');
const FAQ = '---\ntype: Reference\n---\n\n# FAQ\n\n7일 이내에 신청하세요.\n';
const prov = (text: string) => readProvenance(bundle({ 'a.md': text }), 'a.md')!;

describe('P0단계 제공 함수 확인 (이미 통과)', () => {
  test('readProvenance: sources와 각주 주장을 읽고, 각주 정의 줄은 주장에서 뺀다', () => {
    const p = readProvenance(bundle({ 'policies/returns.md': POLICY }), 'policies/returns.md')!;
    assert.deepEqual(p.sources, [{ id: 'faq', resource: '/references/faq.md', title: undefined }]);
    assert.deepEqual(p.claims, [{ line: 4, text: '수령 후 7일 이내에 신청할 수 있다.[^faq]', labels: ['faq'] }]);
    assert.deepEqual(p.definitions, ['faq']);
  });
  test('classifyResource: URL, 범위 설명, 경로를 나눈다', () => {
    assert.equal(classifyResource('https://example.com/faq'), 'url');
    assert.equal(classifyResource('all tickets in support queue'), 'scope');
    assert.equal(classifyResource('/references/faq.md'), 'path');
    assert.equal(classifyResource('../references/faq.md'), 'path');
  });
});

describe('P0단계 v0.3 읽기 규칙 (§11.2)', () => {
  test('대시 없이 쓴 sources 항목 하나는 목록 하나, 빈 값은 없는 것', () => {
    assert.deepEqual(prov('---\ntype: Policy\nsources: { id: faq, resource: /references/faq.md }\n---\n').sources, [
      { id: 'faq', resource: '/references/faq.md', title: undefined },
    ]);
    assert.deepEqual(prov('---\ntype: Policy\nsources: []\n---\n').sources, []);
    assert.deepEqual(prov('---\ntype: Policy\nsources:\n  - { id: "", resource: "" }\n---\n').sources, [{ id: undefined, resource: undefined, title: undefined }]);
  });
});

describe('P1단계 checkAttribution', () => {
  test('라벨과 id가 맞고 resource가 있으면 문제없다', () => {
    assert.deepEqual(checkAttribution(prov(POLICY)), []);
  });
  test('sources에 없는 각주 라벨은 unknown-label (라벨마다 한 번)', () => {
    const text = '---\ntype: Policy\n---\n\n첫 주장.[^memo]\n둘째 주장.[^memo]\n';
    assert.deepEqual(checkAttribution(prov(text)).map((i) => i.kind), ['unknown-label']);
  });
  test('resource가 없는 sources 항목은 missing-resource', () => {
    const text = '---\ntype: Policy\nsources:\n  - id: faq\n    title: FAQ\n---\n\n주장.[^faq]\n';
    assert.deepEqual(checkAttribution(prov(text)).map((i) => i.kind), ['missing-resource']);
  });
  test('id가 위치 번호가 아니라 라벨과 맞아야 한다: 순서를 바꿔도 결과가 같다', () => {
    const fm = (a: string, b: string) => `---\ntype: Policy\nsources:\n  - ${a}\n  - ${b}\n---\n\n가.[^x]\n나.[^y]\n`;
    const one = checkAttribution(prov(fm('{ id: x, resource: x.md }', '{ id: y, resource: y.md }')));
    const two = checkAttribution(prov(fm('{ id: y, resource: y.md }', '{ id: x, resource: x.md }')));
    assert.deepEqual(one, []);
    assert.deepEqual(two, []);
  });
  test('unknown-label을 먼저, missing-resource를 나중에 보고한다', () => {
    const text = '---\ntype: Policy\nsources:\n  - { id: faq }\n---\n\n가.[^zzz]\n';
    assert.deepEqual(checkAttribution(prov(text)).map((i) => i.kind), ['unknown-label', 'missing-resource']);
  });
});

describe('P2단계 trace', () => {
  test('번들에 없는 개념이면 null', () => {
    assert.equal(trace(bundle({}), 'x.md'), null);
  });
  test("'/' 경로는 번들 루트 기준으로 풀고, 이어진 개념을 다시 따라간다", () => {
    const n = trace(bundle({ 'policies/returns.md': POLICY, 'references/faq.md': FAQ }), 'policies/returns.md')!;
    assert.equal(n.sources[0].kind, 'bundle');
    assert.equal(n.sources[0].target, 'references/faq.md');
    assert.equal(n.sources[0].next?.path, 'references/faq.md');
    assert.deepEqual(n.sources[0].next?.sources, []);
    assert.deepEqual(n.issues, []);
  });
  test('상대 경로도 개념 위치 기준으로 푼다', () => {
    const text = POLICY.replace('/references/faq.md', '../references/faq.md');
    const n = trace(bundle({ 'policies/returns.md': text, 'references/faq.md': FAQ }), 'policies/returns.md')!;
    assert.equal(n.sources[0].target, 'references/faq.md');
  });
  test('파일이 없으면 missing, 번들 밖이면 outside, URL·범위·resource 없음도 구분한다', () => {
    const text = [
      '---',
      'type: Policy',
      'sources:',
      '  - { id: a, resource: /references/none.md }',
      '  - { id: b, resource: ../../outside.md }',
      '  - { id: c, resource: "https://example.com/faq" }',
      '  - { id: d, resource: all tickets in support queue }',
      '  - { id: e }',
      '---',
      '',
    ].join('\n');
    const n = trace(bundle({ 'policies/returns.md': text }), 'policies/returns.md')!;
    assert.deepEqual(n.sources.map((s) => s.kind), ['missing', 'outside', 'url', 'scope', 'none']);
    assert.equal(n.sources[0].target, 'references/none.md');
    assert.deepEqual(n.issues.map((i) => i.kind), ['missing-resource']);
  });
  test('번들 파일이지만 개념이 아니면 not-a-concept, 따라가지 않는다 (§3.2)', () => {
    const text = POLICY.replace('/references/faq.md', '/references/README.md');
    const n = trace(bundle({ 'policies/returns.md': text, 'references/README.md': '# 안내' }), 'policies/returns.md')!;
    assert.equal(n.sources[0].kind, 'not-a-concept');
    assert.equal(n.sources[0].next, undefined);
  });
  test("v0.2 번들은 '/' 없는 경로가 파일 기준으로 없으면 번들 루트 기준으로 다시 찾는다 (§6.2, §12.1)", () => {
    const text = POLICY.replace('/references/faq.md', 'references/faq.md');
    const files = { 'policies/returns.md': text, 'references/faq.md': FAQ };
    const v02 = trace(bundle({ ...files, 'index.md': '---\nokf_version: "0.2"\n---\n' }), 'policies/returns.md')!;
    assert.equal(v02.sources[0].kind, 'bundle');
    assert.equal(v02.sources[0].target, 'references/faq.md');
    assert.equal(v02.sources[0].legacy, true);
    const v03 = trace(bundle({ ...files, 'index.md': '---\nokf_version: "0.3"\n---\n' }), 'policies/returns.md')!;
    assert.equal(v03.sources[0].kind, 'missing');
    assert.equal(v03.sources[0].target, 'policies/references/faq.md');
    assert.equal(v03.sources[0].legacy, undefined);
  });
  test('순환하는 출처는 한 번만 따라간다', () => {
    const a = '---\ntype: X\nsources:\n  - { id: b, resource: b.md }\n---\n';
    const b = '---\ntype: X\nsources:\n  - { id: a, resource: a.md }\n---\n';
    const n = trace(bundle({ 'a.md': a, 'b.md': b }), 'a.md')!;
    const toA = n.sources[0].next!.sources[0];
    assert.equal(toA.kind, 'bundle');
    assert.equal(toA.target, 'a.md');
    assert.equal(toA.next, undefined);
  });
});

describe('P3단계 실제 번들 (0007 실습 결과)', () => {
  test('반품 정책의 출처를 따라가면 FAQ 원문 개념에 닿고, 각주 문제가 없다', async () => {
    const n = trace(await loadBundle('bundles/knowledge'), 'policies/returns.md')!;
    assert.deepEqual(n.claims.map((c) => c.labels), [['returns-faq']]);
    assert.equal(n.sources[0].kind, 'bundle');
    assert.equal(n.sources[0].next?.path, 'references/returns-faq.md');
    assert.deepEqual(n.issues, []);
  });
});
