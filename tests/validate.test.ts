// 3회차 피드백 루프: `pnpm test`가 모두 통과하면 src/okf/validate.ts 구현이 끝난 것이다.
// 단계별로 보려면: node --test --test-name-pattern="1단계" tests/
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { extractLinks, resolveLink, splitFrontmatter, validateBundle } from '../src/okf/validate.ts';
import { readFile } from '../src/okf/concept.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
// 이슈를 "level rule file" 한 줄로 줄여 비교한다. 메시지 문구는 자유.
// 대부분의 사례는 루트 index.md 없이 파일 몇 개만 둔다. 그때마다 붙는 missing-root-index는 따로 시험하고 여기서는 뺀다.
const summary = (b: Bundle, options = {}) =>
  validateBundle(b, options).filter((i) => i.rule !== 'missing-root-index').map((i) => `${i.level} ${i.rule} ${i.file}`);

const POLICY = '---\ntype: Policy\n---\n\n# 본문\n';
const ROOT_INDEX = '---\nokf_version: "0.3"\n---\n\n# 목차\n\n- [반품 정책](policies/returns.md) - 설명\n';

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

describe('4단계 명세 오류 (§4, §11.1) — level: error', () => {
  test('콜론 뒤 공백이 없는 YAML → yaml-parse', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '---\ntype: Policy\ntags:[반품]\n---\n' })), ['error yaml-parse policies/a.md']);
  });
  test('탭 들여쓰기 → yaml-parse', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '---\ntype: Policy\ntags:\n\t- 반품\n---\n' })), ['error yaml-parse policies/a.md']);
  });
  test('여는 ---만 있고 닫는 ---가 없음 → yaml-parse', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '---\ntype: Policy\n# 제목\n' })), ['error yaml-parse policies/a.md']);
  });
  test('하위 index.md에 frontmatter → index-frontmatter', () => {
    assert.deepEqual(summary(bundle({ 'policies/index.md': '---\nokf_version: "0.3"\n---\n# 정책\n' })), ['error index-frontmatter policies/index.md']);
  });
  test('log.md에 frontmatter → log-frontmatter (§9)', () => {
    assert.deepEqual(summary(bundle({ 'log.md': '---\ntitle: 기록\n---\n# 기록\n', 'policies/log.md': '---\ntype: Log\n---\n' })), [
      'error log-frontmatter log.md',
      'error log-frontmatter policies/log.md',
    ]);
  });
});

describe('4단계 개념이 아닌 파일 (§3.2) — level: warning, 적합성에는 영향 없음', () => {
  test('frontmatter가 없는 .md → not-a-concept', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '# 제목만 있음', 'README.md': '# 안내' })), ['warning not-a-concept policies/a.md', 'warning not-a-concept README.md']);
  });
  test('type 키 없음 → not-a-concept', () => {
    assert.deepEqual(summary(bundle({ 'policies/a.md': '---\ntitle: 반품\n---\n' })), ['warning not-a-concept policies/a.md']);
  });
  test('type 값이 비었거나 공백뿐 → not-a-concept', () => {
    assert.deepEqual(summary(bundle({ 'a.md': '---\ntype:\n---\n', 'b.md': '---\ntype: "  "\n---\n' })), ['warning not-a-concept a.md', 'warning not-a-concept b.md']);
  });
  test('frontmatter 없는 log.md는 경고도 없다', () => {
    assert.deepEqual(summary(bundle({ 'log.md': '# 기록\n\n## 2026-11-19\n* **Update**: v0.3\n' })), []);
  });
});

describe('4단계 루트 index.md (§8.1)', () => {
  const idx = (fm: string) => bundle({ 'index.md': `---\n${fm}\n---\n# 목차\n` });
  test('okf_version·title·description·license와 확장 키를 둘 수 있다', () => {
    assert.deepEqual(summary(idx('okf_version: "0.3"\ntitle: 반품\ndescription: 반품 번들\nlicense: CC-BY-4.0\nx-acme-owner: cs')), []);
  });
  test('okf_version이 없으면 warning missing-okf-version', () => {
    assert.deepEqual(summary(idx('title: 반품')), ['warning missing-okf-version index.md']);
    assert.deepEqual(summary(bundle({ 'index.md': '# 목차\n' })), ['warning missing-okf-version index.md']);
  });
  test('따옴표 없는 숫자 okf_version → warning unquoted-version', () => {
    assert.deepEqual(summary(idx('okf_version: 0.3')), ['warning unquoted-version index.md']);
  });
  test('루트 index.md YAML 오류 → yaml-parse', () => {
    assert.deepEqual(summary(idx('okf_version: "0.3"\ntitle:[x]')), ['error yaml-parse index.md']);
  });
});

describe('4단계 시각·검토 기록 (§5, §11.2) — level: warning', () => {
  const c = (fm: string) => summary(bundle({ 'a.md': `---\ntype: Policy\n${fm}\n---\n` }));
  test('허용 형식의 시각은 통과 (오프셋 있는 date-time, 날짜만)', () => {
    assert.deepEqual(c('stale_after: 2026-12-31\ngenerated: { by: x/1, at: "2026-11-01T00:00:00+09:00" }\nverified: { by: "human:kim", at: 2026-11-02T00:00:00Z }'), []);
  });
  test('오프셋 없는 date-time·읽을 수 없는 값 → bad-timestamp', () => {
    assert.deepEqual(c('stale_after: 2026-12-31T00:00:00\ngenerated: { by: x/1, at: 어제 }'), ['warning bad-timestamp a.md', 'warning bad-timestamp a.md']);
  });
  test('by나 at이 없는 verified 항목 → incomplete-verified', () => {
    assert.deepEqual(c('verified:\n  - { by: "human:kim" }\n  - { at: 2026-11-02 }\n  - { by: "human:lee", at: "2026-11-02T09:00:00+09:00" }'), [
      'warning incomplete-verified a.md',
      'warning incomplete-verified a.md',
    ]);
  });
});

describe('5단계 거부하면 안 되는 것 (§11.2) — 오류 없음 또는 warning', () => {
  test('type만 있는 개념, 모르는 type, 추가 키는 통과 (x- 없는 확장 키는 정보만)', () => {
    assert.deepEqual(summary(bundle({ 'a.md': POLICY, 'b.md': '---\ntype: 아무거나\nowner: cs-team\nx-cs-owner: kim\n---\n' })), [
      'info unprefixed-extension-key b.md',
    ]);
  });
  test('frontmatter 없는 하위 index.md는 개념으로 검사하지 않는다', () => {
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

describe('8단계 공식 검증기에서 옮긴 규칙 (okf-generate validate.py)', () => {
  const c = (front: string, body = '') => summary(bundle({ 'a.md': `---\ntype: Policy\n${front}\n---\n${body}` }));
  test('루트 index.md가 없으면 missing-root-index', () => {
    assert.deepEqual(validateBundle(bundle({ 'a.md': POLICY })).map((i) => `${i.level} ${i.rule} ${i.file}`), ['warning missing-root-index .']);
  });
  test('license는 SPDX 표현식이거나 번들 안 파일', () => {
    const idx = (license: string, extra: Record<string, string> = {}) =>
      summary(bundle({ 'index.md': `---\nokf_version: "0.3"\nlicense: ${license}\n---\n`, ...extra }));
    assert.deepEqual(idx('CC-BY-4.0'), []);
    assert.deepEqual(idx('MIT OR Apache-2.0'), []);
    assert.deepEqual(idx('/LICENSE.txt', { 'LICENSE.txt': '' }), []);
    assert.deepEqual(idx('마음대로 쓰세요'), ['warning bad-license index.md']);
  });
  test('log.md 날짜 제목과 순서', () => {
    const log = '# 변경 기록\n\n## 2026-11-18\n\n* 갱신\n\n## 2026-11-19\n\n* 생성\n\n## 어제\n';
    assert.deepEqual(summary(bundle({ 'log.md': log })), ['error log-date-heading log.md', 'warning log-order log.md']);
  });
  test('문자열이어야 할 값이 숫자·불리언이면 unquoted-value', () => {
    assert.deepEqual(c('title: 2026\nstatus: true'), ['warning unquoted-value a.md', 'warning unquoted-value a.md', 'warning unknown-status a.md']);
  });
  test('스칼라 tags → tags-not-list', () => {
    assert.deepEqual(c('tags: 반품, 환불'), ['warning tags-not-list a.md']);
    assert.deepEqual(c('tags: [반품, 환불]'), []);
  });
  test('status 어휘와 superseded_by', () => {
    assert.deepEqual(c('status: retired'), ['warning unknown-status a.md']);
    assert.deepEqual(c('superseded_by: /b.md'), ['warning superseded-without-deprecated a.md', 'warning missing-path-target a.md']);
    assert.deepEqual(summary(bundle({ 'a.md': '---\ntype: P\nstatus: deprecated\nsuperseded_by: /b.md\n---\n', 'b.md': POLICY })), []);
  });
  test('행위자 형식 → bad-actor (§7)', () => {
    assert.deepEqual(c('verified: { by: human, at: "2026-11-18T15:00:00+09:00" }'), ['warning bad-actor a.md']);
    assert.deepEqual(c('verified:\n  - { by: "human:jun", at: "2026-11-18T15:00:00+09:00" }\n  - { by: "team:cs", at: "2026-11-18T16:00:00+09:00" }\n  - { by: "process:nightly", at: "2026-11-18T17:00:00+09:00" }'), []);
    assert.deepEqual(c('generated: { by: "claude-code/opus", at: "2026-11-18T15:00:00Z" }'), []);
    assert.deepEqual(c('generated: { by: 에이전트, at: "2026-11-18T15:00:00Z" }'), ['warning bad-actor a.md']);
  });
  test('generated 모양 → bad-generated', () => {
    assert.deepEqual(c('generated: 2026-11-18'), ['warning bad-generated a.md']);
    assert.deepEqual(c('generated: { at: "2026-11-18T15:00:00Z" }'), ['warning bad-generated a.md']);
  });
  test('generated.at·verified[].at이 날짜만이면 date-only-trust-time', () => {
    assert.deepEqual(c('generated: { by: "a/1", at: "2026-11-18" }\nverified: { by: "human:jun", at: "2026-11-18" }'), [
      'warning date-only-trust-time a.md',
      'warning date-only-trust-time a.md',
    ]);
  });
  test('모든 검토 기록이 generated.at보다 이르면 stale-verification (정보)', () => {
    const gen = 'generated: { by: "a/1", at: "2026-11-19T00:00:00Z" }\n';
    assert.deepEqual(c(gen + 'verified: { by: "human:jun", at: "2026-11-18T00:00:00Z" }'), ['info stale-verification a.md']);
    assert.deepEqual(c(gen + 'verified: { by: "human:jun", at: "2026-11-19T00:00:00Z" }'), []);
  });
  test('sources: resource 누락, id 중복, usage_count 기간, 시각', () => {
    assert.deepEqual(
      c('sources:\n  - { id: s, resource: "https://x.test" }\n  - { id: s, resource: "https://y.test", usage_count: 3, last_modified: 어제 }\n  - { id: t }'),
      ['warning duplicate-source-id a.md', 'warning bad-timestamp a.md', 'warning usage-count-window a.md', 'warning missing-source-resource a.md'],
    );
    assert.deepEqual(c('usage_window: { from: "2026-11-01" }\nsources: { id: s, resource: "https://x.test", usage_count: 3 }'), ['warning bad-usage-window a.md']);
  });
  test('본문 각주 라벨에 맞는 sources id가 없으면 unknown-footnote (코드 안은 보지 않는다)', () => {
    const body = '7일 이내.[^faq] 또 [^faq]\n\n`[^code]`\n\n```\n[^fence]\n```\n\n[^faq]: FAQ\n';
    assert.deepEqual(c('sources: { id: faq, resource: "https://x.test" }', body), []);
    assert.deepEqual(c('sources: { id: other, resource: "https://x.test" }', body), ['warning unknown-footnote a.md']);
  });
  test('경로 필드 대상 → missing-path-target, v0.2 대체 해석 → legacy-path', () => {
    const doc = (version: string) => ({
      'index.md': `---\nokf_version: "${version}"\n---\n`,
      'policies/a.md': '---\ntype: P\nsources: { id: f, resource: references/faq.md }\n---\n',
      'references/faq.md': POLICY,
    });
    assert.deepEqual(summary(bundle(doc('0.2'))), ['warning legacy-path policies/a.md']);
    assert.deepEqual(summary(bundle(doc('0.3'))), ['warning missing-path-target policies/a.md']);
    assert.deepEqual(summary(bundle({ ...doc('0.3'), 'policies/a.md': '---\ntype: P\nresource: /assets/rules.pdf\n---\n', 'assets/rules.pdf': '' })), []);
  });
  test('now를 주면 stale_after가 지난 개념을 stale-concept (정보)로 알린다', () => {
    const b = bundle({ 'a.md': '---\ntype: P\nstale_after: "2026-11-01"\n---\n' });
    assert.deepEqual(summary(b), []);
    assert.deepEqual(summary(b, { now: new Date('2026-11-19T00:00:00Z') }), ['info stale-concept a.md']);
  });
});

describe('7단계 실제 번들', () => {
  test('bundles/knowledge/는 오류도 경고도 없다', async () => {
    assert.deepEqual(summary(await loadBundle('bundles/knowledge')), []);
  });
  test('루트 index.md가 v0.3을 선언하고 title·description을 둔다 (§8.1)', async () => {
    const b = await loadBundle('bundles/knowledge');
    const fm = readFile('index.md', b.get('index.md')!).frontmatter;
    assert.equal(fm.state, 'ok');
    if (fm.state === 'ok') {
      assert.equal(fm.data.okf_version, '0.3');
      assert.ok(fm.data.title && fm.data.description);
    }
  });
  test('루트 index.md와 개념 3개, 0007의 원문 개념이 모두 있다', async () => {
    const b = await loadBundle('bundles/knowledge');
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
