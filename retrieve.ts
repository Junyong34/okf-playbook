// 사용법: pnpm retrieve "질문" [--fields body|body+meta] [--no-links] [--max N] [--min N] [--dir bundles/knowledge] [--now ISO시각]
// --now: 낡음(stale_after) 판정에 쓸 현재 시각. 없으면 지금 (8회차).
import { loadBundle } from './src/okf/load.ts';
import { searchArgsOrExit } from './src/okf/args.ts';
import { ask } from './src/okf/ask.ts';
import { formatAssessment } from './src/okf/trust.ts';

const { options, dir, now, positionals } = searchArgsOrExit(process.argv.slice(2), 'pnpm retrieve "할인 상품을 반품할 수 있나요?" [--fields body|body+meta] [--no-links] [--max N] [--min N] [--now ISO시각]');
const question = positionals.join(' ');
if (!question) {
  console.error('질문을 입력하세요: pnpm retrieve "할인 상품을 반품할 수 있나요?"');
  process.exit(2);
}
const r = ask(await loadBundle(dir), question, options, now);

console.log(`질문: ${question}`);
console.log(`설정: fields=${options.fields} links=${options.followLinks ? 'on' : 'off'} max=${options.maxDocs} min=${options.minScore} now=${now.toISOString()}\n`);
if (r.picks.length === 0) console.log('고른 개념 없음: 번들에서 근거를 찾지 못했다.');
// 8회차: 고른 개념마다 신뢰 등급과 주의를 붙인다. 개념을 빼지는 않는다 (§5.3, §11.2).
for (const p of r.picks) {
  if (p.via === 'keyword') console.log(`[키워드] ${p.path}  점수 ${p.score}  일치: ${p.matched.join(', ')}`);
  else console.log(`[링크]   ${p.path}  ← ${p.from}의 링크`);
  for (const line of formatAssessment(p.assessment)) console.log(`         ${line}`);
  // v0.3: deprecated 개념의 대체 개념을 번들 경로로 풀어 보여 준다 (§5.4).
  if (p.replacement) {
    const r = p.replacement;
    const where = r.target === null ? '번들 밖' : r.concept ? r.target : `${r.target}, 번들의 개념이 아님`;
    console.log(`         대체 개념: ${where}`);
  }
}
for (const w of r.warnings) console.log(`WARN ${w}`);
