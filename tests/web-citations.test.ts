// 웹 화면의 인용 칩 준비 (web/src/features/qa/citations.ts)
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { citationSources, normalizeCitations } from '../web/src/features/qa/citations.ts';

describe('normalizeCitations', () => {
  test('경로 여러 개를 칩 하나씩으로 나눈다', () => {
    assert.equal(normalizeCitations('가능합니다. [policies/returns.md, processes/refunds.md]'), '가능합니다. [policies/returns.md][processes/refunds.md]');
  });
  test('앞의 /를 뗀다', () => {
    assert.equal(normalizeCitations('가능합니다. [/policies/returns.md]'), '가능합니다. [policies/returns.md]');
  });
  test('Markdown 링크 [글자](주소)는 건드리지 않는다', () => {
    assert.equal(normalizeCitations('[안내.md](https://example.com)'), '[안내.md](https://example.com)');
  });
  test('keepOnly를 주면 그 밖의 인용 표시를 지운다 (상담 화면)', () => {
    assert.equal(
      normalizeCitations('가능합니다. [policies/returns.md, policies/shipping.md]\n무료입니다. [policies/shipping.md]', { keepOnly: ['policies/returns.md'] }),
      '가능합니다. [policies/returns.md]\n무료입니다.',
    );
  });
  test('.md가 아닌 대괄호는 그대로 둔다', () => {
    assert.equal(normalizeCitations('[참고] 7일 이내'), '[참고] 7일 이내');
  });
});

describe('citationSources', () => {
  test('준 문서만 칩이 되고 제목이 없으면 경로', () => {
    const titles = new Map([['policies/returns.md', '반품 정책']]);
    assert.deepEqual(citationSources(['policies/returns.md', 'processes/refunds.md'], (p) => titles.get(p)), {
      'policies/returns.md': { title: '반품 정책' },
      'processes/refunds.md': { title: 'processes/refunds.md' },
    });
  });
});
