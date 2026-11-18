// 사용법: pnpm trace policies/returns.md [--dir knowledge]
// 개념의 각주 주장과 sources를 따라 원문까지 거슬러 올라간다.
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { formatTrace, trace } from './src/okf/provenance.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { dir: { type: 'string', default: 'knowledge' } },
});
const path = positionals[0];
if (!path) {
  console.error('개념 경로를 입력하세요: pnpm trace policies/returns.md');
  process.exit(2);
}
const node = trace(await loadBundle(values.dir), path);
if (node === null) {
  console.error(`번들에 없는 개념이다: ${path}`);
  process.exit(1);
}
console.log(formatTrace(node).join('\n'));
