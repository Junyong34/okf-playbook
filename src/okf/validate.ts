// 3회차 실습: 1~6단계 구현 완료 (tests/validate.test.ts).
// 순서: 1단계 splitFrontmatter → 2단계 resolveLink → 4단계 checkConcept·checkIndex → 5·6단계 checkLinks
// 레슨: learn/lessons/0003-validate.html
import type { Bundle, Issue } from './types.ts';
import { readBundle, resolveLink, type BundleFile } from './concept.ts';

// 1·2단계 함수(splitFrontmatter·resolveLink)와 extractLinks는 개념 읽기 모듈(concept.ts)로 옮겼다.
// 레슨·테스트가 이 경로로 import하므로 그대로 다시 내보낸다.
export { extractLinks, resolveLink, splitFrontmatter, type Split } from './concept.ts';

// ── 3. 검사 ──────────────────────────────────────────────────────────
function checkConcept(f: BundleFile, issues: Issue[]): void {
  // 4단계 (완료) — 명세 §11의 1·2번 조건
  const file = f.path;
  if (f.frontmatter.state === 'absent') {
    issues.push({ level: 'error', rule: 'yaml-parse', file, message: '파일 맨 위에 `---`로 열고 닫는 frontmatter가 없습니다 (§4, §11).' });
    return;
  }
  if (f.frontmatter.state === 'invalid') {
    issues.push({ level: 'error', rule: 'yaml-parse', file, message: `YAML을 파싱할 수 없습니다: ${f.frontmatter.reason} (§11)` });
    return;
  }
  const type = f.frontmatter.data.type;
  if (type === undefined || type === null || String(type).trim() === '') {
    issues.push({ level: 'error', rule: 'missing-type', file, message: '비어 있지 않은 `type`이 없습니다 (§4.1, §11).' });
  }
}

function checkIndex(f: BundleFile, issues: Issue[]): void {
  // 4단계 (완료) — 명세 §8·§12
  const file = f.path;
  if (f.frontmatter.state === 'absent') return; // 인덱스는 frontmatter가 없는 것이 기본
  if (f.frontmatter.state === 'invalid') {
    issues.push({ level: 'error', rule: 'yaml-parse', file, message: `YAML을 파싱할 수 없습니다: ${f.frontmatter.reason}` });
    return;
  }
  if (file !== 'index.md') {
    issues.push({ level: 'error', rule: 'index-frontmatter', file, message: '하위 디렉터리 index.md에는 frontmatter를 둘 수 없습니다 (§8).' });
    return;
  }
  for (const key of Object.keys(f.frontmatter.data)) {
    if (key !== 'okf_version') {
      issues.push({ level: 'error', rule: 'index-frontmatter', file, message: `루트 index.md frontmatter에는 okf_version만 둘 수 있습니다: \`${key}\` (§8, §12).` });
    }
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
      issues.push({ level: 'warning', rule: 'broken-link', file, message: `\`${target}\` → \`${resolved}\`가 번들에 없습니다. 읽기는 계속합니다 (§6.1, §11).` });
    }
  }
}

export function validateBundle(bundle: Bundle): Issue[] {
  const issues: Issue[] = [];
  for (const f of readBundle(bundle)) {
    if (f.kind === 'index') checkIndex(f, issues);
    else if (f.kind === 'concept') checkConcept(f, issues); // log.md 구조 검사는 이번 범위 밖
    checkLinks(bundle, f, issues);
  }
  return issues;
}
