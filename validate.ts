// 사용법: pnpm validate [번들 디렉터리] [--now 시각]   (기본값 knowledge, 지금 시각)
// 공식 검증기와 같은 규칙을 TS로 검사한다. 대조할 때는 pnpm okf:validate [번들 디렉터리].
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { isMarkdown } from './src/okf/concept.ts';
import { validateBundle } from './src/okf/validate.ts';

const { values, positionals } = parseArgs({ allowPositionals: true, options: { now: { type: 'string' } } });
const root = positionals[0] ?? 'knowledge';
const now = values.now ? new Date(values.now) : new Date();
if (Number.isNaN(now.getTime())) {
  console.error(`--now를 시각으로 읽을 수 없습니다: ${values.now}`);
  process.exit(2);
}
const bundle = await loadBundle(root);
const issues = validateBundle(bundle, { now });

const TAG = { error: 'ERROR', warning: 'WARN ', info: 'INFO ' } as const;
for (const i of issues) console.log(`${TAG[i.level]} ${i.file}  [${i.rule}] ${i.message}`);
const count = (level: string) => issues.filter((i) => i.level === level).length;
const docs = [...bundle.keys()].filter(isMarkdown).length;
const assets = bundle.size - docs;
console.log(`\n${root}: 문서 ${docs}개${assets > 0 ? `, asset ${assets}개` : ''}, 오류 ${count('error')}개, 경고 ${count('warning')}개, 정보 ${count('info')}개`);
process.exitCode = count('error') > 0 ? 1 : 0;
