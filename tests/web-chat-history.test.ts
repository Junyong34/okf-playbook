// 상담 대화 기록(web/src/features/chat/history.ts·session.ts·dayLabel.ts)과 번들별 store 모음(qa/registry.ts).
// 저장소는 Map으로 만든 가짜, 생성기는 runs.ts 테스트처럼 가짜를 넣는다.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HISTORY_KEY, HISTORY_LIMIT, HISTORY_VERSION, loadHistory, saveHistory,
  type ChatTurn, type HistoryStorage,
} from '../web/src/features/chat/history.ts';
import { createChatSession } from '../web/src/features/chat/session.ts';
import { dayLabel } from '../web/src/features/chat/dayLabel.ts';
import { createRegistry } from '../web/src/features/qa/registry.ts';
import { createQaRuns, type QaInput, type RunBundle } from '../web/src/features/qa/runs.ts';
import { DEFAULT_OPTIONS } from '../src/okf/retrieve.ts';
import type { Generate, GenerationResult } from '../shared/claude/types.ts';

const source: RunBundle = {
  bundle: new Map([
    ['policies/returns.md', '---\ntype: Policy\ntitle: 반품 정책\n---\n\n# 반품 조건\n\n반품은 수령 후 7일 이내에 신청한다.\n'],
  ]),
  voice: null,
};

const input = (question = '반품 조건이 궁금해요'): QaInput => ({
  bundleId: 'knowledge',
  question,
  retrieval: DEFAULT_OPTIONS,
  voiceEnabled: false,
  generation: { model: 'claude-opus-5-5', effort: 'low' },
});

const result = (text: string): GenerationResult => ({
  text,
  stopReason: 'end_turn',
  servedModel: 'claude-opus-5-5',
  fallbackUsed: false,
  usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0 },
  refusal: null,
});

function fakeStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  const writes: string[] = [];
  const storage: HistoryStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => { writes.push(value); items.set(key, value); },
    removeItem: (key) => { items.delete(key); },
  };
  return { storage, items, writes };
}

const turn = (id: string, patch: Partial<ChatTurn> = {}): ChatTurn => ({
  id,
  question: `질문 ${id}`,
  phase: 'done',
  text: `답변 ${id} [policies/returns.md]`,
  refusal: null,
  error: null,
  startedAt: 1000,
  finishedAt: 2000,
  providedPaths: ['policies/returns.md'],
  ...patch,
});

describe('loadHistory·saveHistory', () => {
  test('저장한 기록을 그대로 다시 읽는다', () => {
    const { storage } = fakeStorage();
    const turns = [turn('a'), turn('b', { phase: 'error', error: { kind: 'network', title: '연결 실패', message: '...', retryable: true } })];
    saveHistory(storage, 'knowledge', turns);
    assert.deepEqual(loadHistory(storage, 'knowledge'), turns);
  });

  test('번들마다 따로 저장하고, 한 번들을 비워도 다른 번들은 남는다', () => {
    const { storage, items } = fakeStorage();
    saveHistory(storage, 'knowledge', [turn('a')]);
    saveHistory(storage, 'mart', [turn('m')]);
    assert.deepEqual(loadHistory(storage, 'knowledge').map((t) => t.id), ['a']);
    assert.deepEqual(loadHistory(storage, 'mart').map((t) => t.id), ['m']);

    saveHistory(storage, 'knowledge', []);
    assert.deepEqual(loadHistory(storage, 'knowledge'), []);
    assert.deepEqual(loadHistory(storage, 'mart').map((t) => t.id), ['m']);

    saveHistory(storage, 'mart', []);
    assert.equal(items.has(HISTORY_KEY), false);
  });

  test(`번들마다 최근 ${HISTORY_LIMIT}개만 남긴다`, () => {
    const { storage } = fakeStorage();
    const turns = Array.from({ length: HISTORY_LIMIT + 5 }, (_, i) => turn(`t${i}`));
    saveHistory(storage, 'knowledge', turns);
    const loaded = loadHistory(storage, 'knowledge');
    assert.equal(loaded.length, HISTORY_LIMIT);
    assert.equal(loaded[0].id, 't5');
    assert.equal(loaded.at(-1)!.id, `t${HISTORY_LIMIT + 4}`);
  });

  test('생성 도중 저장된 실행은 stopped로 복원한다', () => {
    const { storage } = fakeStorage();
    saveHistory(storage, 'knowledge', [turn('s', { phase: 'streaming', text: '', finishedAt: null })]);
    const [restored] = loadHistory(storage, 'knowledge');
    assert.equal(restored.phase, 'stopped');
    assert.equal(restored.finishedAt, restored.startedAt);
  });

  test('버전이 다르거나 깨진 JSON이면 빈 기록으로 시작한다', () => {
    for (const raw of ['{', 'null', JSON.stringify({ version: HISTORY_VERSION + 1, bundles: { knowledge: [turn('a')] } })]) {
      const { storage } = fakeStorage({ [HISTORY_KEY]: raw });
      assert.deepEqual(loadHistory(storage, 'knowledge'), [], raw);
    }
  });

  test('모양이 틀린 항목은 버린다', () => {
    const { storage } = fakeStorage({
      [HISTORY_KEY]: JSON.stringify({ version: HISTORY_VERSION, bundles: { knowledge: [turn('a'), { id: 1 }, null] } }),
    });
    assert.deepEqual(loadHistory(storage, 'knowledge').map((t) => t.id), ['a']);
  });

  test('저장에 실패해도 던지지 않는다', () => {
    const storage: HistoryStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => {},
    };
    assert.doesNotThrow(() => saveHistory(storage, 'knowledge', [turn('a')]));
  });
});

describe('createChatSession', () => {
  const setup = (generate: Generate, storage = fakeStorage()) => {
    let now = 1000;
    let id = 0;
    const runs = createQaRuns({ generate, clock: () => (now += 10), newId: () => `r${++id}` });
    return { ...storage, session: createChatSession({ runs, storage: storage.storage, bundleId: 'knowledge' }) };
  };

  test('복원한 기록 뒤에 새 실행을 붙이고, 끝난 실행을 저장한다', async () => {
    const stored = fakeStorage();
    saveHistory(stored.storage, 'knowledge', [turn('old')]);
    const { session, storage } = setup(async () => result('7일 이내 [policies/returns.md]'), stored);
    assert.deepEqual(session.getTurns().map((t) => t.id), ['old']);

    await session.start(source, input());
    assert.deepEqual(session.getTurns().map((t) => `${t.id}:${t.phase}`), ['old:done', 'r1:done']);
    assert.deepEqual(session.getTurns()[1].providedPaths, ['policies/returns.md']);
    assert.deepEqual(loadHistory(storage, 'knowledge').map((t) => `${t.id}:${t.phase}`), ['old:done', 'r1:done']);
  });

  test('스트리밍 조각마다 저장하지 않는다: 시작할 때와 끝날 때만 쓴다', async () => {
    const { session, writes } = setup(async ({ onText }) => {
      for (const delta of ['7일', ' 이내', ' [policies/returns.md]']) onText(delta);
      return result('7일 이내 [policies/returns.md]');
    });
    await session.start(source, input());
    assert.equal(writes.length, 2);
    assert.match(writes[0], /"phase":"streaming"/);
    assert.match(writes[1], /"phase":"done"/);
  });

  test('clear는 복원 기록과 실행을 모두 지우고 저장소도 비운다', async () => {
    const stored = fakeStorage();
    saveHistory(stored.storage, 'knowledge', [turn('old')]);
    const { session, items } = setup(async () => result('답'), stored);
    await session.start(source, input());

    let notified = 0;
    session.subscribe(() => notified++);
    session.clear();
    assert.deepEqual(session.getTurns(), []);
    assert.ok(notified > 0);
    assert.equal(items.has(HISTORY_KEY), false);
  });

  test('복원 기록만 있을 때도 clear가 지운다', () => {
    const stored = fakeStorage();
    saveHistory(stored.storage, 'knowledge', [turn('old')]);
    const { session, items } = setup(async () => result('답'), stored);
    session.clear();
    assert.deepEqual(session.getTurns(), []);
    assert.equal(items.has(HISTORY_KEY), false);
  });

  test('toChatTurn은 문서 본문 없이 화면에 필요한 것만 남긴다', async () => {
    const { session } = setup(async () => result('답'));
    await session.start(source, input());
    const [saved] = session.getTurns();
    assert.deepEqual(Object.keys(saved).sort(), Object.keys(turn('x')).sort());
  });
});

describe('createRegistry', () => {
  test('같은 번들이면 같은 store, 다른 번들이면 다른 store를 돌려준다', () => {
    let made = 0;
    const registry = createRegistry((bundleId) => ({ bundleId, n: ++made }));
    const a = registry.get('knowledge');
    assert.equal(registry.get('knowledge'), a);
    assert.notEqual(registry.get('mart'), a);
    assert.equal(made, 2);
  });

  test('번들을 오가도 진행 중인 생성이 멈추지 않는다', async () => {
    let finish!: (r: GenerationResult) => void;
    const registry = createRegistry(() => createQaRuns({ generate: () => new Promise((resolve) => { finish = resolve; }) }));
    const done = registry.get('knowledge').start(source, input());
    registry.get('mart'); // 다른 번들로 이동
    finish(result('답'));
    await done;
    assert.equal(registry.get('knowledge').getRuns()[0].phase, 'done');
  });
});

describe('dayLabel', () => {
  const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
  test('오늘·어제·날짜·다른 해', () => {
    const now = at(2026, 11, 20, 9);
    assert.equal(dayLabel(at(2026, 11, 20, 1), now), '오늘');
    assert.equal(dayLabel(at(2026, 11, 19, 23), now), '어제');
    assert.equal(dayLabel(at(2026, 11, 18), now), '11월 18일');
    assert.equal(dayLabel(at(2025, 12, 31), now), '2025년 12월 31일');
  });
});

