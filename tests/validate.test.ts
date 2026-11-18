// 3회차 피드백 루프: `pnpm test`가 모두 통과하면 src/okf/validate.ts 구현이 끝난 것이다.
// 단계별로 보려면: node --test --test-name-pattern="1단계" tests/
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { extractLinks, resolveLink, splitFrontmatter, validateBundle } from '../src/okf/validate.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
// 이슈를 "level rule file" 한 줄로 줄여 비교한다. 메시지 문구는 자유.
const summary = (b: Bundle) => validateBundle(b).map((i) => `${i.level} ${i.rule} ${i.file}`);

const POLICY = '---\ntype: Policy\n---\n\n# 본문\n';
const ROOT_INDEX = '---\nokf_version: "0.2"\n---\n\n# 목차\n\n- [반품 정책](policies/returns.md) - 설명\n';

describe('1단계 splitFrontmatter (§4)', () => {
  test('맨 위 --- 사이를 frontmatter로, 나머지를 본문으로 나눈다', () => {
    assert.deepEqual(splitFrontmatter('---\ntype: Policy\n---\n\n# 제목'), { frontmatter: 'type: Policy', body: '\n# 제목' });
  });
  test('첫 줄이 ---가 아니면 frontmatter는 null', () => {
    assert.equal(splitFrontmatter('# 제목\n---\ntype: x\n---').frontmatter, null);
  });
  test('닫는 ---가 없으면 frontmatter는 null', () => {
    assert.equal(splitFrontmatter('---\ntype: Policy\n# 제목').frontmatter, null);
  });
  test('Windows 줄바꿈(CRLF)도 처리한다', () => {
    assert.equal(splitFrontmatter('---\r\ntype: Policy\r\n---\r\n본문').frontmatter, 'type: Policy');
  });
});

describe('2단계 resolveLink (§6.1) — 레슨 0002 경로 연습과 같은 문제', () => {
  const cases: [string, string, string | null][] = [
    ['policies/returns.md', 'return-exceptions.md', 'policies/return-exceptions.md'],
    ['processes/refunds.md', '/policies/returns.md', 'policies/returns.md'],
    ['policies/returns.md', '../processes/refunds.md', 'processes/refunds.md'],
    ['processes/refunds.md', '../../faq.md', null],
    ['index.md', 'processes/refunds.md', 'processes/refunds.md'],
    ['policies/return-exceptions.md', './returns.md', 'policies/returns.md'],
    ['processes/refunds.md', '../policies/../processes/refunds.md', 'processes/refunds.md'],
  ];
  for (const [from, link, expected] of cases) {
    test(`${from} 안의 ${link} → ${expected ?? '번들 밖(null)'}`, () => {
      assert.equal(resolveLink(from, link), expected);
    });
  }
});

describe('3단계 extractLinks', () => {
  test('번들 안 링크만 뽑고 #앵커는 떼어 낸다', () => {
    assert.deepEqual(extractLinks('[a](x.md) [b](../y.md#제목) [c](/z.md)'), ['x.md', '../y.md', '/z.md']);
  });
  test('외부 URL, mailto, 문서 안 앵커, 이미지는 제외한다', () => {
    assert.deepEqual(extractLinks('[웹](https://example.com) [메일](mailto:a@b.c) [위](#top) ![그림](a.png)'), []);
  });
});

describe('4단계 명세 오류 (§11) — level: error', () => {
  test('frontmatter가 없는 개념 → yaml-parse', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '# 제목만 있음' })), ['error yaml-parse policies/a.md']);
  });
  test('콜론 뒤 공백이 없는 YAML → yaml-parse', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '---\ntype: Policy\ntags:[반품]\n---\n' })), ['error yaml-parse policies/a.md']);
  });
  test('탭 들여쓰기 → yaml-parse', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '---\ntype: Policy\ntags:\n\t- 반품\n---\n' })), ['error yaml-parse policies/a.md']);
  });
  test('type 키 없음 → missing-type', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '---\ntitle: 반품\n---\n' })), ['error missing-type policies/a.md']);
  });
  test('type 값이 비었거나 공백뿐 → missing-type', () => {
    assert.deepEqual(summary(bundle({ 'a.md': '---\ntype:\n---\n', 'b.md': '---\ntype: "  "\n---\n' })), ['error missing-type a.md', 'error missing-type b.md']);
  });
  test('하위 index.md에 frontmatter → index-frontmatter', () => {
    assert.deepEqual(summary(bundle({ 'policies/index.md': '---\nokf_version: "0.2"\n---\n# 정책\n' })), ['error index-frontmatter policies/index.md']);
  });
  test('루트 index.md에 okf_version 말고 다른 키 → index-frontmatter', () => {
    assert.deepEqual(summary(bundle({ 'index.md': '---\nokf_version: "0.2"\ntitle: 목차\n---\n# 목차\n' })), ['error index-frontmatter index.md']);
  });
});

describe('5단계 거부하면 안 되는 것 (§11) — 오류 없음 또는 warning', () => {
  test('type만 있는 개념, 모르는 type, 추가 키는 통과', () => {
    assert.deepEqual(summary(bundle({ 'a.md': POLICY, 'b.md': '---\ntype: 아무거나\nowner: cs-team\n---\n' })), []);
  });
  test('frontmatter 없는 index.md는 개념으로 검사하지 않는다', () => {
    assert.deepEqual(summary(bundle({ 'policies/index.md': '# 정책\n\n- [a](a.md) - 설명\n', 'policies/a.md': POLICY })), []);
  });
  test('끊어진 링크 → warning broken-link', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': POLICY + '[배송](shipping.md)' })), ['warning broken-link policies/a.md']);
  });
  test('번들 밖 링크 → warning link-outside-bundle', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': POLICY + '[FAQ](../../faq.md)' })), ['warning link-outside-bundle policies/a.md']);
  });
  test('디렉터리 링크는 그 디렉터리의 index.md로 확인한다', () => {
    assert.deepEqual(summary(bundle({ 'a.md': POLICY + '[정책](policies/)', 'policies/index.md': '# 정책\n' })), []);
  });
  test('외부 링크는 검사하지 않는다', () => {
    assert.deepEqual(summary(bundle({ 'a.md': POLICY + '[명세](https://github.com/x/SPEC.md)' })), []);
  });
});

describe('6단계 팀 규칙 — 번들 안 링크는 상대 경로만', () => {
  test('대상이 있어도 /로 시작하면 warning team/relative-links', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': POLICY + '[b](/policies/b.md)', 'policies/b.md': POLICY })), ['warning team/relative-links policies/a.md']);
  });
  test('/로 시작하고 대상도 없으면 경고 두 개', () => {
    assert.deepEqual(summary(bundle({ 'a.md': POLICY + '[x](/x.md)' })), ['warning team/relative-links a.md', 'warning broken-link a.md']);
  });
});

describe('7단계 실제 번들', () => {
  test('knowledge/는 오류도 경고도 없다', async () => {
    assert.deepEqual(summary(await loadBundle('knowledge')), []);
  });
  test('루트 index.md와 개념 3개, 0007의 원문 개념이 모두 있다', async () => {
    const b = await loadBundle('knowledge');
    assert.deepEqual([...b.keys()].sort(), [
      'index.md',
      'policies/return-exceptions.md',
      'policies/returns.md',
      'processes/refunds.md',
      'references/returns-faq.md',
    ]);
    assert.deepEqual(summary(bundle({ 'index.md': ROOT_INDEX, 'policies/returns.md': POLICY })), []);
  });
});
