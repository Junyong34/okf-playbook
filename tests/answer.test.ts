// 5회차 피드백 루프: A단계 테스트가 모두 통과하면 src/okf/answer.ts 구현이 끝난 것이다.
// 단계별로: node --test --test-name-pattern="A1단계" "tests/**/*.test.ts"
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt, checkAnswer, extractCitations, INSTRUCTION, splitSentences } from '../src/okf/answer.ts';
import type { Pick } from '../src/okf/retrieve.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle: Bundle = new Map([
  ['policies/returns.md', '---\ntype: Policy\ntitle: 반품 정책\n---\n\n# 반품 조건\n\n수령 후 7일 이내.\n'],
  ['processes/refunds.md', '---\ntype: Process\n---\n\n# 환불 일정\n\n승인 후 3~5일.\n'],
]);
const pick = (path: string): Pick => ({ path, via: 'keyword', score: 2, matched: [] });

describe('A0단계 제공 함수 확인 (이미 통과)', () => {
  test('splitSentences: 마침표 뒤 인용은 그 문장에 붙는다', () => {
    assert.deepEqual(splitSentences('7일 이내입니다. [policies/returns.md] 3~5일 걸립니다.'), [
      '7일 이내입니다. [policies/returns.md]',
      '3~5일 걸립니다.',
    ]);
  });
  test('extractCitations: [a.md] 와 [a.md, b.md] 를 모두 읽는다', () => {
    assert.deepEqual(extractCitations('x [a/b.md] y [c.md, /d.md]'), ['a/b.md', 'c.md', 'd.md']);
  });
});

describe('A1단계 buildPrompt', () => {
  const prompt = () => buildPrompt(bundle, '반품 기한은?', [pick('policies/returns.md'), pick('processes/refunds.md')]);
  test('지시문(INSTRUCTION)으로 시작한다', () => {
    assert.ok(prompt().startsWith(INSTRUCTION));
  });
  test('고른 순서대로 <document path="..."> 블록을 넣는다', () => {
    const a = prompt().indexOf('<document path="policies/returns.md">');
    const b = prompt().indexOf('<document path="processes/refunds.md">');
    assert.ok(a > 0 && b > a);
  });
  test('본문만 넣고 frontmatter는 넣지 않는다', () => {
    assert.ok(prompt().includes('# 반품 조건\n\n수령 후 7일 이내.\n</document>'));
    assert.ok(!prompt().includes('type: Policy'));
  });
  test('<documents> 블록 다음에 <question>이 온다', () => {
    assert.ok(prompt().indexOf('</documents>') < prompt().indexOf('<question>반품 기한은?</question>'));
  });
  test('고른 문서가 없으면 빈 <documents>를 넣는다', () => {
    assert.ok(buildPrompt(bundle, 'x', []).includes('<documents>\n</documents>'));
  });
});

describe('A2단계 checkAnswer', () => {
  const provided = ['policies/returns.md', 'processes/refunds.md'];
  test('모든 문장에 준 문서가 인용되면 문제 없음', () => {
    const r = checkAnswer('7일 이내입니다. [policies/returns.md] 3~5일 걸립니다. [processes/refunds.md]', provided);
    assert.deepEqual(r, { cited: provided, unknownCitations: [], uncitedSentences: [], noEvidence: false });
  });
  test('주지 않은 문서를 인용하면 unknownCitations', () => {
    assert.deepEqual(checkAnswer('판매자가 냅니다. [policies/shipping.md]', provided).unknownCitations, ['policies/shipping.md']);
  });
  test('인용 없는 문장은 uncitedSentences', () => {
    assert.deepEqual(checkAnswer('7일 이내입니다. [policies/returns.md] 보통 무료입니다.', provided).uncitedSentences, ['보통 무료입니다.']);
  });
  test('"확인할 수 없" 문장은 인용이 없어도 괜찮고 noEvidence가 true', () => {
    const r = checkAnswer('해외 배송비는 번들에서 확인할 수 없습니다.', provided);
    assert.deepEqual(r.uncitedSentences, []);
    assert.equal(r.noEvidence, true);
  });
  test('cited는 중복 없이 처음 나온 순서', () => {
    assert.deepEqual(checkAnswer('a. [processes/refunds.md] b. [policies/returns.md][processes/refunds.md]', provided).cited, ['processes/refunds.md', 'policies/returns.md']);
  });
});
