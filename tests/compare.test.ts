// 6회차 피드백 루프: `pnpm test`의 compare 부분이 모두 통과하면 src/okf/compare.ts 구현이 끝난 것이다.
// 단계별로: node --test --test-name-pattern="C1단계" "tests/**/*.test.ts"
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { compare, judge, QUESTIONS, settings } from '../src/okf/compare.ts';
import type { Pick } from '../src/okf/retrieve.ts';
import type { Bundle } from '../src/okf/types.ts';

const k = (path: string, score = 2): Pick => ({ path, via: 'keyword', score, matched: [] });
const l = (path: string, from: string): Pick => ({ path, via: 'link', score: 0, matched: [], from });

describe('C0단계 제공 값 확인 (이미 통과)', () => {
  test('질문 6개, 질문 6은 기대 근거가 없다', () => {
    assert.equal(QUESTIONS.length >= 6, true);
    assert.deepEqual(QUESTIONS[5].expected, []);
  });
  test('세 설정은 상한과 기준이 같고 fields·followLinks만 다르다', () => {
    const s = settings(2, 3);
    assert.deepEqual(s.map((x) => x.name), ['본문', '본문+분류', '본문+분류+링크']);
    assert.ok(s.every((x) => x.options.maxDocs === 2 && x.options.minScore === 3));
    assert.deepEqual(s.map((x) => [x.options.fields, x.options.followLinks]), [
      ['body', false],
      ['body+meta', false],
      ['body+meta', true],
    ]);
  });
});

describe('C1단계 judge', () => {
  test('모두 맞게 고르면 빠진 것도 불필요한 것도 없다', () => {
    assert.deepEqual(judge([k('a.md')], ['a.md']), { missing: [], extra: [], linkHelped: [] });
  });
  test('missing은 expected 순서, extra는 picks 순서를 따른다', () => {
    const r = judge([k('z.md'), k('a.md'), k('y.md')], ['b.md', 'a.md', 'c.md']);
    assert.deepEqual(r.missing, ['b.md', 'c.md']);
    assert.deepEqual(r.extra, ['z.md', 'y.md']);
  });
  test('링크로 들어온 기대 근거만 linkHelped에 든다', () => {
    const r = judge([k('a.md'), l('b.md', 'a.md'), l('c.md', 'a.md')], ['b.md']);
    assert.deepEqual(r.linkHelped, ['b.md']);
    assert.deepEqual(r.extra, ['a.md', 'c.md']);
  });
  test('키워드로 들어온 기대 근거는 linkHelped가 아니다', () => {
    assert.deepEqual(judge([k('b.md')], ['b.md']).linkHelped, []);
  });
  test('근거 없음 질문(expected 비어 있음)에서는 고른 개념이 모두 불필요하다', () => {
    assert.deepEqual(judge([k('a.md'), l('b.md', 'a.md')], []), { missing: [], extra: ['a.md', 'b.md'], linkHelped: [] });
    assert.deepEqual(judge([], []), { missing: [], extra: [], linkHelped: [] });
  });
});

describe('C2단계 compare', () => {
  // 본문에는 "기간"이 없고 description에만 있다. 링크는 a → b.
  const b: Bundle = new Map(
    Object.entries({
      'a.md': '---\ntype: Policy\n---\n\n반품 신청 안내. [환불](b.md)\n',
      'b.md': '---\ntype: Process\ndescription: 환불 기간\n---\n\n돈은 영업일 3~5일 뒤 들어온다.\n',
    }),
  );
  const qs = [
    { id: 'x1', text: '반품 신청', expected: ['a.md', 'b.md'] },
    { id: 'x2', text: '환불 기간', expected: ['b.md'] },
  ];
  const rows = () => compare(b, qs, settings(3, 2)); // 테스트마다 실행해야 TODO 실패가 테스트별로 보인다

  test('질문 순서가 바깥, 설정 순서가 안쪽이다', () => {
    assert.deepEqual(rows().map((r) => `${r.question.id}/${r.setting}`), [
      'x1/본문', 'x1/본문+분류', 'x1/본문+분류+링크',
      'x2/본문', 'x2/본문+분류', 'x2/본문+분류+링크',
    ]);
  });
  test('각 행은 retrieve 결과(picks)와 judge 판정을 담는다', () => {
    const r = rows()[2];
    assert.deepEqual(r.picks.map((p) => `${p.via[0]}:${p.path}`), ['k:a.md', 'l:b.md']);
    assert.deepEqual([r.missing, r.extra, r.linkHelped], [[], [], ['b.md']]);
  });
  test('본문만 보면 놓치고, 분류를 더하면 찾는 경우', () => {
    assert.deepEqual(rows()[3].missing, ['b.md']);
    assert.deepEqual(rows()[4].missing, []);
  });
  test('실제 번들(원문 개념을 더하기 전, 6회차): 질문 6개 × 설정 3개 = 18행', async () => {
    const all = await loadBundle('knowledge');
    const b6: Bundle = new Map([...all].filter(([path]) => !path.startsWith('references/')));
    const real = compare(b6, QUESTIONS.slice(0, 6), settings());
    assert.equal(real.length, 18);
    assert.deepEqual(real[17].extra, ['policies/return-exceptions.md', 'policies/returns.md']);
  });
});
