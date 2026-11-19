// 사용법: pnpm prompt "질문" [retrieve와 같은 옵션]
// 검색 결과로 모델에 붙여 넣을 프롬프트를 출력한다.
// 복사하면서 저장: pnpm -s prompt "질문" | tee answers/q4.prompt.txt | pbcopy  (check-answer --prompt로 실제로 준 문서와 비교)
import { loadBundle } from './src/okf/load.ts';
import { searchArgsOrExit } from './src/okf/args.ts';
import { ask } from './src/okf/ask.ts';

const { options, dir, now, positionals } = searchArgsOrExit(process.argv.slice(2), 'pnpm prompt "질문" [--fields body|body+meta] [--no-links] [--max N] [--min N] [--now ISO시각]');
const question = positionals.join(' ');
if (!question) {
  console.error('질문을 입력하세요: pnpm prompt "할인 상품을 반품할 수 있나요?"');
  process.exit(2);
}
console.log(ask(await loadBundle(dir), question, options, now).prompt);
