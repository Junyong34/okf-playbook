// 사용법: pnpm check-answer "질문" answers/q5.txt [--prompt answers/q5.prompt.txt] [retrieve와 같은 옵션]
// --prompt: 저장해 둔 프롬프트에서 "모델에 준 문서"를 읽는다. 없으면 같은 질문으로 검색을 다시 돌려 구한다
//           (그 사이 번들이나 설정이 바뀌었으면 실제로 준 문서와 다를 수 있다).
// 사실 확인(인용한 파일에 정말 그 내용이 있는가)은 사람이 파일을 열어 한다.
import { readFile } from 'node:fs/promises';
import { loadBundle } from './src/okf/load.ts';
import { searchArgsOrExit } from './src/okf/args.ts';
import { ask } from './src/okf/ask.ts';
import { checkAnswer, providedPaths } from './src/okf/answer.ts';

const usage = 'pnpm check-answer "질문" answers/q5.txt [--prompt answers/q5.prompt.txt]';
const { options, dir, now, positionals, extra } = searchArgsOrExit(process.argv.slice(2), usage, { extra: { prompt: { type: 'string' } } });
const [question, file] = positionals;
if (!question || !file) {
  console.error(`사용법: ${usage}`);
  process.exit(2);
}
const promptFile = extra.prompt as string | undefined;
const provided = promptFile
  ? providedPaths(await readFile(promptFile, 'utf8'))
  : ask(await loadBundle(dir), question, options, now).picks.map((p) => p.path);
const r = checkAnswer(await readFile(file, 'utf8'), provided);

console.log(`모델에 준 문서: ${provided.join(', ') || '(없음)'}  (${promptFile ? `${promptFile}에서 읽음` : '검색을 다시 돌려 구함'})`);
console.log(`인용한 문서:   ${r.cited.join(', ') || '(없음)'}`);
console.log(`근거 없음 선언: ${r.noEvidence ? '있음' : '없음'}`);
for (const c of r.unknownCitations) console.log(`ERROR 주지 않은 문서를 인용했다: ${c}`);
for (const s of r.uncitedSentences) console.log(`WARN  인용 없는 문장: ${s}`);
console.log('\n다음 단계: 인용한 파일을 열어 각 문장의 내용이 실제로 있는지 직접 확인한다.');
process.exitCode = r.unknownCitations.length > 0 ? 1 : 0;
