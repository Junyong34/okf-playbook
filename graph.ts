// 사용법: pnpm graph [--mermaid] [--dir knowledge]
// 번들을 개념 그래프로 읽는다 (OKF v0.3 §6.4). 개념을 가리키는 본문 링크와 경로 필드(sources·superseded_by·resource 등)를 간선으로,
// 가리키는 개념(역링크)과 개념이 아닌 대상(번들에 없음, type 없는 파일)을 함께 보여 준다.
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
