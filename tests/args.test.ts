// CLI 인자 → 검색 설정. 잘못된 값은 조용히 넘기지 않는다.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSearchArgs } from '../src/okf/args.ts';
import { DEFAULT_OPTIONS } from '../src/okf/retrieve.ts';

const ok = (argv: string[], config = {}) => {
  const r = parseSearchArgs(argv, config);
  assert.ok(r.ok, r.ok ? '' : r.error);
  return r.args;
};
const err = (argv: string[], config = {}) => {
  const r = parseSearchArgs(argv, config);
  assert.equal(r.ok, false);
  return r.ok ? '' : r.error;
};

describe('parseSearchArgs', () => {
  test('기본값은 DEFAULT_OPTIONS, 번들은 knowledge', () => {
    const a = ok(['질문', '하나']);
    assert.deepEqual(a.options, DEFAULT_OPTIONS);
    assert.equal(a.dir, 'knowledge');
    assert.deepEqual(a.positionals, ['질문', '하나']);
  });
  test('옵션을 검색 설정으로 바꾼다', () => {
    assert.deepEqual(ok(['--fields', 'body', '--no-links', '--max', '5', '--min', '0', 'q']).options, {
      fields: 'body', followLinks: false, maxDocs: 5, minScore: 0,
    });
  });
  test('상한·기준·fields·now가 잘못되면 오류', () => {
    assert.match(err(['--max', 'abc']), /--max/);
    assert.match(err(['--max', '0']), /--max/);
    assert.match(err(['--max', '2.5']), /--max/);
    assert.match(err(['--min', '-1']), /--min/);
    assert.match(err(['--fields', 'bdy']), /--fields/);
    assert.match(err(['--now', '어제']), /--now/);
  });
  test('알 수 없는 옵션은 오류', () => {
    assert.ok(err(['--maxx', '3']));
  });
  test('fixedSetting이면 --fields·--no-links를 받지 않는다', () => {
    assert.ok(err(['--fields', 'body'], { fixedSetting: true }));
    assert.deepEqual(ok(['--max', '4'], { fixedSetting: true }).options.maxDocs, 4);
  });
  test('extra 옵션 값을 돌려준다', () => {
    assert.equal(ok(['--prompt', 'p.txt'], { extra: { prompt: { type: 'string' } } }).extra.prompt, 'p.txt');
  });
});
