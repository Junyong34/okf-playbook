// 사용법: pnpm retrieve "질문" [--fields body|body+meta] [--no-links] [--max N] [--min N] [--dir knowledge] [--now ISO시각]
// --now: 낡음(stale_after) 판정에 쓸 현재 시각. 없으면 지금 (8회차).
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { DEFAULT_OPTIONS, retrieve } from './src/okf/retrieve.ts';
import { assess, formatAssessment, readFrontmatter } from './src/okf/trust.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    fields: { type: 'string', default: DEFAULT_OPTIONS.fields },
    'no-links': { type: 'boolean', default: false },
    max: { type: 'string', default: String(DEFAULT_OPTIONS.maxDocs) },
    min: { type: 'string', default: String(DEFAULT_OPTIONS.minScore) },
    dir: { type: 'string', default: 'knowledge' },
    now: { type: 'string' },
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

const now = values.now === undefined ? new Date() : new Date(values.now);
if (Number.isNaN(now.getTime())) {
  console.error('--now는 ISO 8601 시각: 2026-11-18T00:00:00Z');
  process.exit(2);
}
const bundle = await loadBundle(values.dir);
const { picks, warnings } = retrieve(bundle, question, options);

// 8회차: 고른 개념마다 신뢰 등급과 주의를 붙인다. 개념을 빼지는 않는다 (§5.3, §11).
// trust.ts가 아직 TODO이면 한 줄 안내만 하고 검색 결과는 그대로 보여 준다.
let trustTodo = false;
const trustLines = (path: string): string[] => {
  if (trustTodo) return [];
  try {
    return formatAssessment(assess(readFrontmatter(bundle, path) ?? {}, now));
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('TODO')) {
      trustTodo = true;
      return [];
    }
    throw e;
  }
};
console.log(`질문: ${question}`);
console.log(`설정: fields=${options.fields} links=${options.followLinks ? 'on' : 'off'} max=${options.maxDocs} min=${options.minScore} now=${now.toISOString()}\n`);
if (picks.length === 0) console.log('고른 개념 없음: 번들에서 근거를 찾지 못했다.');
for (const p of picks) {
  if (p.via === 'keyword') console.log(`[키워드] ${p.path}  점수 ${p.score}  일치: ${p.matched.join(', ')}`);
  else console.log(`[링크]   ${p.path}  ← ${p.from}의 링크`);
  for (const line of trustLines(p.path)) console.log(`         ${line}`);
}
if (trustTodo) console.log('(신뢰 표시 생략: src/okf/trust.ts가 아직 TODO다. 레슨 0008)');
for (const w of warnings) console.log(`WARN ${w}`);
