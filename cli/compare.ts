// 사용법: pnpm compare [--max N] [--min N] [--dir bundles/knowledge]
// 질문 목록(src/okf/compare.ts QUESTIONS)을 세 설정으로 검색해 evaluation.md에 붙일 표를 출력한다.
// fields·링크 확장은 세 설정이 정하므로 --fields·--no-links는 받지 않는다.
import { loadBundle } from '../src/okf/load.ts';
import { searchArgsOrExit } from '../src/okf/args.ts';
import { compare, QUESTIONS, settings, summarize, toMarkdown } from '../src/okf/compare.ts';

const { options, dir } = searchArgsOrExit(process.argv.slice(2), 'pnpm compare [--max N] [--min N] [--dir bundles/knowledge]', { fixedSetting: true });
const { maxDocs, minScore } = options;

const rows = compare(await loadBundle(dir), QUESTIONS, settings(maxDocs, minScore));
console.log(`설정 공통: max=${maxDocs} min=${minScore}\n`);
console.log(toMarkdown(rows));
console.log('');
console.log(summarize(rows));
