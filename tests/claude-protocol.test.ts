// 서버·브라우저 생성 이벤트 프로토콜 (shared/claude/protocol.ts)
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeEvent,
  GenerationFailure,
  isGenerateInput,
  MISSING_KEY_ERROR,
  readGeneration,
  toClientError,
} from '../shared/claude/protocol.ts';
import type { GenerationEvent, GenerationResult } from '../shared/claude/types.ts';

const result: GenerationResult = {
  text: '가능합니다. [policies/returns.md]',
  stopReason: 'end_turn',
  servedModel: 'claude-opus-5-5',
  fallbackUsed: false,
  usage: { input: 10, output: 5, cacheRead: 0, cacheWrite: 0 },
  refusal: null,
};

async function* chunks(...parts: string[]): AsyncGenerator<string> {
  for (const part of parts) yield part;
}

// 인코딩한 문자열을 size 글자씩 잘라 청크로 만든다 (줄 경계가 청크 중간에 걸리게).
function split(events: GenerationEvent[], size: number): string[] {
  const wire = events.map(encodeEvent).join('');
  const parts: string[] = [];
  for (let i = 0; i < wire.length; i += size) parts.push(wire.slice(i, i + size));
  return parts;
}

describe('readGeneration', () => {
  const events: GenerationEvent[] = [
    { type: 'text', delta: '가능' },
    { type: 'text', delta: '합니다.' },
    { type: 'result', result },
  ];

  for (const size of [1, 3, 7, 1000]) {
    test(`인코딩 → 디코딩 왕복 (청크 ${size}글자)`, async () => {
      const deltas: string[] = [];
      const got = await readGeneration(chunks(...split(events, size)), (d) => deltas.push(d));
      assert.deepEqual(got, result);
      assert.deepEqual(deltas, ['가능', '합니다.']);
    });
  }

  test('error 이벤트면 GenerationFailure에 서버가 준 오류를 담는다', async () => {
    const wire = split([{ type: 'text', delta: '가' }, { type: 'error', error: MISSING_KEY_ERROR }], 5);
    await assert.rejects(readGeneration(chunks(...wire), () => {}), (error) => {
      assert.ok(error instanceof GenerationFailure);
      assert.deepEqual(error.detail, MISSING_KEY_ERROR);
      return true;
    });
  });

  test('result 없이 끝나면 실패한다', async () => {
    await assert.rejects(readGeneration(chunks(encodeEvent({ type: 'text', delta: '가' })), () => {}), /최종 결과/);
  });

  test('마지막 줄이 줄바꿈 없이 끝나면 결과로 치지 않는다', async () => {
    const wire = encodeEvent({ type: 'result', result }).trimEnd();
    await assert.rejects(readGeneration(chunks(wire), () => {}), /최종 결과/);
  });

  test('빈 줄은 건너뛴다', async () => {
    const got = await readGeneration(chunks('\n', encodeEvent({ type: 'result', result })), () => {});
    assert.deepEqual(got, result);
  });

  test('result 뒤의 내용은 읽지 않는다', async () => {
    let pulled = 0;
    async function* counted() {
      pulled++;
      yield encodeEvent({ type: 'result', result });
      pulled++;
      yield encodeEvent({ type: 'text', delta: '늦은 조각' });
    }
    await readGeneration(counted(), () => assert.fail('result 뒤 text를 전달함'));
    assert.equal(pulled, 1);
  });
});

describe('isGenerateInput', () => {
  const valid = {
    request: { system: '지시문', messages: [{ role: 'user', content: '질문' }] },
    settings: { model: 'claude-opus-5-5', effort: 'low' },
  };

  test('올바른 요청', () => assert.equal(isGenerateInput(valid), true));
  test('본문이 없으면 거부', () => assert.equal(isGenerateInput(undefined), false));
  test('메시지가 둘이면 거부', () => {
    const messages = [...valid.request.messages, { role: 'user', content: '또' }];
    assert.equal(isGenerateInput({ ...valid, request: { ...valid.request, messages } }), false);
  });
  test('assistant 메시지는 거부', () => {
    const messages = [{ role: 'assistant', content: '답' }];
    assert.equal(isGenerateInput({ ...valid, request: { ...valid.request, messages } }), false);
  });
  test('모르는 모델은 거부', () => {
    assert.equal(isGenerateInput({ ...valid, settings: { model: 'gpt', effort: 'low' } }), false);
  });
  test('모르는 effort는 거부', () => {
    assert.equal(isGenerateInput({ ...valid, settings: { model: 'claude-opus-5-5', effort: 'max' } }), false);
  });
});

describe('toClientError', () => {
  test('서버가 알려 준 실패는 그대로', () => {
    assert.deepEqual(toClientError(new GenerationFailure(MISSING_KEY_ERROR)), MISSING_KEY_ERROR);
  });
  test('그 밖의 오류는 network', () => {
    assert.equal(toClientError(new TypeError('fetch failed')).kind, 'network');
  });
});
