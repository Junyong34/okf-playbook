// 사용법: pnpm check-answer "질문" answers/q5.txt [retrieve와 같은 옵션]
// 같은 질문으로 검색을 다시 돌려 "모델에 준 문서"를 구하고, 저장한 답변의 인용을 검사한다.
// 사실 확인(인용한 파일에 정말 그 내용이 있는가)은 사람이 파일을 열어 한다.
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { DEFAULT_OPTIONS, retrieve } from './src/okf/retrieve.ts';
import { checkAnswer } from './src/okf/answer.ts';

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
const [question, file] = positionals;
if (!question || !file) {
  console.error('사용법: pnpm check-answer "질문" answers/q5.txt');
  process.exit(2);
}
const { picks } = retrieve(await loadBundle(values.dir), question, {
  fields: values.fields === 'body' ? 'body' : 'body+meta',
  followLinks: !values['no-links'],
  maxDocs: Number(values.max),
  minScore: Number(values.min),
});
const provided = picks.map((p) => p.path);
const r = checkAnswer(await readFile(file, 'utf8'), provided);

console.log(`모델에 준 문서: ${provided.join(', ') || '(없음)'}`);
console.log(`인용한 문서:   ${r.cited.join(', ') || '(없음)'}`);
console.log(`근거 없음 선언: ${r.noEvidence ? '있음' : '없음'}`);
for (const c of r.unknownCitations) console.log(`ERROR 주지 않은 문서를 인용했다: ${c}`);
for (const s of r.uncitedSentences) console.log(`WARN  인용 없는 문장: ${s}`);
console.log('\n다음 단계: 인용한 파일을 열어 각 문장의 내용이 실제로 있는지 직접 확인한다.');
process.exitCode = r.unknownCitations.length > 0 ? 1 : 0;
