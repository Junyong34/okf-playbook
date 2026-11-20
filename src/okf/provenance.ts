// 7회차(심화 1) 실습: checkAttribution·trace 구현 완료 (tests/provenance.test.ts). 순서: P1단계 → P2단계.
// 레슨: learn/lessons/0007-sources-footnotes.html
// OKF v0.3 기준으로 고쳤다 (2026-11-19): sources 단일 항목 허용, 경로 필드 해석(§6)과 v0.2 대체 해석(§6.2, §12.1).
import type { Bundle } from './types.ts';
import { asList, classifyResource, frontmatterData, isBlank, isConceptPath, readBundleFile, resolvePathField, type BundleFile } from './concept.ts';

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
  const file = readBundleFile(bundle, path);
  return file === null ? null : provenanceOf(file);
}

// 이미 읽은 파일에서 출처와 각주를 꺼낸다. 파싱할 수 없는 개념은 출처가 없는 개념으로 다룬다(오류 보고는 validate가 맡는다).
export function provenanceOf(file: BundleFile): ConceptProvenance {
  const fm = frontmatterData(file) ?? {};
  const str = (v: unknown) => (isBlank(v) ? undefined : String(v)); // 빈 값은 없는 것 (§11.2-1)
  // 대시 없이 쓴 항목 하나도 목록으로 읽는다 (§11.2-2).
  const sources: Source[] = asList(fm.sources).map((s) => {
    const o = s && typeof s === 'object' && !Array.isArray(s) ? (s as Record<string, unknown>) : {};
    return { id: str(o.id), resource: str(o.resource), title: str(o.title) };
  });
  const claims: Claim[] = [];
  const definitions: string[] = [];
  file.body.split('\n').forEach((raw, i) => {
    const def = raw.match(/^\[\^([^\]]+)\]:/);
    if (def) {
      definitions.push(def[1]);
      return;
    }
    const labels = [...raw.matchAll(/\[\^([^\]]+)\]/g)].map((m) => m[1]);
    if (labels.length > 0) claims.push({ line: i + 1, text: raw.trim(), labels });
  });
  return { path: file.path, sources, claims, definitions };
}

// resource가 무엇을 가리키는지 나누는 classifyResource는 경로 필드 공용이라 concept.ts로 옮겼다 (§5.1, §6.2).
// 레슨·테스트가 이 경로로 import하므로 다시 내보낸다.
export { classifyResource };

// ── 각주 검사 ─────────────────────────────────────────────────────────
export type AttributionIssue = {
  kind: 'unknown-label' | 'missing-resource';
  message: string;
};

// P1단계: 한 개념의 각주와 sources가 서로 맞는지 본다.
//  unknown-label: 본문 각주 라벨인데 같은 id를 가진 sources 항목이 없다. 라벨이 출처로 가는 열쇠다(§5.1).
//                 라벨마다 한 번만, 처음 나온 순서로 보고한다.
//  missing-resource: resource가 없는 sources 항목. resource는 항목 안에서 필수다(§5.1).
//                    소비자는 이 항목을 무시하고 경고한다(§11.2-3). sources 순서대로 보고한다.
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
  kind: 'bundle' | 'not-a-concept' | 'missing' | 'outside' | 'url' | 'scope' | 'none';
  // bundle: 번들 안 개념으로 이어진다 / not-a-concept: 번들 파일이지만 개념이 아니다(type 없음 등, §3.2)
  // missing: 번들 경로인데 파일이 없다 / outside: 번들 루트 밖(외부, §6)
  // url: 외부 URL(따라가지 않음) / scope: 범위 설명(따라갈 수 없음) / none: resource가 없다
  target?: string;     // bundle·not-a-concept·missing일 때 번들 루트 기준 경로
  legacy?: boolean;    // v0.2 대체 해석(번들 루트 기준으로 다시 찾음)으로 찾았다 (§6.2, §12.1)
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
//  - resource가 path이면 resolvePathField(bundle, path, resource)로 번들 경로를 구한다 (§6, §6.2).
//    '/'로 시작하면 번들 루트, 아니면 개념이 있는 디렉터리 기준이다. 못 찾으면 v0.2 번들에서만 번들 루트 기준으로 다시 찾는다.
//    null이면 outside, 개념이면 bundle, 개념이 아닌 파일이면 not-a-concept, 없으면 missing.
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
    const { target, legacy } = resolvePathField(bundle, path, s.resource); // '/'는 번들 루트, 아니면 개념 위치 기준
    const at = legacy ? { ...base, legacy } : base;
    if (target === null) return { ...at, kind: 'outside' };
    if (!bundle.has(target)) return { ...at, kind: 'missing', target };
    if (!isConceptPath(bundle, target)) return { ...at, kind: 'not-a-concept', target };
    if (visited.has(target)) return { ...at, kind: 'bundle', target };
    return { ...at, kind: 'bundle', target, next: trace(bundle, target, visited) ?? undefined };
  });
  return { path, claims: p.claims, sources, issues: checkAttribution(p) };
}

// ── 출력 (제공) ─────────────────────────────────────────────────────
const KIND: Record<TraceSource['kind'], string> = {
  bundle: '번들 안 개념',
  'not-a-concept': '번들 파일이지만 개념이 아님',
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
    const legacy = s.legacy ? ', v0.2 대체 해석: 번들 루트 기준으로 찾음' : '';
    out.push(`${pad}  출처 ${s.id ?? '(id 없음)'}: ${s.resource ?? ''}${to} (${KIND[s.kind]}${legacy})`);
    if (s.next) out.push(...formatTrace(s.next, depth + 2));
    else if (s.kind === 'bundle') out.push(`${pad}    (이미 따라간 개념)`);
  }
  for (const i of node.issues) out.push(`${pad}  WARN ${i.message}`);
  return out;
}
