// 질의응답 모듈: 검색 → 신뢰·수명 판정 → 프롬프트. 인용 검사는 실제로 준 문서와 비교한다.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ask } from '../src/okf/ask.ts';
import { buildPrompt, providedPaths } from '../src/okf/answer.ts';
import { DEFAULT_OPTIONS } from '../src/okf/retrieve.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
const NOW = new Date('2026-11-18T00:00:00Z');
const b = bundle({
  'old.md': '---\ntype: Policy\nstatus: deprecated\n---\n할인 상품 반품 기한은 3일이다.',
  'new.md': '---\ntype: Policy\nstale_after: 2026-01-01\nverified: { by: human:jun, at: 2026-01-01 }\n---\n할인 상품 반품 기한은 7일이다.',
  'ok.md': '---\ntype: Policy\n---\n할인 상품 반품은 고객센터로 접수한다.',
});

describe('ask', () => {
  const r = ask(b, '할인 상품 반품', DEFAULT_OPTIONS, NOW);
  test('고른 개념마다 판정을 붙이고, 주의가 있어도 빼지 않는다', () => {
    assert.deepEqual(r.picks.map((p) => [p.path, p.assessment.cautions]), [
      ['new.md', ['stale']],
      ['ok.md', []],
      ['old.md', ['deprecated']],
    ]);
    assert.equal(r.picks[0].assessment.tier, 'human-reviewed');
  });
  test('프롬프트는 0005 buildPrompt 그대로다 (주의를 모델에 넘길지는 0008 5단계에서 정한다)', () => {
    assert.equal(r.prompt, buildPrompt(b, '할인 상품 반품', r.picks));
  });
  test('providedPaths는 프롬프트에서 모델에 준 문서를 순서대로 읽는다', () => {
    assert.deepEqual(providedPaths(r.prompt), r.picks.map((p) => p.path));
  });
});
