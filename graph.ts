// 사용법: pnpm graph [--mermaid] [--dir knowledge]
// 번들을 개념 그래프로 읽는다. 링크(본문)와 출처(frontmatter sources)를 간선으로, 가리키는 개념(역링크)을 함께 보여 준다.
// --mermaid: GitHub·에디터 미리보기에 붙여 넣을 Mermaid flowchart를 출력한다 (9회차).
import { parseArgs } from 'node:util';
import { loadBundle } from './src/okf/load.ts';
import { buildGraph, formatGraph, toMermaid } from './src/okf/graph.ts';

const { values } = parseArgs({
  options: {
    mermaid: { type: 'boolean', default: false },
    dir: { type: 'string', default: 'knowledge' },
  },
});
const graph = buildGraph(await loadBundle(values.dir));
console.log((values.mermaid ? toMermaid(graph) : formatGraph(graph)).join('\n'));
