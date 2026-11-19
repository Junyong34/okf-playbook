// 개념 읽기 모듈. 번들의 파일 하나를 한 번만 나누고 파싱한다.
// validate·retrieve·provenance·trust·graph는 모두 이 결과를 읽는다. 파싱 실패를 어떻게 다룰지는 각 소비자가 정한다.
//  - validate: 실패를 오류로 보고한다.
//  - retrieve·graph: 개념이 아닌 파일(frontmatter·type 없음, 파싱 실패)은 건너뛴다 (§3.2, §11, 나머지는 계속 읽는다).
//  - provenance·trust: 정보가 없는 개념으로 다룬다.
import { parse } from 'yaml';
import type { Bundle } from './types.ts';

// ── frontmatter와 본문 나누기 (§4) — 레슨 0003 1단계 ────────────────────
export type Split = { frontmatter: string | null; body: string };

export function splitFrontmatter(text: string): Split {
  // 줄 단위로 나눈다. \r?\n 이라서 Windows 줄바꿈(CRLF)도 같이 처리된다. 맨 앞 BOM도 떼어 낸다.
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  // 첫 줄이 '---'가 아니면 frontmatter가 없는 파일이다.
  if (lines[0] !== '---') return { frontmatter: null, body: lines.join('\n') };
  // 두 번째 줄부터 닫는 '---'를 찾는다. 없으면 frontmatter가 닫히지 않은 것이다.
  const close = lines.indexOf('---', 1);
  if (close === -1) return { frontmatter: null, body: lines.join('\n') };
  return {
    frontmatter: lines.slice(1, close).join('\n'), // 두 '---' 사이
    body: lines.slice(close + 1).join('\n'),       // 닫는 '---' 다음 줄부터
  };
}

// ── 링크 경로 해석 (§6) — 레슨 0003 2단계 ─────────────────────────────
// 링크(§6.1)와 경로 필드(§6.2)가 같은 규칙을 쓴다. '/'로 시작하면 번들 루트, 그 밖은 파일이 있는 디렉터리 기준.
// from: 링크가 들어 있는 파일 ("policies/returns.md")
// 반환: 번들 루트 기준 경로, 루트 밖(외부)이면 null
export function resolveLink(from: string, target: string): string | null {
  // 출발점: '/'로 시작하면 번들 루트([]), 아니면 from이 들어 있는 디렉터리.
  const out = target.startsWith('/') ? [] : from.split('/').slice(0, -1);
  for (const part of target.split('/')) {
    if (part === '' || part === '.') continue; // 맨 앞 '/', 겹친 '//', './' 는 건너뜀
    if (part === '..') {
      if (out.length === 0) return null; // 루트보다 위로 가려 함 → 번들 밖
      out.pop();
    } else {
      out.push(part);
    }
  }
  return out.join('/');
}

// 본문에서 번들 안을 가리키는 링크 대상만 뽑는다. 외부 URL·문서 내 앵커·이미지는 제외.
export function extractLinks(body: string): string[] {
  const links: string[] = [];
  for (const m of body.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) {
    const target = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
    const path = target.split('#')[0];
    try { links.push(decodeURI(path)); } catch { links.push(path); }
  }
  return links;
}

// 날짜 값을 문자열로 둔다. YAML이 Date로 읽었으면 ISO 문자열로 바꾼다. 빈 값(§11.2)은 없는 것.
export function dateText(v: unknown): string | undefined {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? String(v) : v.toISOString();
  if (isBlank(v)) return undefined;
  return String(v);
}

// ── 빈 값·단일 값 (§11.2) ──────────────────────────────────────────────
// null, 빈 문자열, 빈 목록은 키가 없는 것과 같다.
export function isBlank(v: unknown): boolean {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

// 목록 필드(tags, sources, verified)는 항목 하나를 원소 하나짜리 목록으로 읽는다. 스칼라 tags를 쉼표로 나누지 않는다.
export function asList(v: unknown): unknown[] {
  if (isBlank(v)) return [];
  return Array.isArray(v) ? v : [v];
}

// ── 시각 (§5 Timestamps) ───────────────────────────────────────────────
// 허용 형식은 RFC 3339 두 가지뿐이다.
//  - 오프셋이 있는 date-time: "2026-06-30T14:00:00Z", "2026-11-18T15:00:00+09:00"
//  - 날짜만: "2026-06-30" → 그날 UTC 0시
// YAML 고유 Date 값도 받는다(그날 UTC 0시). 오프셋 없는 date-time과 그 밖 형식은 무효라 null이다.
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;

function validDay(y: string, m: string, d: string): boolean {
  const t = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return t.getUTCFullYear() === Number(y) && t.getUTCMonth() === Number(m) - 1 && t.getUTCDate() === Number(d);
}

// 반환: 밀리초 시각, 읽을 수 없으면 null.
export function parseTimestamp(v: unknown): number | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v !== 'string') return null;
  const d = v.match(DATE_RE);
  if (d) return validDay(d[1], d[2], d[3]) ? Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3])) : null;
  const dt = v.match(DATETIME_RE);
  if (!dt || !validDay(dt[1], dt[2], dt[3])) return null;
  if (Number(dt[4]) > 23 || Number(dt[5]) > 59 || Number(dt[6]) > 59) return null;
  const t = Date.parse(v.toUpperCase());
  return Number.isNaN(t) ? null : t;
}

// ── 파일 하나 읽기 ───────────────────────────────────────────────────
// index.md·log.md는 예약 파일이다 (§3.1). frontmatter와 상관없이 개념이 아니다.
// 그 밖의 .md는 frontmatter에 비어 있지 않은 type이 있어야 개념이다 (§3.2-1·2).
//  concept: 예약 파일이 아니고, frontmatter가 파싱되고, type이 비어 있지 않다
//  other:   예약 파일이 아닌데 개념도 아니다 (frontmatter 없음, type 없음, 파싱 실패). README.md 같은 파일
export type FileKind = 'concept' | 'index' | 'log' | 'other';

export type Frontmatter =
  | { state: 'absent' }                                   // 맨 위 '---' 블록이 없거나 닫히지 않음
  | { state: 'invalid'; reason: string }                  // YAML 문법 오류, 또는 `키: 값` 매핑이 아님
  | { state: 'ok'; data: Record<string, unknown> };

export type BundleFile = {
  path: string;
  kind: FileKind;
  frontmatter: Frontmatter;
  body: string;
  links: string[]; // 본문에 쓰인 링크 대상 그대로 (해석은 resolveLink로)
};

// type이 비어 있지 않은 문자열이면 그 값(앞뒤 공백 제거), 아니면 null (§3.2, §4.1).
export function conceptType(fm: Record<string, unknown> | null): string | null {
  const t = fm?.type;
  return typeof t === 'string' && t.trim() !== '' ? t.trim() : null;
}

function fileKind(path: string, fm: Frontmatter): FileKind {
  const name = path.split('/').pop();
  if (name === 'index.md') return 'index';
  if (name === 'log.md') return 'log';
  return fm.state === 'ok' && conceptType(fm.data) !== null ? 'concept' : 'other';
}

// yaml 패키지는 콜론 뒤 공백 누락, 탭 들여쓰기, 중복 키를 모두 오류로 던진다.
function parseFrontmatter(src: string): Frontmatter {
  try {
    const data = parse(src) ?? {};
    // "tags:[x]" 한 줄은 매핑이 아니라 문자열로 읽힌다.
    if (typeof data !== 'object' || Array.isArray(data)) return { state: 'invalid', reason: 'frontmatter가 `키: 값` 매핑이 아닙니다.' };
    return { state: 'ok', data };
  } catch (err) {
    return { state: 'invalid', reason: String((err as Error).message).split('\n')[0] };
  }
}

export function readFile(path: string, text: string): BundleFile {
  const { frontmatter, body } = splitFrontmatter(text);
  // 첫 줄이 '---'인데 닫는 '---'가 없으면 frontmatter를 쓰려다 망가진 것이다. 없는 것이 아니라 읽을 수 없는 것으로 본다 (§4).
  const opened = /^\uFEFF?---\r?$/.test(text.split('\n')[0]);
  const fm: Frontmatter =
    frontmatter !== null ? parseFrontmatter(frontmatter)
    : opened ? { state: 'invalid', reason: '닫는 `---` 줄이 없습니다.' }
    : { state: 'absent' };
  return { path, kind: fileKind(path, fm), frontmatter: fm, body, links: extractLinks(body) };
}

// .md 파일만 문서다. 그 밖의 파일은 asset이라 읽지 않는다 (§3.2-3).
export function isMarkdown(path: string): boolean {
  return path.endsWith('.md');
}

// 번들의 모든 .md 파일을 경로순으로 읽는다. asset은 빠진다.
export function readBundle(bundle: Bundle): BundleFile[] {
  return [...bundle.keys()].filter(isMarkdown).sort((a, b) => a.localeCompare(b)).map((path) => readFile(path, bundle.get(path)!));
}

// 번들에 없거나 asset이면 null.
export function readBundleFile(bundle: Bundle, path: string): BundleFile | null {
  const text = bundle.get(path);
  return text === undefined || !isMarkdown(path) ? null : readFile(path, text);
}

// 파싱된 frontmatter. 없거나 파싱할 수 없으면 null.
export function frontmatterData(file: BundleFile): Record<string, unknown> | null {
  return file.frontmatter.state === 'ok' ? file.frontmatter.data : null;
}

// ── 개념 ────────────────────────────────────────────────────────────
// 소비자가 쓸 수 있는 개념: 예약 파일이 아니고, frontmatter가 파싱되고, type이 비어 있지 않은 파일 (§3.2).
export type Concept = {
  path: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  body: string;
  links: string[];
  frontmatter: Record<string, unknown>; // 메타 필드 밖의 키(status, verified, sources …)도 여기서 읽는다
};

const str = (v: unknown) => (isBlank(v) ? '' : String(v));

export function toConcept(file: BundleFile): Concept | null {
  const fm = frontmatterData(file);
  if (file.kind !== 'concept' || fm === null) return null;
  return {
    path: file.path,
    type: conceptType(fm)!,
    title: str(fm.title),
    description: str(fm.description),
    tags: asList(fm.tags).filter((t) => !isBlank(t)).map(str), // 스칼라 tags는 태그 하나 (§11.2-2)
    body: file.body,
    links: file.links,
    frontmatter: fm,
  };
}

// 인덱스·로그는 답변 근거가 아니므로 뺀다. 개념이 아닌 파일(type 없음, 파싱 실패)은 건너뛰고 나머지는 계속 읽는다 (§3.2, §11).
export function readConcepts(bundle: Bundle): Concept[] {
  return readBundle(bundle).flatMap((f) => toConcept(f) ?? []);
}

// 경로가 번들의 개념인지 (§3.2). 링크·경로 필드가 개념을 가리키는지 판단할 때 쓴다 (§6.1, §6.4).
export function isConceptPath(bundle: Bundle, path: string): boolean {
  const f = readBundleFile(bundle, path);
  return f !== null && f.kind === 'concept';
}

// ── 번들 버전 (§8.1, §12) ──────────────────────────────────────────────
// 루트 index.md frontmatter의 okf_version. 선언이 없거나 읽을 수 없으면 null. 따옴표 없는 숫자(0.2)도 문자열로 바꿔 준다.
export function bundleVersion(bundle: Bundle): string | null {
  const index = readBundleFile(bundle, 'index.md');
  const v = index === null ? undefined : frontmatterData(index)?.okf_version;
  return isBlank(v) || typeof v === 'object' ? null : String(v);
}

// v0.2 대체 해석(§6.2, §12.1)을 쓸 수 있는 번들인지: okf_version이 0.2 이하이거나 선언이 없다.
// 숫자로 읽을 수 없는 버전은 모르는 버전이라 대체 해석을 하지 않는다.
export function allowsLegacyPaths(bundle: Bundle): boolean {
  const v = bundleVersion(bundle);
  if (v === null) return true;
  const m = v.match(/^(\d+)\.(\d+)/);
  if (!m) return false;
  return Number(m[1]) === 0 && Number(m[2]) <= 2;
}

// ── 경로 필드 (§6.2) ───────────────────────────────────────────────────
// resource가 무엇을 가리키는지 나눈다 (§5.1, §6.2).
// url: https:// 같은 절대 URL / scope: 따라갈 수 없는 범위 설명("all queries in …") / path: 번들 경로
export function classifyResource(resource: string): 'url' | 'scope' | 'path' {
  if (/^[a-z][a-z0-9+.-]*:/i.test(resource)) return 'url';
  if (/\s/.test(resource)) return 'scope';
  return 'path';
}

// 경로나 URI를 담는 frontmatter 필드 (§6.2). 이 번들에는 computation·executor·attester가 없지만(§10) 함께 모은다.
export type PathFieldName = 'resource' | 'sources[].resource' | 'superseded_by' | 'computation' | 'executor.resource' | 'attester.resource';
export type PathField = { field: PathFieldName; value: string };

// frontmatter에서 번들 경로로 읽히는 경로 필드 값을 위 순서대로 모은다. URL·범위 설명·빈 값은 뺀다.
export function pathFields(fm: Record<string, unknown>): PathField[] {
  const out: PathField[] = [];
  const add = (field: PathFieldName, v: unknown) => {
    if (typeof v === 'string' && v.trim() !== '' && classifyResource(v) === 'path') out.push({ field, value: v });
  };
  const sub = (v: unknown, key: string) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>)[key] : undefined);
  add('resource', fm.resource);
  for (const s of asList(fm.sources)) add('sources[].resource', sub(s, 'resource'));
  add('superseded_by', fm.superseded_by);
  add('computation', fm.computation);
  add('executor.resource', sub(fm.executor, 'resource'));
  add('attester.resource', sub(fm.attester, 'resource'));
  return out;
}

// 경로 필드 값 하나를 번들 루트 기준 경로로 푼다 (§6).
//  target: 번들 루트 기준 경로, 번들 밖이면 null
//  legacy: v0.2 대체 해석으로 찾았다. '/' 없는 값이 파일 기준으로 번들에 없고, 번들이 0.2 이하이거나 버전 선언이 없을 때
//          번들 루트 기준으로 다시 찾아 있으면 그 경로를 쓴다 (§6.2, §12.1). 본문 링크에는 쓰지 않는다.
export type ResolvedPath = { target: string | null; legacy: boolean };

export function resolvePathField(bundle: Bundle, from: string, value: string): ResolvedPath {
  let v = value.split('#')[0];
  try { v = decodeURI(v); } catch { /* 그대로 쓴다 */ }
  const target = resolveLink(from, v);
  if (v.startsWith('/') || (target !== null && bundle.has(target)) || !allowsLegacyPaths(bundle)) return { target, legacy: false };
  const fromRoot = resolveLink('index.md', v);
  if (fromRoot !== null && bundle.has(fromRoot)) return { target: fromRoot, legacy: true };
  return { target, legacy: false };
}
