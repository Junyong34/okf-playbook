// 개념 읽기 모듈: 파일 하나를 한 번 나누고 파싱한 결과와, 그 결과를 소비자가 같은 규칙으로 읽는지.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  allowsLegacyPaths, asList, bundleVersion, isBlank, parseTimestamp, pathFields, readBundle, readBundleFile, readConcepts, readFile, resolvePathField,
} from '../src/okf/concept.ts';
import { loadBundle } from '../src/okf/load.ts';
import { readProvenance } from '../src/okf/provenance.ts';
import { readFrontmatter } from '../src/okf/trust.ts';
import { validateBundle } from '../src/okf/validate.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));

describe('readFile', () => {
  test('예약 파일 이름으로 kind를 정한다. frontmatter가 있어도 예약 파일은 개념이 아니다 (§3.1)', () => {
    assert.deepEqual(['index.md', 'a/index.md', 'log.md'].map((p) => readFile(p, '---\ntype: X\n---\n').kind), ['index', 'index', 'log']);
  });
  test('type이 비어 있지 않아야 개념이다. 아니면 other (§3.2)', () => {
    assert.equal(readFile('a/b.md', '---\ntype: Policy\n---\n').kind, 'concept');
    assert.deepEqual(
      ['# README', '---\ntitle: x\n---\n', '---\ntype: "  "\n---\n', '---\ntype: [\n---\n'].map((t) => readFile('README.md', t).kind),
      ['other', 'other', 'other', 'other'],
    );
  });
  test('frontmatter 상태: absent · invalid · ok', () => {
    assert.deepEqual(readFile('a.md', '본문').frontmatter, { state: 'absent' });
    assert.equal(readFile('a.md', '---\ntype: X\n').frontmatter.state, 'invalid'); // 열었는데 닫히지 않음 (§4)
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
  test('type이 없는 파일은 개념이 아니라 건너뛴다 (§3.2)', () => {
    const b2 = bundle({ 'README.md': '# 안내', 'x.md': '---\ntitle: x\n---\n', 'a.md': '---\ntype: A\n---\n' });
    assert.deepEqual(readConcepts(b2).map((c) => c.path), ['a.md']);
  });
  test('스칼라 tags는 태그 하나, 쉼표로 나누지 않는다. 빈 값은 없는 것 (§11.2)', () => {
    const tags = (v: string) => readConcepts(bundle({ 'a.md': `---\ntype: A\ntags: ${v}\n---\n` }))[0].tags;
    assert.deepEqual(tags('sales, orders'), ['sales, orders']);
    assert.deepEqual(tags('[]'), []);
    assert.deepEqual(tags('""'), []);
    assert.deepEqual(tags('[a, b]'), ['a', 'b']);
  });
  test('개념은 메타 필드 밖의 frontmatter도 담는다', () => {
    assert.deepEqual(readConcepts(b).map((c) => [c.path, c.frontmatter.status]), [['a.md', 'draft'], ['z.md', undefined]]);
  });
});

describe('파싱할 수 없는 개념을 소비자마다 정한 대로 다룬다', () => {
  const b = bundle({ 'bad.md': '---\ntags:[x]\n---\n본문[^s]' });
  test('validate는 오류, retrieve는 건너뜀, provenance는 출처 없음, trust는 null', () => {
    assert.deepEqual(validateBundle(b).map((i) => i.rule).filter((r) => r !== 'missing-root-index'), ['yaml-parse']);
    assert.deepEqual(readConcepts(b), []);
    assert.deepEqual(readProvenance(b, 'bad.md')!.sources, []);
    assert.equal(readFrontmatter(b, 'bad.md'), null);
  });
});

describe('빈 값·단일 값 (§11.2)', () => {
  test('isBlank: null·빈 문자열·빈 목록은 없는 것', () => {
    assert.deepEqual([undefined, null, '', []].map(isBlank), [true, true, true, true]);
    assert.deepEqual([0, false, ' ', [1], {}].map(isBlank), [false, false, false, false, false]);
  });
  test('asList: 항목 하나는 원소 하나짜리 목록', () => {
    assert.deepEqual(asList(null), []);
    assert.deepEqual(asList({ by: 'x' }), [{ by: 'x' }]);
    assert.deepEqual(asList([1, 2]), [1, 2]);
  });
});

describe('parseTimestamp (§5)', () => {
  test('오프셋 있는 date-time과 날짜만(UTC 0시)을 읽는다', () => {
    assert.equal(parseTimestamp('2026-06-30T14:00:00Z'), Date.UTC(2026, 5, 30, 14));
    assert.equal(parseTimestamp('2026-11-18T15:00:00+09:00'), Date.UTC(2026, 10, 18, 6));
    assert.equal(parseTimestamp('2026-06-30T14:00:00.5z'), Date.UTC(2026, 5, 30, 14, 0, 0, 500));
    assert.equal(parseTimestamp('2026-06-30'), Date.UTC(2026, 5, 30));
  });
  test('YAML 고유 Date도 받는다', () => {
    assert.equal(parseTimestamp(new Date('2026-06-30T00:00:00Z')), Date.UTC(2026, 5, 30));
  });
  test('오프셋 없는 date-time과 그 밖 형식은 무효(null)', () => {
    for (const v of ['2026-06-30T14:00:00', '2026-06-30 14:00:00Z', '2026/06/30', '다음 분기', '2026-02-30', '2026-06-30T25:00:00Z', 20260630, null]) {
      assert.equal(parseTimestamp(v), null, String(v));
    }
  });
});

describe('번들 버전과 경로 필드 (§6.2, §8.1, §12.1)', () => {
  const index = (v: string) => `---\n${v}\n---\n# 목차\n`;
  test('bundleVersion: 루트 index.md의 okf_version. 없으면 null', () => {
    assert.equal(bundleVersion(bundle({ 'index.md': index('okf_version: "0.3"') })), '0.3');
    assert.equal(bundleVersion(bundle({ 'index.md': index('okf_version: 0.2') })), '0.2');
    assert.equal(bundleVersion(bundle({ 'index.md': '# 목차' })), null);
    assert.equal(bundleVersion(bundle({})), null);
  });
  test('allowsLegacyPaths: 0.2 이하이거나 선언이 없을 때만', () => {
    assert.equal(allowsLegacyPaths(bundle({})), true);
    assert.equal(allowsLegacyPaths(bundle({ 'index.md': index('okf_version: "0.1"') })), true);
    assert.equal(allowsLegacyPaths(bundle({ 'index.md': index('okf_version: "0.2"') })), true);
    assert.equal(allowsLegacyPaths(bundle({ 'index.md': index('okf_version: "0.3"') })), false);
    assert.equal(allowsLegacyPaths(bundle({ 'index.md': index('okf_version: "1.0"') })), false);
  });
  test('pathFields: 경로 필드를 순서대로, URL·범위 설명·빈 값은 뺀다', () => {
    const fm = {
      resource: 'tables/a.md',
      sources: { resource: '/references/faq.md' }, // 대시 없는 항목 하나
      superseded_by: '/policies/new.md',
      computation: '',
      executor: { resource: 'https://example.com/run' },
      attester: { resource: '/references/check.py' },
    };
    assert.deepEqual(pathFields(fm), [
      { field: 'resource', value: 'tables/a.md' },
      { field: 'sources[].resource', value: '/references/faq.md' },
      { field: 'superseded_by', value: '/policies/new.md' },
      { field: 'attester.resource', value: '/references/check.py' },
    ]);
    assert.deepEqual(pathFields({ sources: [{ resource: 'all tickets in queue' }] }), []);
  });
  const files = { 'policies/a.md': '---\ntype: P\n---\n', 'references/faq.md': '---\ntype: R\n---\n', 'policies/references/x.md': '---\ntype: R\n---\n' };
  test("resolvePathField: '/'는 번들 루트, 그 밖은 파일 디렉터리 기준 (§6)", () => {
    const b = bundle({ ...files, 'index.md': index('okf_version: "0.3"') });
    assert.deepEqual(resolvePathField(b, 'policies/a.md', '/references/faq.md'), { target: 'references/faq.md', legacy: false });
    assert.deepEqual(resolvePathField(b, 'policies/a.md', '../references/faq.md'), { target: 'references/faq.md', legacy: false });
    assert.deepEqual(resolvePathField(b, 'policies/a.md', 'references/x.md'), { target: 'policies/references/x.md', legacy: false });
    assert.deepEqual(resolvePathField(b, 'policies/a.md', '../../out.md'), { target: null, legacy: false });
  });
  test('v0.3 번들에서는 파일 기준으로 없으면 그대로 없다', () => {
    const b = bundle({ ...files, 'index.md': index('okf_version: "0.3"') });
    assert.deepEqual(resolvePathField(b, 'policies/a.md', 'references/faq.md'), { target: 'policies/references/faq.md', legacy: false });
  });
  test('v0.2 번들·선언 없는 번들은 번들 루트 기준으로 다시 찾는다 (legacy)', () => {
    for (const extra of [{ 'index.md': index('okf_version: "0.2"') }, {}] as Record<string, string>[]) {
      const b = bundle({ ...files, ...extra });
      assert.deepEqual(resolvePathField(b, 'policies/a.md', 'references/faq.md'), { target: 'references/faq.md', legacy: true });
      // 파일 기준으로 찾히면 대체 해석을 하지 않는다
      assert.deepEqual(resolvePathField(b, 'policies/a.md', 'references/x.md'), { target: 'policies/references/x.md', legacy: false });
      // 루트 기준으로도 없으면 파일 기준 결과를 그대로 준다
      assert.deepEqual(resolvePathField(b, 'policies/a.md', 'none.md'), { target: 'policies/none.md', legacy: false });
    }
  });
});

describe('loadBundle (§3.2-4)', () => {
  test("'.'으로 시작하는 파일·디렉터리는 번들이 아니다", async () => {
    const root = await mkdtemp(join(tmpdir(), 'okf-load-'));
    await mkdir(join(root, '.obsidian'), { recursive: true });
    await mkdir(join(root, 'policies', '.drafts'), { recursive: true });
    await writeFile(join(root, 'policies', 'a.md'), '---\ntype: P\n---\n');
    await writeFile(join(root, 'policies', '.hidden.md'), '---\ntype: P\n---\n');
    await writeFile(join(root, 'policies', '.drafts', 'b.md'), '---\ntype: P\n---\n');
    await writeFile(join(root, '.obsidian', 'c.md'), '---\ntype: P\n---\n');
    assert.deepEqual([...(await loadBundle(root)).keys()], ['policies/a.md']);
  });
  test('.md가 아닌 파일은 asset으로 경로만 담고, readBundle은 문서만 읽는다 (§3.2-3)', async () => {
    const root = await mkdtemp(join(tmpdir(), 'okf-asset-'));
    await mkdir(join(root, 'assets'), { recursive: true });
    await writeFile(join(root, 'a.md'), '---\ntype: P\n---\n');
    await writeFile(join(root, 'assets', 'rules.pdf'), '%PDF');
    const b = await loadBundle(root);
    assert.deepEqual([...b.keys()].sort(), ['a.md', 'assets/rules.pdf']);
    assert.equal(b.get('assets/rules.pdf'), '');
    assert.deepEqual(readBundle(b).map((f) => f.path), ['a.md']);
    assert.equal(readBundleFile(b, 'assets/rules.pdf'), null);
  });
});
