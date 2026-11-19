// 3회차 실습: 1~6단계 구현 완료 (tests/validate.test.ts). OKF v0.3 기준으로 4단계를 고쳤다 (2026-11-19).
// 순서: 1단계 splitFrontmatter → 2단계 resolveLink → 4단계 checkConcept·checkIndex → 5·6단계 checkLinks
// 레슨: learn/lessons/0003-validate.html
import type { Bundle, Issue } from './types.ts';
import { asList, frontmatterData, isBlank, parseTimestamp, readBundle, resolveLink, type BundleFile } from './concept.ts';

// 1·2단계 함수(splitFrontmatter·resolveLink)와 extractLinks는 개념 읽기 모듈(concept.ts)로 옮겼다.
// 레슨·테스트가 이 경로로 import하므로 그대로 다시 내보낸다.
export { extractLinks, resolveLink, splitFrontmatter, type Split } from './concept.ts';

// ── 3. 검사 ──────────────────────────────────────────────────────────
// 4단계 공통: frontmatter 블록이 있으면 YAML 매핑으로 파싱되어야 한다 (§4, §11.1-1). 파싱 실패만 오류다.
function checkParse(f: BundleFile, issues: Issue[]): boolean {
  if (f.frontmatter.state !== 'invalid') return true;
  issues.push({ level: 'error', rule: 'yaml-parse', file: f.path, message: `YAML을 파싱할 수 없습니다: ${f.frontmatter.reason} (§4, §11.1)` });
  return false;
}

function checkConcept(f: BundleFile, issues: Issue[]): void {
  // 4단계 (완료) — 명세 §3.2·§11.1
  // v0.3: frontmatter나 type이 없는 .md는 오류가 아니라 "개념이 아닌 파일"이다. 소비자는 건너뛰고, 검증기는 경고한다(SHOULD).
  const file = f.path;
  if (!checkParse(f, issues)) return;
  if (f.kind === 'other') {
    const why = f.frontmatter.state === 'absent' ? 'frontmatter가 없습니다' : '비어 있지 않은 `type`이 없습니다';
    issues.push({ level: 'warning', rule: 'not-a-concept', file, message: `${why}. 개념이 아닌 파일로 건너뜁니다 (§3.2).` });
    return;
  }
  checkLifecycle(f, issues);
}

// 4단계 추가 (v0.3) — 소비자가 무시하거나 신선하지 않다고 볼 값을 미리 알린다. 모두 warning (§5, §11.2).
function checkLifecycle(f: BundleFile, issues: Issue[]): void {
  const file = f.path;
  const fm = frontmatterData(f)!;
  const badTime = (key: string, v: unknown) => {
    if (!isBlank(v) && parseTimestamp(v) === null) {
      issues.push({ level: 'warning', rule: 'bad-timestamp', file, message: `\`${key}: ${String(v)}\`는 허용된 시각 형식(오프셋 있는 date-time, 날짜만)이 아닙니다 (§5).` });
    }
  };
  asList(fm.verified).forEach((item, i) => {
    const o = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : {};
    if (isBlank(o.by) || isBlank(o.at)) {
      issues.push({ level: 'warning', rule: 'incomplete-verified', file, message: `verified ${i + 1}번째 항목에 by와 at이 둘 다 있어야 합니다. 소비자는 이 항목을 무시합니다 (§5.2, §11.2).` });
    } else badTime(`verified[${i}].at`, o.at);
  });
  const generated = fm.generated && typeof fm.generated === 'object' ? (fm.generated as Record<string, unknown>) : {};
  badTime('generated.at', generated.at);
  badTime('stale_after', fm.stale_after);
}

function checkIndex(f: BundleFile, issues: Issue[]): void {
  // 4단계 (완료) — 명세 §8·§8.1
  const file = f.path;
  if (file !== 'index.md') {
    // 하위 디렉터리 index.md에는 frontmatter가 없다 (§8).
    if (f.frontmatter.state !== 'absent') {
      issues.push({ level: 'error', rule: 'index-frontmatter', file, message: '하위 디렉터리 index.md에는 frontmatter를 둘 수 없습니다 (§8).' });
    }
    return;
  }
  // 루트 index.md: okf_version·title·description·license와 확장 키를 둘 수 있다 (§8.1). 모르는 키도 오류가 아니다 (§4.1).
  if (!checkParse(f, issues)) return;
  const v = f.frontmatter.state === 'ok' ? f.frontmatter.data.okf_version : undefined;
  if (isBlank(v)) {
    issues.push({ level: 'warning', rule: 'missing-okf-version', file, message: '루트 index.md frontmatter에 `okf_version: "0.3"`을 두는 것을 권장합니다 (§8.1).' });
  } else if (typeof v !== 'string') {
    issues.push({ level: 'warning', rule: 'unquoted-version', file, message: `okf_version은 따옴표로 감싼 문자열로 씁니다. 예: "0.3" (§4, §8.1). 지금 값: ${String(v)}` });
  }
}

function checkLog(f: BundleFile, issues: Issue[]): void {
  // 4단계 추가 (v0.3) — log.md에는 frontmatter가 없다 (§9, §11.1-2)
  if (f.frontmatter.state !== 'absent') {
    issues.push({ level: 'error', rule: 'log-frontmatter', file: f.path, message: 'log.md에는 frontmatter를 둘 수 없습니다 (§9).' });
  }
}

function checkLinks(bundle: Bundle, f: BundleFile, issues: Issue[]): void {
  // 5·6단계 (완료) — 명세 위반이 아니므로 모두 warning
  const file = f.path;
  for (const target of f.links) {
    const resolved = resolveLink(file, target);
    if (resolved === null) {
      issues.push({ level: 'warning', rule: 'link-outside-bundle', file, message: `\`${target}\`가 번들 루트 밖을 가리킵니다.` });
      continue;
    }
    if (target.startsWith('/')) {
      issues.push({ level: 'warning', rule: 'team/relative-links', file, message: `\`${target}\`: 팀 규칙상 번들 안 링크는 상대 경로로 씁니다.` });
    }
    if (!bundle.has(resolved) && !bundle.has(`${resolved}/index.md`)) {
      issues.push({ level: 'warning', rule: 'broken-link', file, message: `\`${target}\` → \`${resolved}\`가 번들에 없습니다. 읽기는 계속합니다 (§6.1, §11.2).` });
    }
  }
}

export function validateBundle(bundle: Bundle): Issue[] {
  const issues: Issue[] = [];
  for (const f of readBundle(bundle)) {
    if (f.kind === 'index') checkIndex(f, issues);
    else if (f.kind === 'log') checkLog(f, issues); // 날짜 제목 형식 검사는 이번 범위 밖
    else checkConcept(f, issues);                    // concept·other
    checkLinks(bundle, f, issues);
  }
  return issues;
}
