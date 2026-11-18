// 사용법: pnpm prompt "질문" [retrieve와 같은 옵션]
// 검색 결과로 모델에 붙여 넣을 프롬프트를 출력한다. pbcopy로 바로 복사: pnpm -s prompt "질문" | pbcopy
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { DEFAULT_OPTIONS, retrieve } from './src/okf/retrieve.ts';
import { buildPrompt } from './src/okf/answer.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    fields: { type: 'string', default: DEFAULT_OPTIONS.fields },
    'no-links': { type: 'boolean', default: false },
    max: { type: 'string', default: String(DEFAULT_OPTIONS.maxDocs) },
    min: { type: 'string', default: String(DEFAULT_OPTIONS.minScore) },
    dir: { type: 'string', default: 'knowledge' },
  },
});
const question = positionals.join(' ');
if (!question) {
  console.error('질문을 입력하세요: pnpm prompt "할인 상품을 반품할 수 있나요?"');
  process.exit(2);
}
const bundle = await loadBundle(values.dir);
const { picks } = retrieve(bundle, question, {
  fields: values.fields === 'body' ? 'body' : 'body+meta',
  followLinks: !values['no-links'],
  maxDocs: Number(values.max),
  minScore: Number(values.min),
});
console.log(buildPrompt(bundle, question, picks));
