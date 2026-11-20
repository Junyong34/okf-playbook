// 주제 데이터(topics-delivery-payment.ts)로 허브 문서를 만들고 FAQ의 tags·description·관련 문서를 고친다.
// 실행: node .scratch/sample-mart-faq-links/apply-topics.ts  (이미 관련 문서 절이 있는 FAQ는 건너뛴다. 허브는 본문이 바뀐 것만 다시 쓴다)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { posix } from 'node:path';
import * as A from './topics-delivery-payment.ts';
import * as B from './topics-rest.ts';

// 두 데이터 파일을 합친다. 같은 id가 두 번 나오면 멈춘다.
const HUBS = [...A.HUBS, ...B.HUBS];
const FAQS: Record<string, A.Faq> = { ...A.FAQS };
for (const [id, f] of Object.entries(B.FAQS)) { if (FAQS[id]) throw new Error(`중복 id: ${id}`); FAQS[id] = f; }
for (const f of Object.values(FAQS)) if (!HUBS.some((h) => h.slug === f.hub)) throw new Error(`없는 허브: ${f.hub}`);
for (const h of HUBS) for (const s of h.sections) if (!Object.values(FAQS).some((f) => f.hub === h.slug && f.section === s)) throw new Error(`빈 절: ${h.slug}/${s}`);
for (const f of Object.values(FAQS)) { const h = HUBS.find((x) => x.slug === f.hub)!; if (!h.sections.includes(f.section)) throw new Error(`없는 절: ${f.hub}/${f.section}`); }

const ROOT = 'bundles/sample_mart_faq/';
const AT = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const ACTOR = 'claude-code/claude-opus-5-5';
const pathOf = (id: string) => (id.includes('/') ? `faqs/${id.split('/')[0]}/faq-${id.split('/')[1]}.md` : `faqs/purchase/faq-${id}.md`);
const hubPath = (slug: string) => `topics/${slug}.md`;
const read = (p: string) => readFileSync(ROOT + p, 'utf8');
const titleOf = (p: string) => JSON.parse(read(p).match(/^title: (.*)$/m)![1].replace(/^([^"].*)$/, '"$1"'));
const label = (id: string) => FAQS[id]?.label ?? titleOf(pathOf(id));
const hubTitle = (slug: string) => HUBS.find((h) => h.slug === slug)?.title ?? titleOf(hubPath(slug));
const rel = (from: string, to: string) => posix.relative(posix.dirname(from), to);
const q = (s: string) => JSON.stringify(s);
const fid = (id: string) => `faq-${id.replace('/', '-')}`;

for (const id of Object.keys(FAQS)) if (!existsSync(ROOT + pathOf(id))) throw new Error(`없는 FAQ: ${id}`);
for (const f of Object.values(FAQS)) for (const r of f.related) if (!existsSync(ROOT + pathOf(r))) throw new Error(`없는 related: ${r}`);

let hubWritten = 0, faqWritten = 0, faqSkipped = 0;
// 1) 허브 문서
for (const h of HUBS) {
  const me = hubPath(h.slug);
  const items = Object.entries(FAQS).filter(([, f]) => f.hub === h.slug);
  const fm = [
    '---', 'type: Topic', `title: ${h.title}`, `description: ${q(h.description)}`, `tags: [${h.tags.map(q).join(', ')}]`,
    'generated:', `  by: ${q(ACTOR)}`, `  at: ${q(AT)}`, 'sources:',
    ...items.flatMap(([id]) => [`  - id: ${fid(id)}`, `    resource: /${pathOf(id)}`, `    title: ${q(titleOf(pathOf(id)))}`]),
    '---',
  ];
  const body = [`# ${h.title}`, '', h.intro];
  for (const s of h.sections) {
    body.push('', `## ${s}`, '');
    for (const [id, f] of items.filter(([, f]) => f.section === s)) {
      body.push(`* **[${f.label}](${rel(me, pathOf(id))})**: ${f.summary}[^${fid(id)}]`);
    }
  }
  body.push('', '## 관련 주제', '', ...h.see.map((s) => `* [${hubTitle(s)}](${rel(me, hubPath(s))})`), '');
  body.push(...items.map(([id]) => `[^${fid(id)}]: 원문 FAQ.`));
  const next = [...fm, '', ...body, ''].join('\n');
  const strip = (t: string) => t.replace(/^  at: .*$/m, '');
  if (existsSync(ROOT + me) && strip(read(me)) === strip(next)) continue; // 의미가 같으면 generated.at을 바꾸지 않는다
  writeFileSync(ROOT + me, next); hubWritten++;
}

if (process.argv.includes('--hubs-only')) { console.log(`허브 ${HUBS.length}개 중 ${hubWritten}개 씀`); process.exit(0); }

// 2) FAQ: description·tags 교체, 각주 앞에 관련 문서 절
for (const [id, f] of Object.entries(FAQS)) {
  const p = pathOf(id);
  let text = read(p);
  if (text.includes('\n## 관련 문서')) { faqSkipped++; continue; }
  const cat = text.match(/^tags: \["([^"]+)"/m)![1];
  const HUB_TAG: Record<string, string> = { 'delivery-types': '배송', 'delivery-areas': '배송', 'delivery-time': '배송', 'order-changes': '배송', 'delivery-tracking': '배송', 'payment-methods': '결제', 'sample-pay': '결제', 'gift-cards': '결제' };
  const tags = [...new Set([cat, ...(HUB_TAG[f.hub] ? [HUB_TAG[f.hub]] : []), ...f.tags, 'FAQ'])];
  text = text.replace(/^description: .*$/m, `description: ${q(f.description)}`).replace(/^tags: .*$/m, `tags: [${tags.map(q).join(', ')}]`);
  const lines = [`* [${hubTitle(f.hub)}](${rel(p, hubPath(f.hub))}) - 이 FAQ가 속한 주제 문서.`, ...f.related.map((r) => `* [${label(r)}](${rel(p, pathOf(r))})`)];
  const at = text.search(/^\[\^sample-faq\]:/m);
  text = text.slice(0, at) + `## 관련 문서\n\n${lines.join('\n')}\n\n` + text.slice(at);
  writeFileSync(ROOT + p, text); faqWritten++;
}
console.log(`허브 ${HUBS.length}개 중 ${hubWritten}개 씀, FAQ ${faqWritten}개 수정, ${faqSkipped}개는 이미 적용돼 건너뜀`);
