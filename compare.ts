// 사용법: pnpm compare [--max N] [--min N] [--dir knowledge]
// 질문 목록(src/okf/compare.ts QUESTIONS)을 세 설정으로 검색해 evaluation.md에 붙일 표를 출력한다.
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { DEFAULT_OPTIONS } from './src/okf/retrieve.ts';
import { compare, QUESTIONS, settings, summarize, toMarkdown } from './src/okf/compare.ts';

const { values } = parseArgs({
  options: {
    max: { type: 'string', default: String(DEFAULT_OPTIONS.maxDocs) },
    min: { type: 'string', default: String(DEFAULT_OPTIONS.minScore) },
    dir: { type: 'string', default: 'knowledge' },
  },
});
const maxDocs = Number(values.max);
const minScore = Number(values.min);

const rows = compare(await loadBundle(values.dir), QUESTIONS, settings(maxDocs, minScore));
console.log(`설정 공통: max=${maxDocs} min=${minScore}\n`);
console.log(toMarkdown(rows));
console.log('');
console.log(summarize(rows));
