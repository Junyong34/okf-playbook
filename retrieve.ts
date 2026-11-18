// 사용법: pnpm retrieve "질문" [--fields body|body+meta] [--no-links] [--max N] [--min N] [--dir knowledge]
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { DEFAULT_OPTIONS, retrieve } from './src/okf/retrieve.ts';

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
  console.error('질문을 입력하세요: pnpm retrieve "할인 상품을 반품할 수 있나요?"');
  process.exit(2);
}
if (values.fields !== 'body' && values.fields !== 'body+meta') {
  console.error('--fields는 body 또는 body+meta');
  process.exit(2);
}
const options = {
  fields: values.fields,
  followLinks: !values['no-links'],
  maxDocs: Number(values.max),
  minScore: Number(values.min),
} as const;

const { picks, warnings } = retrieve(await loadBundle(values.dir), question, options);
console.log(`질문: ${question}`);
console.log(`설정: fields=${options.fields} links=${options.followLinks ? 'on' : 'off'} max=${options.maxDocs} min=${options.minScore}\n`);
if (picks.length === 0) console.log('고른 개념 없음: 번들에서 근거를 찾지 못했다.');
for (const p of picks) {
  if (p.via === 'keyword') console.log(`[키워드] ${p.path}  점수 ${p.score}  일치: ${p.matched.join(', ')}`);
  else console.log(`[링크]   ${p.path}  ← ${p.from}의 링크`);
}
for (const w of warnings) console.log(`WARN ${w}`);
