// 8회차 피드백 루프: `pnpm test`의 trust 부분이 모두 통과하면 src/okf/trust.ts 구현이 끝난 것이다.
// 단계별로: node --test --test-name-pattern="T1단계" "tests/**/*.test.ts"
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from '../src/okf/load.ts';
import { readConcepts } from '../src/okf/retrieve.ts';
import { assess, dateText, normalizeVerified, readFrontmatter, trustTier } from '../src/okf/trust.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle = (files: Record<string, string>): Bundle => new Map(Object.entries(files));
const fmOf = (yaml: string) => readFrontmatter(bundle({ 'a.md': `---\n${yaml}\n---\n\n본문\n` }), 'a.md')!;
const NOW = new Date('2026-11-18T00:00:00Z');

describe('T0단계 제공 함수 확인 (이미 통과)', () => {
  test('readFrontmatter: 따옴표 없는 ISO 시각도 문자열로 읽힌다 (yaml 기본 스키마)', () => {
    const fm = fmOf('type: Policy\nstale_after: 2026-09-23T00:00:00Z');
    assert.equal(fm.stale_after, '2026-09-23T00:00:00Z');
  });
  test('readFrontmatter: 파싱할 수 없으면 null', () => {
    assert.equal(readFrontmatter(bundle({ 'a.md': '---\ntype: [\n---\n' }), 'a.md'), null);
    assert.equal(readFrontmatter(bundle({}), 'a.md'), null);
  });
  test('dateText: Date는 ISO 문자열로', () => {
    assert.equal(dateText(new Date('2026-06-25T09:00:00Z')), '2026-06-25T09:00:00.000Z');
    assert.equal(dateText(undefined), undefined);
  });
});

describe('T1단계 normalizeVerified', () => {
  test('키가 없으면 빈 목록', () => {
    assert.deepEqual(normalizeVerified(undefined), []);
    assert.deepEqual(normalizeVerified(null), []);
  });
  test('대시 없는 매핑 하나는 원소 하나짜리 목록 (§5.2 MUST)', () => {
    const fm = fmOf('type: Policy\nverified: { by: human:ahormati, at: 2026-06-25T09:00:00Z }');
    assert.deepEqual(normalizeVerified(fm.verified), [{ by: 'human:ahormati', at: '2026-06-25T09:00:00Z' }]);
  });
  test('목록은 원소마다 읽는다', () => {
    const fm = fmOf([
      'type: Policy',
      'verified:',
      '  - { by: human:ahormati, at: 2026-06-25T09:00:00Z }',
      '  - { by: process:finance-nightly, at: 2026-06-26T02:00:00Z }',
    ].join('\n'));
    assert.deepEqual(normalizeVerified(fm.verified), [
      { by: 'human:ahormati', at: '2026-06-25T09:00:00Z' },
      { by: 'process:finance-nightly', at: '2026-06-26T02:00:00Z' },
    ]);
  });
  test('by가 없거나 매핑이 아닌 원소는 건너뛰고, at이 없으면 at 키를 두지 않는다', () => {
    const fm = fmOf('type: Policy\nverified:\n  - { at: 2026-06-25T09:00:00Z }\n  - human:kim\n  - { by: human:lee }');
    assert.deepEqual(normalizeVerified(fm.verified), [{ by: 'human:lee' }]);
  });
  test('Date로 들어온 at은 ISO 문자열로', () => {
    assert.deepEqual(normalizeVerified({ by: 'human:lee', at: new Date('2026-06-25T09:00:00Z') }), [
      { by: 'human:lee', at: '2026-06-25T09:00:00.000Z' },
    ]);
  });
});

describe('T2단계 trustTier', () => {
  test('검토 기록이 없으면 unverified', () => {
    assert.equal(trustTier([]), 'unverified');
  });
  test('에이전트·프로세스만 있으면 machine-confirmed', () => {
    assert.equal(trustTier([{ by: 'process:finance-nightly' }, { by: 'claude-code/opus-5-5' }]), 'machine-confirmed');
  });
  test('human: 기록이 하나라도 있으면 human-reviewed', () => {
    assert.equal(trustTier([{ by: 'process:finance-nightly' }, { by: 'human:ahormati' }]), 'human-reviewed');
  });
  test('사람 이름처럼 보여도 human: 접두사가 없으면 사람 검토가 아니다 (§7)', () => {
    assert.equal(trustTier([{ by: 'ahormati' }, { by: 'humans:team' }]), 'machine-confirmed');
  });
});

describe('T3단계 assess', () => {
  test('신뢰 필드가 하나도 없어도 판정한다: unverified, stable, 낡지 않음, 주의 없음 (§11 거부 금지)', () => {
    assert.deepEqual(assess(fmOf('type: Policy'), NOW), { tier: 'unverified', status: 'stable', stale: false, cautions: [] });
  });
  test('latestVerifiedAt은 목록 순서가 아니라 가장 늦은 시각', () => {
    const fm = fmOf([
      'type: Policy',
      'verified:',
      '  - { by: process:nightly, at: 2026-11-01T02:00:00Z }',
      '  - { by: human:kim, at: 2026-06-25T09:00:00Z }',
    ].join('\n'));
    const a = assess(fm, NOW);
    assert.equal(a.tier, 'human-reviewed');
    assert.equal(a.latestVerifiedAt, '2026-11-01T02:00:00Z');
  });
  test('draft·deprecated는 같은 이름의 주의, 모르는 status는 unknown-status', () => {
    assert.deepEqual(assess(fmOf('type: Policy\nstatus: draft'), NOW).cautions, ['draft']);
    assert.deepEqual(assess(fmOf('type: Policy\nstatus: deprecated'), NOW).cautions, ['deprecated']);
    const a = assess(fmOf('type: Policy\nstatus: archived'), NOW);
    assert.equal(a.status, 'archived');
    assert.deepEqual(a.cautions, ['unknown-status']);
  });
  test('stale_after가 지났으면 stale, 아직이면 아니다', () => {
    const past = assess(fmOf('type: Policy\nstale_after: 2026-10-01T00:00:00Z'), NOW);
    assert.equal(past.stale, true);
    assert.equal(past.staleAfter, '2026-10-01T00:00:00Z');
    assert.deepEqual(past.cautions, ['stale']);
    const future = assess(fmOf('type: Policy\nstale_after: 2026-12-31T00:00:00Z'), NOW);
    assert.equal(future.stale, false);
    assert.deepEqual(future.cautions, []);
  });
  test('stale_after와 같은 시각이면 이미 낡았다 (§5.5 on/after)', () => {
    assert.equal(assess(fmOf('type: Policy\nstale_after: 2026-11-18T00:00:00Z'), NOW).stale, true);
  });
  test('날짜로 읽을 수 없는 stale_after는 bad-date, stale은 false', () => {
    const a = assess(fmOf('type: Policy\nstale_after: 다음 분기'), NOW);
    assert.equal(a.stale, false);
    assert.deepEqual(a.cautions, ['bad-date']);
  });
  test('주의 순서: status → stale_after', () => {
    const a = assess(fmOf('type: Policy\nstatus: deprecated\nstale_after: 2026-01-01T00:00:00Z'), NOW);
    assert.deepEqual(a.cautions, ['deprecated', 'stale']);
  });
});

describe('T4단계 실제 번들', () => {
  test('모든 개념을 판정할 수 있고, 2026-11-18 기준 낡았거나 deprecated인 개념이 없다', async () => {
    const b = await loadBundle('knowledge');
    for (const c of readConcepts(b)) {
      const a = assess(readFrontmatter(b, c.path)!, NOW);
      assert.equal(a.stale, false, c.path);
      assert.notEqual(a.status, 'deprecated', c.path);
    }
  });
});
