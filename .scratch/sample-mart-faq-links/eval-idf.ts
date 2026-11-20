// 실험: retrieve 점수(겹친 bigram 개수)를 IDF 가중 합으로 바꾸면 어떻게 되는지. src/okf는 고치지 않는다.
// 실행: node .scratch/sample-mart-faq-links/eval-idf.ts
import { loadBundle } from '../../src/okf/load.ts';
import { readConcepts, bigrams, searchText } from '../../src/okf/retrieve.ts';
import { CASES } from './cases.ts';

const cs = readConcepts(await loadBundle(process.env.BUNDLE ?? 'bundles/sample_mart_faq'));
const docs = cs.map((c) => ({ path: c.path, grams: bigrams(searchText(c, 'body+meta')) }));
const df = new Map<string, number>();
for (const d of docs) for (const g of d.grams) df.set(g, (df.get(g) ?? 0) + 1);
const idf = (g: string) => Math.log(docs.length / (df.get(g) ?? docs.length));
for (const [t, cases] of Object.entries(CASES)) {
  let hit = 0;
  for (const { q, want } of cases) {
    const qg = [...bigrams(q)];
    const top = docs.map((d) => ({ path: d.path, s: qg.filter((g) => d.grams.has(g)).reduce((a, g) => a + idf(g), 0) }))
      .sort((a, b) => b.s - a.s || a.path.localeCompare(b.path)).slice(0, 3);
    const ok = top.some((x) => want.includes(x.path)); hit += +ok;
    if (!ok) console.log(`X ${q}\n    ${top.map((x) => `${x.path}(${x.s.toFixed(1)})`).join(', ')}`);
  }
  console.log(`${t}: IDF 가중 FAQ 적중 ${hit}/${cases.length}`);
}
