// 웹 화면의 실행 목록 store (web/src/features/qa/runs.ts). 생성기 seam에 가짜를 넣어 수명주기를 검사한다.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createQaRuns, isRunning, type QaInput, type RunBundle, type RunPhase } from '../web/src/features/qa/runs.ts';
import { DEFAULT_OPTIONS } from '../src/okf/retrieve.ts';
import { GenerationFailure, MISSING_KEY_ERROR } from '../shared/claude/protocol.ts';
import type { Generate, GenerateParams, GenerationResult } from '../shared/claude/types.ts';

const source: RunBundle = {
  bundle: new Map([
    ['policies/returns.md', '---\ntype: Policy\ntitle: 반품 정책\n---\n\n# 반품 조건\n\n반품은 수령 후 7일 이내에 신청한다.\n'],
    ['processes/refunds.md', '---\ntype: Process\ntitle: 환불 절차\n---\n\n# 환불 일정\n\n환불은 승인 후 3~5일 걸린다.\n'],
  ]),
  voice: { path: 'docs/voice.md', text: '밝고 편안한 말투를 쓴다.' },
};

const input = (question = '반품 조건이 궁금해요', patch: Partial<QaInput> = {}): QaInput => ({
  bundleId: 'knowledge',
  question,
  retrieval: DEFAULT_OPTIONS,
  voiceEnabled: true,
  generation: { model: 'claude-opus-5-5', effort: 'low' },
  ...patch,
});

const result = (text: string, patch: Partial<GenerationResult> = {}): GenerationResult => ({
  text,
  stopReason: 'end_turn',
  servedModel: 'claude-opus-5-5',
  fallbackUsed: false,
  usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
  refusal: null,
  ...patch,
});

// 조각을 흘려보내고 결과를 돌려주는 가짜
const scripted = (deltas: string[], final: GenerationResult): Generate => async ({ onText }) => {
  for (const delta of deltas) onText(delta);
  return final;
};

// 끊길 때까지 기다리는 가짜. 끊기면 DOMException이 아닌 일반 Error로 reject한다.
function hanging() {
  const calls: GenerateParams[] = [];
  const generate: Generate = (params) => {
    calls.push(params);
    return new Promise((_, reject) => params.signal.addEventListener('abort', () => reject(new Error('끊김'))));
  };
  return { calls, generate };
}

function setup(generate: Generate) {
  let now = 1000;
  let id = 0;
  const store = createQaRuns({ generate, clock: () => (now += 10), newId: () => `r${++id}` });
  const phases: RunPhase[][] = [];
  store.subscribe(() => phases.push(store.getRuns().map((run) => run.phase)));
  return { store, phases };
}

describe('createQaRuns', () => {
  test('streaming → done: 조각을 쌓고, 끝나면 인용을 검사한다', async () => {
    const answer = '7일 이내에 신청하세요. [policies/returns.md]';
    const { store, phases } = setup(scripted(['7일 이내에 ', '신청하세요.'], result(answer)));

    const done = store.start(source, input());
    const streaming = store.getRuns()[0];
    assert.equal(streaming.phase, 'streaming');
    assert.equal(isRunning(streaming), true);
    assert.equal(streaming.text, '7일 이내에 신청하세요.');

    await done;
    const [run] = store.getRuns();
    assert.equal(run.phase, 'done');
    assert.equal(run.text, answer);
    assert.deepEqual(run.check?.cited, ['policies/returns.md']);
    assert.deepEqual(run.check?.unknownCitations, []);
    assert.ok(run.finishedAt! > run.startedAt);
    assert.equal(isRunning(run), false);
    assert.deepEqual(phases.at(-1), ['done']);
  });

  test('생성기에 모델 요청과 생성 설정을 넘기고, 미리보기도 같은 요청으로 만든다', async () => {
    const { calls, generate } = hanging();
    const { store } = setup(generate);
    store.start(source, input('반품 조건', { generation: { model: 'claude-haiku-5-5', effort: 'high' } }));
    const [run] = store.getRuns();
    assert.deepEqual(calls[0].request, run.prepared.assembled.request);
    assert.deepEqual(calls[0].settings, { model: 'claude-haiku-5-5', effort: 'high' });
    assert.equal(run.prepared.apiRequest?.model, 'claude-haiku-5-5');
    assert.equal(run.prepared.apiRequest?.system, run.prepared.assembled.request?.system);
    store.stop();
  });

  test('말투 설정을 끄면 system에 말투 설정이 없다', () => {
    const { generate } = hanging();
    const { store } = setup(generate);
    store.start(source, input('반품 조건'));
    store.start(source, input('반품 조건', { voiceEnabled: false }));
    const [on, off] = store.getRuns();
    assert.match(on.prepared.assembled.request!.system, /밝고 편안한/);
    assert.doesNotMatch(off.prepared.assembled.request!.system, /밝고 편안한/);
    store.stop();
  });

  test('거절된 답변은 인용 검사를 하지 않는다', async () => {
    const refused = result('', { stopReason: 'refusal', refusal: { category: 'cyber', explanation: null } });
    const { store } = setup(scripted([], refused));
    await store.start(source, input());
    const [run] = store.getRuns();
    assert.equal(run.phase, 'done');
    assert.equal(run.check, null);
    assert.equal(run.result?.refusal?.category, 'cyber');
  });

  test('고른 개념이 0개면 모델을 부르지 않고 skipped', async () => {
    const { calls, generate } = hanging();
    const { store } = setup(generate);
    await store.start(source, input('주차장 위치'));
    const [run] = store.getRuns();
    assert.equal(run.phase, 'skipped');
    assert.equal(run.prepared.assembled.request, null);
    assert.equal(run.prepared.apiRequest, null);
    assert.equal(run.finishedAt, run.startedAt);
    assert.equal(calls.length, 0);
  });

  test('dryRun이면 조립만 하고 assembled', async () => {
    const { calls, generate } = hanging();
    const { store } = setup(generate);
    await store.start(source, input(), { dryRun: true });
    const [run] = store.getRuns();
    assert.equal(run.phase, 'assembled');
    assert.ok(run.prepared.apiRequest);
    assert.equal(calls.length, 0);
  });

  test('stop()이면 생성기가 일반 Error로 끝나도 stopped', async () => {
    const { calls, generate } = hanging();
    const { store } = setup(generate);
    const done = store.start(source, input());
    store.stop();
    await done;
    const [run] = store.getRuns();
    assert.equal(calls[0].signal.aborted, true);
    assert.equal(run.phase, 'stopped');
    assert.equal(run.error, null);
    assert.ok(run.finishedAt);
  });

  test('진행 중에 새로 시작하면 앞 실행은 stopped, 새 실행만 이어진다', async () => {
    const { calls, generate } = hanging();
    const { store } = setup(generate);
    const first = store.start(source, input('반품 조건'));
    store.start(source, input('환불 일정'));
    await first;
    const [a, b] = store.getRuns();
    assert.equal(a.phase, 'stopped');
    assert.equal(b.phase, 'streaming');
    assert.equal(calls[0].signal.aborted, true);
    assert.equal(calls[1].signal.aborted, false);
    store.stop();
  });

  test('서버가 알려 준 실패는 그대로, 그 밖의 실패는 network', async () => {
    const { store } = setup(async () => { throw new GenerationFailure(MISSING_KEY_ERROR); });
    await store.start(source, input());
    assert.equal(store.getRuns()[0].phase, 'error');
    assert.deepEqual(store.getRuns()[0].error, MISSING_KEY_ERROR);

    const other = setup(async () => { throw new TypeError('fetch failed'); });
    await other.store.start(source, input());
    assert.equal(other.store.getRuns()[0].error?.kind, 'network');
  });

  test('생성기가 동기로 throw해도 error로 끝난다', async () => {
    const { store } = setup(() => { throw new Error('동기 실패'); });
    await store.start(source, input());
    assert.equal(store.getRuns()[0].phase, 'error');
  });

  test('reset()은 목록을 비우고, 늦게 온 이벤트는 무시한다', async () => {
    let late!: (delta: string) => void;
    let finish!: () => void;
    const { store } = setup(({ onText }) => {
      late = onText;
      return new Promise((resolve) => { finish = () => resolve(result('늦은 답')); });
    });
    const done = store.start(source, input());
    store.reset();
    assert.deepEqual(store.getRuns(), []);
    late('늦은 조각');
    finish();
    await done;
    assert.deepEqual(store.getRuns(), []);
  });

  test('getRuns는 바뀔 때만 새 배열을 돌려주고, 구독을 끊으면 알리지 않는다', async () => {
    const { store } = setup(scripted([], result('답 [policies/returns.md]')));
    const before = store.getRuns();
    assert.equal(store.getRuns(), before);
    let notified = 0;
    const unsubscribe = store.subscribe(() => notified++);
    await store.start(source, input());
    assert.notEqual(store.getRuns(), before);
    assert.ok(notified > 0);
    unsubscribe();
    const seen = notified;
    store.reset();
    assert.equal(notified, seen);
  });
});
