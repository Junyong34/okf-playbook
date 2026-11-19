// 개념 읽기 모듈: 파일 하나를 한 번 나누고 파싱한 결과와, 그 결과를 소비자가 같은 규칙으로 읽는지.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readBundle, readConcepts, readFile } from '../src/okf/concept.ts';
import { readProvenance } from '../src/okf/provenance.ts';
import { readFrontmatter } from '../src/okf/trust.ts';
import { validateBundle } from '../src/okf/validate.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));

describe('readFile', () => {
  test('예약 파일 이름으로 kind를 정한다', () => {
    assert.deepEqual(['index.md', 'a/index.md', 'log.md', 'a/b.md'].map((p) => readFile(p, '').kind), ['index', 'index', 'log', 'concept']);
  });
  test('frontmatter 상태: absent · invalid · ok', () => {
    assert.deepEqual(readFile('a.md', '본문').frontmatter, { state: 'absent' });
    assert.deepEqual(readFile('a.md', '---\ntype: X\n').frontmatter, { state: 'absent' }); // 닫히지 않음
    assert.equal(readFile('a.md', '---\ntags:[x]\n---\n').frontmatter.state, 'invalid'); // 매핑이 아님
    assert.equal(readFile('a.md', '---\ntype:\tX\n  bad: : :\n---\n').frontmatter.state, 'invalid');
    assert.deepEqual(readFile('a.md', '---\ntype: X\n---\n본문').frontmatter, { state: 'ok', data: { type: 'X' } });
  });
  test('본문 링크를 한 번에 뽑아 둔다', () => {
    assert.deepEqual(readFile('a.md', '---\ntype: X\n---\n[b](b.md) [w](https://x.y)').links, ['b.md']);
  });
});

describe('readBundle · readConcepts', () => {
  const b = bundle({ 'z.md': '---\ntype: Z\n---\n', 'index.md': '# 목차', 'a.md': '---\ntype: A\nstatus: draft\n---\n' });
  test('경로순으로 읽는다', () => {
    assert.deepEqual(readBundle(b).map((f) => f.path), ['a.md', 'index.md', 'z.md']);
  });
  test('개념은 메타 필드 밖의 frontmatter도 담는다', () => {
    assert.deepEqual(readConcepts(b).map((c) => [c.path, c.frontmatter.status]), [['a.md', 'draft'], ['z.md', undefined]]);
  });
});

describe('파싱할 수 없는 개념을 소비자마다 정한 대로 다룬다', () => {
  const b = bundle({ 'bad.md': '---\ntags:[x]\n---\n본문[^s]' });
  test('validate는 오류, retrieve는 건너뜀, provenance는 출처 없음, trust는 null', () => {
    assert.deepEqual(validateBundle(b).map((i) => i.rule), ['yaml-parse']);
    assert.deepEqual(readConcepts(b), []);
    assert.deepEqual(readProvenance(b, 'bad.md')!.sources, []);
    assert.equal(readFrontmatter(b, 'bad.md'), null);
  });
});
