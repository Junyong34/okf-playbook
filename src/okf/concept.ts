// 개념 읽기 모듈. 번들의 파일 하나를 한 번만 나누고 파싱한다.
// validate·retrieve·provenance·trust·graph는 모두 이 결과를 읽는다. 파싱 실패를 어떻게 다룰지는 각 소비자가 정한다.
//  - validate: 실패를 오류로 보고한다.
//  - retrieve·graph: 파싱되지 않은 개념은 건너뛴다 (§11, 나머지는 계속 읽는다).
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

// ── 링크 경로 해석 (§6.1) — 레슨 0003 2단계 ─────────────────────────────
// from: 링크가 들어 있는 파일 ("policies/returns.md")
// 반환: 번들 루트 기준 경로, 루트 밖이면 null
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

// 날짜 값을 문자열로 둔다. YAML이 Date로 읽었으면 ISO 문자열로 바꾼다.
export function dateText(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString();
  if (v === undefined || v === null) return undefined;
  return String(v);
}

// ── 파일 하나 읽기 ───────────────────────────────────────────────────
// index.md·log.md는 예약 파일이다 (§3.1). 개념이 아니다.
export type FileKind = 'concept' | 'index' | 'log';

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

function fileKind(path: string): FileKind {
  const name = path.split('/').pop();
  return name === 'index.md' ? 'index' : name === 'log.md' ? 'log' : 'concept';
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
  return {
    path,
    kind: fileKind(path),
    frontmatter: frontmatter === null ? { state: 'absent' } : parseFrontmatter(frontmatter),
    body,
    links: extractLinks(body),
  };
}

// 번들의 모든 파일을 경로순으로 읽는다.
export function readBundle(bundle: Bundle): BundleFile[] {
  return [...bundle.keys()].sort((a, b) => a.localeCompare(b)).map((path) => readFile(path, bundle.get(path)!));
}

// 번들에 없으면 null.
export function readBundleFile(bundle: Bundle, path: string): BundleFile | null {
  const text = bundle.get(path);
  return text === undefined ? null : readFile(path, text);
}

// 파싱된 frontmatter. 없거나 파싱할 수 없으면 null.
export function frontmatterData(file: BundleFile): Record<string, unknown> | null {
  return file.frontmatter.state === 'ok' ? file.frontmatter.data : null;
}

// ── 개념 ────────────────────────────────────────────────────────────
// 소비자가 쓸 수 있는 개념: 예약 파일이 아니고 frontmatter가 파싱된 파일.
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

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

export function toConcept(file: BundleFile): Concept | null {
  const fm = frontmatterData(file);
  if (file.kind !== 'concept' || fm === null) return null;
  return {
    path: file.path,
    type: str(fm.type).trim(),
    title: str(fm.title),
    description: str(fm.description),
    tags: Array.isArray(fm.tags) ? fm.tags.map(str) : [],
    body: file.body,
    links: file.links,
    frontmatter: fm,
  };
}

// 인덱스·로그는 답변 근거가 아니므로 뺀다. 파싱할 수 없는 개념은 건너뛰고 나머지는 계속 읽는다 (§11).
export function readConcepts(bundle: Bundle): Concept[] {
  return readBundle(bundle).flatMap((f) => toConcept(f) ?? []);
}
