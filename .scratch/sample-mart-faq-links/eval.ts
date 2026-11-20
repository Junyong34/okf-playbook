// 주제별 적중 비교: 질문마다 기대 FAQ가 고른 개념(상위 3개)에 들었는지 본다. O: FAQ 적중, H: 그 FAQ를 요약한 허브만 잡힘, X: 못 찾음.
// 실행: [BUNDLE=번들경로] node .scratch/sample-mart-faq-links/eval.ts [주제...]  (주제: receipts delivery payment, 없으면 전부)
import { loadBundle } from '../../src/okf/load.ts';
import { retrieve, readConcepts, DEFAULT_OPTIONS } from '../../src/okf/retrieve.ts';
import { resolveLink } from '../../src/okf/concept.ts';
import { CASES } from './cases.ts';

const bundle = await loadBundle(process.env.BUNDLE ?? 'bundles/sample_mart_faq'); // BUNDLE=경로 로 다른 번들과 비교
// 허브(topics/)가 링크한 FAQ. 허브가 잡히면 그 요약으로 답할 근거가 있다고 본다.
const hubLinks = new Map(readConcepts(bundle).filter((c) => c.path.startsWith('topics/')).map((c) => [c.path, new Set(c.links.map((l) => resolveLink(c.path, l)))]));
const topics = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CASES);
for (const t of topics) {
  let hit = 0, hubTop = 0, reach = 0;
  console.log(`\n# ${t}`);
  for (const { q, want } of CASES[t]) {
    const r = retrieve(bundle, q, DEFAULT_OPTIONS);
    const ok = r.picks.some((p) => want.includes(p.path));
    const viaHub = !ok && r.picks.some((p) => want.some((w) => hubLinks.get(p.path)?.has(w)));
    hit += +ok; reach += +(ok || viaHub);
    hubTop += +r.picks.some((p) => p.path.startsWith('topics/'));
    console.log(`${ok ? 'O' : viaHub ? 'H' : 'X'}  ${q}`);
    console.log(`     ${r.picks.map((p) => `${p.path.replace(/^faqs\//, '')}(${p.via === 'link' ? '링크' : p.score})`).join(', ') || '없음'}   기대: ${want.map((w) => w.replace(/^faqs\//, '')).join(' | ')}`);
  }
  console.log(`FAQ 적중 ${hit}/${CASES[t].length}, 근거 도달(FAQ 또는 그 FAQ를 요약한 허브) ${reach}/${CASES[t].length}, 허브 포함 ${hubTop}/${CASES[t].length}`);
}
