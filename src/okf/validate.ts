// 3회차 실습: 1~6단계 구현 완료 (tests/validate.test.ts).
// 순서: 1단계 splitFrontmatter → 2단계 resolveLink → 4단계 checkConcept·checkIndex → 5·6단계 checkLinks
// 레슨: learn/lessons/0003-validate.html
import { parse } from 'yaml';
import type { Bundle, Issue } from './types.ts';

// ── 1. frontmatter와 본문 나누기 (§4) ────────────────────────────────
export type Split = { frontmatter: string | null; body: string };

export function splitFrontmatter(text: string): Split {
  // 1단계 (완료)
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

// ── 2. 링크 경로 해석 (§6.1) ──────────────────────────────────────────
// from: 링크가 들어 있는 파일 ("policies/returns.md")
// 반환: 번들 루트 기준 경로, 루트 밖이면 null
export function resolveLink(from: string, target: string): string | null {
  // 2단계 (완료)
  // 출발점: '/'로 시작하면 번들 루트([]), 아니면 from이 들어 있는 디렉터리.
  //   "policies/returns.md" → ["policies"]
  const out = target.startsWith('/') ? [] : from.split('/').slice(0, -1);
  for (const part of target.split('/')) {
    if (part === '' || part === '.') continue; // 맨 앞 '/', 겹친 '//', './' 는 건너뜀
    if (part === '..') {
      if (out.length === 0) return null; // 루트보다 위로 가려 함 → 번들 밖
      out.pop(); // 한 단계 위로
    } else {
      out.push(part);
    }
  }
  return out.join('/');
}

// 본문에서 번들 안을 가리키는 링크 대상만 뽑는다. 외부 URL·문서 내 앵커·이미지는 제외. (제공)
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

// ── 3. 검사 ──────────────────────────────────────────────────────────
type Parsed = { ok: true; data: Record<string, unknown> } | { ok: false; reason: string };

// YAML 문자열을 파싱한다. 문법 오류면 ok: false. (제공)
// yaml 패키지는 콜론 뒤 공백 누락, 탭 들여쓰기, 중복 키를 모두 오류로 던진다.
function parseFrontmatter(src: string): Parsed {
  try {
    const data = parse(src) ?? {};
    if (typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, reason: 'frontmatter가 `키: 값` 매핑이 아닙니다.' };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, reason: String((err as Error).message).split('\n')[0] };
  }
}

function checkConcept(file: string, frontmatter: string | null, issues: Issue[]): void {
  // 4단계 (완료) — 명세 §11의 1·2번 조건
  if (frontmatter === null) {
    issues.push({ level: 'error', rule: 'yaml-parse', file, message: '파일 맨 위에 `---`로 열고 닫는 frontmatter가 없습니다 (§4, §11).' });
    return;
  }
  const parsed = parseFrontmatter(frontmatter);
  if (!parsed.ok) {
    issues.push({ level: 'error', rule: 'yaml-parse', file, message: `YAML을 파싱할 수 없습니다: ${parsed.reason} (§11)` });
    return;
  }
  const type = parsed.data.type;
  if (type === undefined || type === null || String(type).trim() === '') {
    issues.push({ level: 'error', rule: 'missing-type', file, message: '비어 있지 않은 `type`이 없습니다 (§4.1, §11).' });
  }
}

function checkIndex(file: string, frontmatter: string | null, issues: Issue[]): void {
  // 4단계 (완료) — 명세 §8·§12
  if (frontmatter === null) return; // 인덱스는 frontmatter가 없는 것이 기본
  const parsed = parseFrontmatter(frontmatter);
  if (!parsed.ok) {
    issues.push({ level: 'error', rule: 'yaml-parse', file, message: `YAML을 파싱할 수 없습니다: ${parsed.reason}` });
    return;
  }
  if (file !== 'index.md') {
    issues.push({ level: 'error', rule: 'index-frontmatter', file, message: '하위 디렉터리 index.md에는 frontmatter를 둘 수 없습니다 (§8).' });
    return;
  }
  for (const key of Object.keys(parsed.data)) {
    if (key !== 'okf_version') {
      issues.push({ level: 'error', rule: 'index-frontmatter', file, message: `루트 index.md frontmatter에는 okf_version만 둘 수 있습니다: \`${key}\` (§8, §12).` });
    }
  }
}

function checkLinks(bundle: Bundle, file: string, body: string, issues: Issue[]): void {
  // 5·6단계 (완료) — 명세 위반이 아니므로 모두 warning
  for (const target of extractLinks(body)) {
    const resolved = resolveLink(file, target);
    if (resolved === null) {
      issues.push({ level: 'warning', rule: 'link-outside-bundle', file, message: `\`${target}\`가 번들 루트 밖을 가리킵니다.` });
      continue;
    }
    if (target.startsWith('/')) {
      issues.push({ level: 'warning', rule: 'team/relative-links', file, message: `\`${target}\`: 팀 규칙상 번들 안 링크는 상대 경로로 씁니다.` });
    }
    if (!bundle.has(resolved) && !bundle.has(`${resolved}/index.md`)) {
      issues.push({ level: 'warning', rule: 'broken-link', file, message: `\`${target}\` → \`${resolved}\`가 번들에 없습니다. 읽기는 계속합니다 (§6.1, §11).` });
    }
  }
}

export function validateBundle(bundle: Bundle): Issue[] {
  const issues: Issue[] = [];
  for (const file of [...bundle.keys()].sort()) {
    const { frontmatter, body } = splitFrontmatter(bundle.get(file)!);
    const name = file.split('/').pop();
    if (name === 'index.md') checkIndex(file, frontmatter, issues);
    else if (name !== 'log.md') checkConcept(file, frontmatter, issues); // log.md 구조 검사는 이번 범위 밖
    checkLinks(bundle, file, body, issues);
  }
  return issues;
}
