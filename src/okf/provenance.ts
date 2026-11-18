// 7회차(심화 1) 실습: checkAttribution·trace 구현 완료 (tests/provenance.test.ts). 순서: P1단계 → P2단계.
// 레슨: learn/lessons/0007-sources-footnotes.html
import { parse } from 'yaml';
import type { Bundle } from './types.ts';
import { resolveLink, splitFrontmatter } from './validate.ts';

// ── 출처와 각주 읽기 (제공) ───────────────────────────────────────────
// §5.1: sources 항목마다 resource는 필수, id는 본문이 인용할 때 있어야 한다(SHOULD).
export type Source = { id?: string; resource?: string; title?: string };

// 각주가 붙은 본문 한 줄. labels는 그 줄에 쓰인 각주 라벨들이다.
export type Claim = { line: number; text: string; labels: string[] };

export type ConceptProvenance = {
  path: string;
  sources: Source[];
  claims: Claim[];       // 각주 참조([^id])가 있는 줄. 각주 정의 줄([^id]: …)은 뺀다
  definitions: string[]; // 각주 정의 줄의 라벨
};

export function readProvenance(bundle: Bundle, path: string): ConceptProvenance | null {
  const text = bundle.get(path);
  if (text === undefined) return null;
  const { frontmatter, body } = splitFrontmatter(text);
  let fm: Record<string, unknown> = {};
  try {
    const data = frontmatter === null ? {} : parse(frontmatter);
    if (data && typeof data === 'object' && !Array.isArray(data)) fm = data;
  } catch {
    // 파싱할 수 없는 개념은 출처가 없는 개념으로 다룬다. 오류 보고는 validate가 맡는다.
  }
  const str = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
  const sources: Source[] = Array.isArray(fm.sources)
    ? fm.sources.map((s) => {
        const o = s && typeof s === 'object' ? (s as Record<string, unknown>) : {};
        return { id: str(o.id), resource: str(o.resource), title: str(o.title) };
      })
    : [];
  const claims: Claim[] = [];
  const definitions: string[] = [];
  body.split('\n').forEach((raw, i) => {
    const def = raw.match(/^\[\^([^\]]+)\]:/);
    if (def) {
      definitions.push(def[1]);
      return;
    }
    const labels = [...raw.matchAll(/\[\^([^\]]+)\]/g)].map((m) => m[1]);
    if (labels.length > 0) claims.push({ line: i + 1, text: raw.trim(), labels });
  });
  return { path, sources, claims, definitions };
}

// resource가 무엇을 가리키는지 나눈다 (§5.1, §6.2).
// url: https:// 같은 절대 URL / scope: 따라갈 수 없는 범위 설명("all queries in …") / path: 번들 경로
export function classifyResource(resource: string): 'url' | 'scope' | 'path' {
  if (/^[a-z][a-z0-9+.-]*:/i.test(resource)) return 'url';
  if (/\s/.test(resource)) return 'scope';
  return 'path';
}

// ── 각주 검사 ─────────────────────────────────────────────────────────
export type AttributionIssue = {
  kind: 'unknown-label' | 'missing-resource';
  message: string;
};

// P1단계: 한 개념의 각주와 sources가 서로 맞는지 본다.
//  unknown-label: 본문 각주 라벨인데 같은 id를 가진 sources 항목이 없다. 라벨이 출처로 가는 열쇠다(§5.1).
//                 라벨마다 한 번만, 처음 나온 순서로 보고한다.
//  missing-resource: resource가 없는 sources 항목. resource는 항목 안에서 필수다(§5.1).
//                    sources 순서대로 보고한다.
// message 문구는 자유다. 테스트는 kind 순서만 본다(unknown-label 먼저, missing-resource 나중).
export function checkAttribution(p: ConceptProvenance): AttributionIssue[] {
  // P1단계 (완료)
  const ids = new Set(p.sources.map((s) => s.id).filter((id) => id !== undefined));
  const issues: AttributionIssue[] = [];
  const seen = new Set<string>();
  for (const c of p.claims) {
    for (const label of c.labels) {
      if (ids.has(label) || seen.has(label)) continue;
      seen.add(label);
      issues.push({ kind: 'unknown-label', message: `${p.path} ${c.line}행의 각주 [^${label}]에 맞는 sources id가 없다.` });
    }
  }
  p.sources.forEach((s, i) => {
    if (!s.resource) issues.push({ kind: 'missing-resource', message: `${p.path}의 sources ${i + 1}번째 항목(${s.id ?? 'id 없음'})에 resource가 없다.` });
  });
  return issues;
}

// ── 출처 따라가기 ─────────────────────────────────────────────────────
export type TraceSource = {
  id?: string;
  resource?: string;
  kind: 'bundle' | 'missing' | 'outside' | 'url' | 'scope' | 'none';
  // bundle: 번들 안 개념으로 이어진다 / missing: 번들 경로인데 파일이 없다 / outside: 번들 루트 밖
  // url: 외부 URL(따라가지 않음) / scope: 범위 설명(따라갈 수 없음) / none: resource가 없다
  target?: string;     // bundle·missing일 때 번들 루트 기준 경로
  next?: TraceNode;    // bundle일 때 그 개념을 따라간 결과. 이미 방문한 개념이면 비운다
};

export type TraceNode = {
  path: string;
  claims: Claim[];
  sources: TraceSource[];
  issues: AttributionIssue[];
};

// P2단계: path 개념에서 시작해 sources를 따라간다.
//  - 개념이 번들에 없으면 null.
//  - resource가 path이면 resolveLink(path, resource)로 번들 경로를 구한다. '/'로 시작하면 번들 루트 기준이다(§6.2).
//    null이면 outside, 번들에 있으면 bundle, 없으면 missing.
//  - bundle이면 그 개념을 다시 trace해 next에 넣는다. 같은 개념을 두 번 따라가지 않는다(순환 방지).
//  - issues에는 checkAttribution 결과를 넣는다.
export function trace(bundle: Bundle, path: string, visited: Set<string> = new Set()): TraceNode | null {
  // P2단계 (완료)
  const p = readProvenance(bundle, path);
  if (p === null) return null;
  visited.add(path); // 순환 방지: 이 개념은 이미 따라갔다
  const sources = p.sources.map((s): TraceSource => {
    const base = { id: s.id, resource: s.resource };
    if (!s.resource) return { ...base, kind: 'none' };
    const kind = classifyResource(s.resource);
    if (kind !== 'path') return { ...base, kind };
    const target = resolveLink(path, s.resource); // '/'는 번들 루트, 아니면 개념 위치 기준
    if (target === null) return { ...base, kind: 'outside' };
    if (!bundle.has(target)) return { ...base, kind: 'missing', target };
    if (visited.has(target)) return { ...base, kind: 'bundle', target };
    return { ...base, kind: 'bundle', target, next: trace(bundle, target, visited) ?? undefined };
  });
  return { path, claims: p.claims, sources, issues: checkAttribution(p) };
}

// ── 출력 (제공) ─────────────────────────────────────────────────────
const KIND: Record<TraceSource['kind'], string> = {
  bundle: '번들 안 개념',
  missing: '번들에 없음',
  outside: '번들 밖 경로',
  url: '외부 URL, 따라가지 않음',
  scope: '범위 설명, 따라갈 수 없음',
  none: 'resource 없음',
};

export function formatTrace(node: TraceNode, depth = 0): string[] {
  const pad = '  '.repeat(depth);
  const out = [`${pad}${node.path}`];
  for (const c of node.claims) out.push(`${pad}  주장 ${c.line}행: ${c.text}`);
  if (node.sources.length === 0) out.push(`${pad}  (sources 없음)`);
  for (const s of node.sources) {
    const to = s.target ? ` → ${s.target}` : '';
    out.push(`${pad}  출처 ${s.id ?? '(id 없음)'}: ${s.resource ?? ''}${to} (${KIND[s.kind]})`);
    if (s.next) out.push(...formatTrace(s.next, depth + 2));
    else if (s.kind === 'bundle') out.push(`${pad}    (이미 따라간 개념)`);
  }
  for (const i of node.issues) out.push(`${pad}  WARN ${i.message}`);
  return out;
}
