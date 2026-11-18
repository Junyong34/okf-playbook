// 4회차 피드백 루프: `pnpm test`의 retrieve 부분이 모두 통과하면 src/okf/retrieve.ts 구현이 끝난 것이다.
// 단계별로: node --test --test-name-pattern="R2단계" "tests/**/*.test.ts"
// R4단계(링크)는 0003 2단계 resolveLink를 쓴다. 먼저 0003 2단계를 통과시킨다.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { bigrams, readConcepts, retrieve, score } from '../src/okf/retrieve.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
const doc = (type: string, body: string, extra = '') => `---\ntype: ${type}\n${extra}---\n\n${body}\n`;
// 결과를 "k:경로"(키워드) / "l:경로"(링크) 목록으로 줄여 비교한다.
const picks = (b: Bundle, q: string, o = {}) => retrieve(b, q, o).picks.map((p) => `${p.via[0]}:${p.path}`);

describe('R1단계 제공 함수 확인 (이미 통과)', () => {
  test('bigrams: 조사가 붙어도 두 글자 묶음이 남는다', () => {
    assert.deepEqual([...bigrams('할인 상품을')], ['할인', '상품', '품을']);
  });
  test('readConcepts: index.md는 빼고, frontmatter를 읽을 수 없는 개념은 건너뛴다', () => {
    const cs = readConcepts(bundle({ 'index.md': '# 목차', 'a.md': doc('Policy', '본문'), 'b.md': '---\ntags:[x]\n---\n' }));
    assert.deepEqual(cs.map((c) => c.path), ['a.md']);
  });
});

describe('R2단계 score', () => {
  const c = readConcepts(bundle({ 'p.md': doc('Policy', '할인 상품도 반품할 수 있다.', 'tags: [예외]\n') }))[0];
  test('질문과 개념이 공유하는 두 글자 묶음 수가 점수다', () => {
    assert.deepEqual(score('할인 상품 반품', c, 'body'), { score: 3, matched: ['반품', '상품', '할인'] });
  });
  test('matched는 가나다순으로 정렬한다', () => {
    assert.deepEqual(score('반품 할인', c, 'body').matched, ['반품', '할인']);
  });
  test("fields='body'는 tags를 보지 않고, 'body+meta'는 본다", () => {
    assert.equal(score('예외 상품', c, 'body').score, 1);
    assert.equal(score('예외 상품', c, 'body+meta').score, 2);
  });
});

describe('R3단계 retrieve: 키워드로 고르기', () => {
  const b = bundle({
    'a.md': doc('Policy', '반품 신청 기한은 7일이다.'),
    'b.md': doc('Policy', '반품 신청은 고객센터에서 한다.'),
    'c.md': doc('Process', '환불 일정.'),
  });
  test('minScore(기본 2) 미만은 고르지 않는다', () => {
    assert.deepEqual(picks(b, '환불', { followLinks: false }), []);
    assert.deepEqual(picks(b, '환불 일정', { followLinks: false }), ['k:c.md']);
  });
  test('점수 내림차순, 같은 점수면 경로순', () => {
    assert.deepEqual(picks(b, '반품 신청 기한', { followLinks: false }), ['k:a.md', 'k:b.md']);
  });
  test('maxDocs를 넘기지 않는다', () => {
    assert.deepEqual(picks(b, '반품 신청 기한', { followLinks: false, maxDocs: 1 }), ['k:a.md']);
  });
  test('고른 이유(score, matched)를 함께 돌려준다', () => {
    const [p] = retrieve(b, '반품 기한', { followLinks: false }).picks;
    assert.deepEqual(p, { path: 'a.md', via: 'keyword', score: 2, matched: ['기한', '반품'] });
  });
});

describe('R4단계 retrieve: 링크 한 단계 (0003 resolveLink 필요)', () => {
  const b = bundle({
    'policies/a.md': doc('Policy', '반품 기한 규칙. [예외](b.md) [환불](../processes/r.md) [없음](missing.md) [밖](../../x.md)'),
    'policies/b.md': doc('Policy', '예외 규칙. [더 먼 곳](c.md) [되돌아감](./a.md)'),
    'policies/c.md': doc('Policy', '두 단계 떨어진 개념.'),
    'processes/r.md': doc('Process', '환불 일정.'),
  });
  test('키워드로 고른 개념의 링크를 한 단계만 따라간다 (c.md까지 가지 않는다)', () => {
    assert.deepEqual(picks(b, '반품 기한'), ['k:policies/a.md', 'l:policies/b.md', 'l:processes/r.md']);
  });
  test('링크로 추가한 개념에는 출발 개념을 기록한다', () => {
    const p = retrieve(b, '반품 기한').picks[1];
    assert.deepEqual(p, { path: 'policies/b.md', via: 'link', score: 0, matched: [], from: 'policies/a.md' });
  });
  test('없는 대상과 번들 밖 링크는 경고로 남기고 계속한다', () => {
    const { warnings } = retrieve(b, '반품 기한');
    assert.equal(warnings.length, 2);
    assert.ok(warnings.some((w) => w.includes('missing.md')));
    assert.ok(warnings.some((w) => w.includes('../../x.md')));
  });
  test('이미 고른 개념은 다시 넣지 않는다 (경로를 정규화해서 비교)', () => {
    assert.deepEqual(picks(b, '반품 기한 예외 규칙'), ['k:policies/a.md', 'k:policies/b.md', 'l:processes/r.md']);
  });
  test('maxDocs에 걸리면 추가하지 않고 경고를 남긴다', () => {
    const r = retrieve(b, '반품 기한', { maxDocs: 2 });
    assert.deepEqual(r.picks.map((p) => p.path), ['policies/a.md', 'policies/b.md']);
    assert.ok(r.warnings.some((w) => w.includes('processes/r.md')));
  });
  test('followLinks: false면 링크를 따라가지 않는다', () => {
    assert.deepEqual(picks(b, '반품 기한', { followLinks: false }), ['k:policies/a.md']);
  });
});

describe('R5단계 실제 번들과 학습 계획의 질문 6개', () => {
  // 기본 설정(body+meta, 링크 on, max 3, min 2)에서 이 알고리즘이 내는 결과다.
  // "정답"이 아니라 현재 동작의 기록이다. 맞는지 틀리는지는 레슨에서 직접 판단한다.
  const cases: [string, string[]][] = [
    ['물건을 받은 지 5일 됐어요. 반품 신청할 수 있나요?', ['k:policies/returns.md', 'k:processes/refunds.md', 'l:policies/return-exceptions.md']],
    ['8일이 지난 할인 상품도 반품할 수 있나요?', ['k:policies/return-exceptions.md', 'k:policies/returns.md', 'l:processes/refunds.md']],
    ['할인 상품인데 주문할 때 최종 판매로 표시됐어요.', ['k:policies/return-exceptions.md', 'k:policies/returns.md', 'l:processes/refunds.md']],
    ['반품이 승인됐는데 언제 환불되나요?', ['k:policies/returns.md', 'k:processes/refunds.md', 'l:policies/return-exceptions.md']],
    ['할인 상품을 반품할 수 있나요? 환불은 언제 들어오나요?', ['k:policies/returns.md', 'k:policies/return-exceptions.md', 'k:processes/refunds.md']],
    ['해외 주문 반품 배송비는 누가 부담하나요?', ['k:policies/return-exceptions.md', 'l:policies/returns.md']],
  ];
  for (const [q, expected] of cases) {
    test(q, async () => {
      assert.deepEqual(picks(await loadBundle('knowledge'), q), expected);
    });
  }
});
