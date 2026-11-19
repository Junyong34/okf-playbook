// 웹 화면의 모델 요청 조립 (src/okf/request.ts). 스펙: .scratch/okf-web-ui/spec.md "처리 흐름"
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildModelRequest, formatToday, MODEL_INSTRUCTION, type AssemblyStep } from '../src/okf/request.ts';
import { checkAnswer } from '../src/okf/answer.ts';
import type { Pick } from '../src/okf/retrieve.ts';
import type { Bundle } from '../src/okf/types.ts';

const bundle: Bundle = new Map([
  ['policies/returns.md', '---\ntype: Policy\ntitle: 반품 정책\n---\n\n# 반품 조건\n\n수령 후 7일 이내.\n'],
  ['processes/refunds.md', '---\ntype: Process\n---\n\n# 환불 일정\n\n승인 후 3~5일.\n'],
]);
const keyword = (path: string): Pick => ({ path, via: 'keyword', score: 3, matched: ['반품'] });
const link = (path: string, from: string): Pick => ({ path, via: 'link', score: 0, matched: [], from });
const voice = { path: 'docs/voc-answer-guide.md', text: '# 말투\n\n밝고 편안한 말투를 쓴다.\n' };
const NOW = new Date('2026-11-18T16:30:00Z'); // 한국 시각으로는 11월 19일 01:30
const stepOf = <K extends AssemblyStep['kind']>(steps: AssemblyStep[], kind: K) =>
  steps.find((s): s is Extract<AssemblyStep, { kind: K }> => s.kind === kind);

describe('formatToday', () => {
  test('기본 시간대(Asia/Seoul) 기준 YYYY-MM-DD', () => {
    assert.equal(formatToday(NOW), '2026-11-19');
  });
  test('시간대를 바꾸면 날짜가 바뀔 수 있다', () => {
    assert.equal(formatToday(NOW, 'UTC'), '2026-11-18');
  });
});

describe('buildModelRequest', () => {
  test('system은 지시문 + 말투 설정, user는 날짜 + 문서 + 질문', () => {
    const { request } = buildModelRequest(bundle, '반품되나요?', [keyword('policies/returns.md')], { voice, now: NOW });
    assert.ok(request);
    assert.ok(request.system.startsWith(MODEL_INSTRUCTION));
    assert.match(request.system, /<voice_guide path="docs\/voc-answer-guide\.md">\n# 말투/);
    const user = request.messages[0].content;
    assert.equal(request.messages[0].role, 'user');
    assert.ok(user.startsWith('<today>2026-11-19</today>'));
    assert.ok(user.indexOf('<documents>') < user.indexOf('<question>반품되나요?</question>'));
  });

  test('질문이 바뀌어도 system은 같다 (프롬프트 캐시)', () => {
    const a = buildModelRequest(bundle, '반품되나요?', [keyword('policies/returns.md')], { voice, now: NOW });
    const b = buildModelRequest(bundle, '환불 언제?', [keyword('processes/refunds.md')], { voice, now: NOW });
    assert.equal(a.request!.system, b.request!.system);
  });

  test('말투 설정을 끄면 system은 지시문뿐이고 조립 기록의 voice는 null', () => {
    const { request, record } = buildModelRequest(bundle, 'q', [keyword('policies/returns.md')], { voice: null, now: NOW });
    assert.equal(request!.system, MODEL_INSTRUCTION);
    assert.equal(stepOf(record.steps, 'voice')!.guide, null);
  });

  test('고른 순서대로 본문만 넣고 frontmatter는 뺀다', () => {
    const picks = [keyword('processes/refunds.md'), link('policies/returns.md', 'processes/refunds.md')];
    const { request, record } = buildModelRequest(bundle, 'q', picks, { now: NOW });
    const user = request!.messages[0].content;
    assert.ok(user.indexOf('<document path="processes/refunds.md">') < user.indexOf('<document path="policies/returns.md">'));
    assert.ok(!user.includes('type: Policy'));
    assert.deepEqual(record.providedPaths, ['processes/refunds.md', 'policies/returns.md']);
    const docs = stepOf(record.steps, 'documents')!.documents;
    assert.deepEqual(docs.map((d) => d.title), ['processes/refunds.md', '반품 정책']); // title이 없으면 경로
    assert.equal(docs[1].pick.from, 'processes/refunds.md');
    assert.ok(docs.every((d) => d.frontmatterRemoved && d.bodyChars > 0));
  });

  test('고른 개념이 없으면 모델 요청을 만들지 않는다', () => {
    const { request, record } = buildModelRequest(bundle, '해외 배송?', [], { voice, now: NOW });
    assert.equal(request, null);
    assert.deepEqual(record.providedPaths, []);
    assert.deepEqual(record.steps.map((s) => s.kind), ['question', 'skipped']);
  });

  test('조립 기록은 질문 → 문서 → 지시문 → 말투 → 날짜 → 요청 순서', () => {
    const { request, record } = buildModelRequest(bundle, 'q', [keyword('policies/returns.md')], { voice, now: NOW });
    assert.deepEqual(record.steps.map((s) => s.kind), ['question', 'documents', 'instruction', 'voice', 'today', 'request']);
    const sizes = stepOf(record.steps, 'request')!;
    assert.equal(sizes.systemChars, request!.system.length);
    assert.equal(sizes.userChars, request!.messages[0].content.length);
  });

  test('조립 기록의 providedPaths로 인용 검사를 한다', () => {
    const { record } = buildModelRequest(bundle, 'q', [keyword('policies/returns.md')], { now: NOW });
    const check = checkAnswer('불편을 드려 죄송합니다. 7일 이내 가능합니다. [policies/returns.md] [processes/refunds.md]', record.providedPaths);
    assert.deepEqual(check.unknownCitations, ['processes/refunds.md']);
    assert.deepEqual(check.uncitedSentences, ['불편을 드려 죄송합니다.']);
  });
});
