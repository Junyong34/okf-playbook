// 3회차 실습: 1~6단계 구현 완료 (tests/validate.test.ts). OKF v0.3 기준으로 4단계를 고쳤다 (2026-11-19).
// 순서: 1단계 splitFrontmatter → 2단계 resolveLink → 4단계 checkConcept·checkIndex → 5·6단계 checkLinks
// 레슨: learn/lessons/0003-validate.html
//
// 공식 검증기(.agents/skills/okf-generate/scripts/validate.py)의 규칙을 이 파일로 옮겼다 (2026-11-19).
// 이 저장소에서는 이 검증기(pnpm validate)가 기준이고, 공식 검증기(pnpm okf:validate)는 판정을 대조할 때 쓴다.
// 아직 옮기지 않은 것: Attested Computation 규칙(W111~W114·W126·I205, §10). 이 번들에는 계산 개념이 없다.
import type { Bundle, Issue, Level, Rule } from './types.ts';
import {
  asList, frontmatterData, isBlank, isMarkdown, parseTimestamp, readBundle, resolveLink, resolvePathField,
  type BundleFile,
} from './concept.ts';

// 1·2단계 함수(splitFrontmatter·resolveLink)와 extractLinks는 개념 읽기 모듈(concept.ts)로 옮겼다.
// 레슨·테스트가 이 경로로 import하므로 그대로 다시 내보낸다.
export { extractLinks, resolveLink, splitFrontmatter, type Split } from './concept.ts';

export type ValidateOptions = {
  now?: Date; // 주면 stale_after가 지난 개념을 stale-concept(정보)로 알린다. 없으면 시각에 따라 달라지는 검사는 하지 않는다
};

// ── 형식 ─────────────────────────────────────────────────────────────
// §7: <producer>/<version> (에이전트·도구) 또는 <scheme>:<id> (human:·team:·process: 등)
const ACTOR_RE = /^([^\s/:]+\/\S+|[A-Za-z][A-Za-z0-9+.-]*:\S+)$/;
// §8.1: license는 SPDX 표현식이거나 번들 안 라이선스 파일 경로
const SPDX_RE = /^[A-Za-z0-9.+-]+( (AND|OR|WITH) [A-Za-z0-9.+-]+)*$/;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['draft', 'stable', 'deprecated'];
// §4.1: 명세가 정한 키. 이 밖의 키는 확장 키이고 x- 접두사를 권장한다. timestamp는 v0.1 대체 키다(부록 B).
const KNOWN_KEYS = new Set([
  'type', 'title', 'description', 'resource', 'tags', 'sources', 'usage_window',
  'generated', 'verified', 'status', 'superseded_by', 'stale_after', 'runtime',
  'parameters', 'computation', 'executor', 'attester', 'timestamp',
]);

type Mapping = Record<string, unknown>;
const asMapping = (v: unknown): Mapping | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Mapping) : null);

// 한 파일의 이슈를 모은다.
function reporter(issues: Issue[], file: string) {
  return (level: Level, rule: Rule, message: string) => issues.push({ level, rule, file, message });
}
type Report = ReturnType<typeof reporter>;

// ── 3. 검사 ──────────────────────────────────────────────────────────
// 4단계 공통: frontmatter 블록이 있으면 YAML 매핑으로 파싱되어야 한다 (§4, §11.1-1). 파싱 실패만 오류다.
function checkParse(f: BundleFile, report: Report): boolean {
  if (f.frontmatter.state !== 'invalid') return true;
  report('error', 'yaml-parse', `YAML을 파싱할 수 없습니다: ${f.frontmatter.reason} (§4, §11.1)`);
  return false;
}

function checkConcept(bundle: Bundle, f: BundleFile, report: Report, options: ValidateOptions): void {
  // 4단계 (완료) — 명세 §3.2·§11.1
  // v0.3: frontmatter나 type이 없는 .md는 오류가 아니라 "개념이 아닌 파일"이다. 소비자는 건너뛰고, 검증기는 경고한다(SHOULD).
  if (!checkParse(f, report)) return;
  if (f.kind === 'other') {
    const why = f.frontmatter.state === 'absent' ? 'frontmatter가 없습니다' : '비어 있지 않은 `type`이 없습니다';
    report('warning', 'not-a-concept', `${why}. 개념이 아닌 파일로 건너뜁니다 (§3.2).`);
    return;
  }
  // 4단계 추가 (v0.3) — 소비자가 무시하거나 다르게 읽을 값을 미리 알린다 (§4, §5, §6.2, §7, §11.2).
  const fm = frontmatterData(f)!;
  const field = fieldChecks(bundle, f.path, report);
  checkStrings(fm, report);
  checkTags(fm, report);
  checkStatus(fm, report, field);
  const generated = checkGenerated(fm, report, field);
  checkVerified(fm, report, field, generated);
  const ids = checkSources(fm, report, field);
  checkStaleAfter(fm, report, options);
  if (!isBlank(fm.resource)) field.path('resource', fm.resource);
  checkFootnotes(f.body, ids, report);
  const unknown = Object.keys(fm).filter((k) => !KNOWN_KEYS.has(k) && !k.startsWith('x-')).sort();
  if (unknown.length > 0) {
    report('info', 'unprefixed-extension-key', `x- 접두사가 없는 확장 키: ${unknown.join(', ')}. 앞으로 명세가 같은 이름을 정할 수 있다 (§4.1).`);
  }
}

// 값 하나를 보는 공용 검사. 개념 검사와 루트 index 검사가 함께 쓴다.
function fieldChecks(bundle: Bundle, file: string, report: Report) {
  return {
    // §7 행위자 형식. 이 형식이 아니면 human-reviewed 등급을 받을 수 없다.
    actor(name: string, v: unknown) {
      if (typeof v !== 'string' || !ACTOR_RE.test(v)) {
        report('warning', 'bad-actor', `${name}은 행위자 형식(<producer>/<version> 또는 <scheme>:<id>, 예: human:<id>)이어야 합니다. 지금 값: ${String(v)} (§7)`);
      }
    },
    // §5 시각 형식. 읽은 시각(밀리초)을 돌려준다. 읽을 수 없으면 null.
    time(name: string, v: unknown): number | null {
      const t = parseTimestamp(v);
      if (t === null) report('warning', 'bad-timestamp', `\`${name}: ${String(v)}\`는 허용된 시각 형식(오프셋 있는 date-time, 날짜만)이 아닙니다 (§5).`);
      return t;
    },
    // §6.2 경로 필드. URL·범위 설명·번들 밖은 외부라 보지 않는다.
    path(name: string, v: unknown): void {
      if (typeof v !== 'string' || /\s/.test(v) || /^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith('//')) return;
      const { target, legacy } = resolvePathField(bundle, file, v);
      if (target === null) return;
      if (legacy) {
        report('warning', 'legacy-path', `${name} \`${v}\`는 v0.2 대체 해석(번들 루트 기준)으로만 풀립니다. \`/${v}\`로 씁니다 (§6.2, §12.1).`);
      } else if (!bundle.has(target) && !bundle.has(`${target}/index.md`)) {
        report('warning', 'missing-path-target', `${name} \`${v}\` → \`${target}\`가 번들에 없습니다 (§6.2).`);
      }
    },
  };
}
type FieldChecks = ReturnType<typeof fieldChecks>;

// §4: 문자열이어야 할 키가 따옴표 없는 숫자·불리언 등으로 읽혔다. type은 문자열이 아니면 이미 개념이 아니다.
function checkStrings(fm: Mapping, report: Report): void {
  for (const key of ['title', 'description', 'status']) {
    const v = fm[key];
    if (v !== undefined && v !== null && typeof v !== 'string') {
      report('warning', 'unquoted-value', `${key}가 문자열이 아니라 ${v instanceof Date ? 'date' : typeof v}로 읽힙니다. 따옴표로 감쌉니다 (§4).`);
    }
  }
}

// §4.1 · §11.2-2: tags는 목록이다. 스칼라는 태그 하나로 읽히고 쉼표로 나뉘지 않는다.
function checkTags(fm: Mapping, report: Report): void {
  const tags = fm.tags;
  if (typeof tags === 'string' && tags.trim() !== '') {
    const hint = tags.includes(',') ? ` 소비자는 \`${tags}\` 전체를 태그 하나로 읽습니다.` : '';
    report('warning', 'tags-not-list', `tags는 YAML 목록으로 씁니다 (§4.1, §11.2).${hint}`);
  } else if (tags !== undefined && tags !== null && typeof tags !== 'string' && !Array.isArray(tags)) {
    report('warning', 'tags-not-list', 'tags는 문자열의 YAML 목록으로 씁니다 (§4.1).');
  }
}

// §5.4: status 어휘와 superseded_by
function checkStatus(fm: Mapping, report: Report, field: FieldChecks): void {
  const status = fm.status;
  if (!isBlank(status) && !STATUSES.includes(status as string)) {
    report('warning', 'unknown-status', `status는 draft·stable·deprecated 가운데 하나입니다. 소비자는 \`${String(status)}\`를 현재 지식이 아니라고 봅니다 (§5.4).`);
  }
  if (isBlank(fm.superseded_by)) return;
  if (status !== 'deprecated') {
    report('warning', 'superseded-without-deprecated', 'superseded_by는 status: deprecated일 때만 뜻이 있습니다 (§5.4).');
  }
  field.path('superseded_by', fm.superseded_by);
}

// §5.2: generated는 by가 있는 매핑이다. 읽은 generated.at(밀리초)을 돌려준다.
function checkGenerated(fm: Mapping, report: Report, field: FieldChecks): number | null {
  if (isBlank(fm.generated)) return null;
  const g = asMapping(fm.generated);
  if (g === null || isBlank(g.by)) {
    report('warning', 'bad-generated', 'generated는 by를 가진 매핑입니다. 예: { by: "claude-code/<model>", at: "…" } (§5.2).');
    return null;
  }
  field.actor('generated.by', g.by);
  if (isBlank(g.at)) return null;
  const t = field.time('generated.at', g.at);
  if (t !== null && DATE_ONLY_RE.test(String(g.at))) {
    report('warning', 'date-only-trust-time', 'generated.at은 verified[].at과 비교하므로 date-time으로 씁니다 (§5).');
  }
  return t;
}

// §5.2 · §5.3: 검토 기록의 모양과, 현재 기록이 하나도 없는지
function checkVerified(fm: Mapping, report: Report, field: FieldChecks, generated: number | null): void {
  const times: number[] = [];
  asList(fm.verified).forEach((item, i) => {
    const o = asMapping(item);
    if (o === null || isBlank(o.by) || isBlank(o.at)) {
      report('warning', 'incomplete-verified', `verified ${i + 1}번째 항목에 by와 at이 둘 다 있어야 합니다. 소비자는 이 항목을 무시합니다 (§5.2, §11.2).`);
      return;
    }
    field.actor(`verified[${i}].by`, o.by);
    const t = field.time(`verified[${i}].at`, o.at);
    if (t === null) return;
    times.push(t);
    if (DATE_ONLY_RE.test(String(o.at))) {
      report('warning', 'date-only-trust-time', `verified[${i}].at은 generated.at과 비교하므로 date-time으로 씁니다 (§5).`);
    }
  });
  if (times.length > 0 && generated !== null && times.every((t) => t < generated)) {
    report('info', 'stale-verification', '모든 검토 기록이 generated.at보다 이릅니다. 소비자는 이 개념을 unverified로 읽습니다. 다시 검토를 받아야 합니다 (§5.3).');
  }
}

// §5.1: sources 항목과 usage_window. 본문 각주와 맞춰 볼 id 목록을 돌려준다.
function checkSources(fm: Mapping, report: Report, field: FieldChecks): Set<string> {
  const ids = new Set<string>();
  const window = (name: string, v: unknown) => {
    const w = asMapping(v);
    if (w === null || isBlank(w.from) || isBlank(w.to)) {
      report('warning', 'bad-usage-window', `${name}는 시각 두 개로 된 { from, to } 매핑입니다 (§5.1).`);
      return;
    }
    field.time(`${name}.from`, w.from);
    field.time(`${name}.to`, w.to);
  };
  const shared = fm.usage_window;
  if (!isBlank(shared)) window('usage_window', shared);
  asList(fm.sources).forEach((item, i) => {
    const name = `sources[${i}]`;
    const s = asMapping(item);
    if (s === null || isBlank(s.resource)) {
      report('warning', 'missing-source-resource', `${name}에 resource가 없습니다. 소비자는 이 항목을 무시합니다 (§5.1, §11.2).`);
      return;
    }
    if (!isBlank(s.id)) {
      const id = String(s.id);
      if (ids.has(id)) report('warning', 'duplicate-source-id', `${name}.id \`${id}\`가 겹칩니다. 각주가 어느 출처를 가리키는지 정할 수 없습니다 (§5.1).`);
      ids.add(id);
    }
    if (!isBlank(s.author)) field.actor(`${name}.author`, s.author);
    if (!isBlank(s.last_modified)) field.time(`${name}.last_modified`, s.last_modified);
    if (!isBlank(s.usage_window)) window(`${name}.usage_window`, s.usage_window);
    if (!isBlank(s.usage_count) && isBlank(shared) && isBlank(s.usage_window)) {
      report('warning', 'usage-count-window', `${name}.usage_count에는 기간을 알려 줄 usage_window가 필요합니다 (§5.1).`);
    }
    field.path(`${name}.resource`, s.resource);
  });
  return ids;
}

// §5.5: stale_after. 읽을 수 없는 값은 절대 신선하지 않다.
function checkStaleAfter(fm: Mapping, report: Report, options: ValidateOptions): void {
  const v = fm.stale_after;
  if (isBlank(v)) return;
  const t = parseTimestamp(v);
  if (t === null) {
    report('warning', 'bad-timestamp', `\`stale_after: ${String(v)}\`를 시각으로 읽을 수 없습니다. 소비자는 이 개념을 신선하지 않다고 봅니다 (§5, §5.5).`);
  } else if (options.now && options.now.getTime() >= t) {
    report('info', 'stale-concept', `stale_after ${String(v)}가 지났습니다. 내용을 다시 확인할 때입니다 (§5.5).`);
  }
}

// §5.1: 본문 각주 라벨은 sources id와 같아야 한다. 코드 블록·인라인 코드 안은 보지 않는다. 라벨마다 한 번만 알린다.
function checkFootnotes(body: string, ids: Set<string>, report: Report): void {
  const reported = new Set<string>();
  for (const line of proseLines(body)) {
    for (const m of line.matchAll(/\[\^([^\]\s]+)\]/g)) {
      const label = m[1];
      if (ids.has(label) || reported.has(label)) continue;
      reported.add(label);
      report('warning', 'unknown-footnote', `각주 [^${label}]에 맞는 sources id가 없습니다 (§5.1).`);
    }
  }
}

// 펜스 코드 블록과 들여 쓴 코드를 뺀 본문 줄. 인라인 코드도 지운다.
function proseLines(body: string): string[] {
  const out: string[] = [];
  let fence: string | null = null;
  for (const line of body.split('\n')) {
    const stripped = line.trimStart();
    if (fence === null && (stripped.startsWith('```') || stripped.startsWith('~~~'))) {
      fence = stripped.slice(0, 3);
      continue;
    }
    if (fence !== null) {
      if (stripped.startsWith(fence)) fence = null;
      continue;
    }
    if (line.startsWith('    ') || line.startsWith('\t')) continue;
    out.push(line.replace(/`[^`]*`/g, ''));
  }
  return out;
}

function checkIndex(bundle: Bundle, f: BundleFile, report: Report): void {
  // 4단계 (완료) — 명세 §8·§8.1
  if (f.path !== 'index.md') {
    // 하위 디렉터리 index.md에는 frontmatter가 없다 (§8).
    if (f.frontmatter.state !== 'absent') {
      report('error', 'index-frontmatter', '하위 디렉터리 index.md에는 frontmatter를 둘 수 없습니다 (§8).');
    }
    return;
  }
  // 루트 index.md: okf_version·title·description·license와 확장 키를 둘 수 있다 (§8.1). 모르는 키도 오류가 아니다 (§4.1).
  if (!checkParse(f, report)) return;
  const fm = f.frontmatter.state === 'ok' ? f.frontmatter.data : {};
  const v = fm.okf_version;
  if (isBlank(v)) {
    report('warning', 'missing-okf-version', '루트 index.md frontmatter에 `okf_version: "0.3"`을 두는 것을 권장합니다 (§8.1).');
  } else if (typeof v !== 'string') {
    report('warning', 'unquoted-version', `okf_version은 따옴표로 감싼 문자열로 씁니다. 예: "0.3" (§4, §8.1). 지금 값: ${String(v)}`);
  }
  const license = fm.license;
  if (typeof license === 'string' && !SPDX_RE.test(license)) {
    const { target } = resolvePathField(bundle, 'index.md', license);
    if (target === null || !bundle.has(target)) {
      report('warning', 'bad-license', `license \`${license}\`는 SPDX 표현식도 번들 안 파일도 아닙니다 (§8.1).`);
    }
  }
}

function checkLog(f: BundleFile, report: Report): void {
  // 4단계 추가 (v0.3) — log.md에는 frontmatter가 없다 (§9, §11.1-2)
  if (f.frontmatter.state !== 'absent') {
    report('error', 'log-frontmatter', 'log.md에는 frontmatter를 둘 수 없습니다 (§9).');
  }
  // 날짜 제목은 ## YYYY-MM-DD이고 최신 날짜가 먼저다 (§9).
  const dates: string[] = [];
  for (const line of f.body.split('\n')) {
    if (!line.startsWith('## ')) continue;
    const heading = line.slice(3).trim();
    if (DATE_ONLY_RE.test(heading)) dates.push(heading);
    else report('error', 'log-date-heading', `log.md 날짜 제목은 YYYY-MM-DD입니다. 지금 제목: ${heading} (§9).`);
  }
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] > dates[i - 1]) report('warning', 'log-order', `log.md는 최신 날짜를 먼저 씁니다. ${dates[i]}가 ${dates[i - 1]} 뒤에 있습니다 (§9).`);
  }
}

function checkLinks(bundle: Bundle, f: BundleFile, report: Report): void {
  // 5·6단계 (완료) — 명세 위반이 아니므로 모두 warning
  for (const target of f.links) {
    const resolved = resolveLink(f.path, target);
    if (resolved === null) {
      report('warning', 'link-outside-bundle', `\`${target}\`가 번들 루트 밖을 가리킵니다.`);
      continue;
    }
    if (target.startsWith('/')) {
      report('warning', 'team/relative-links', `\`${target}\`: 팀 규칙상 번들 안 링크는 상대 경로로 씁니다.`);
    }
    if (!bundle.has(resolved) && !bundle.has(`${resolved}/index.md`)) {
      report('warning', 'broken-link', `\`${target}\` → \`${resolved}\`가 번들에 없습니다. 읽기는 계속합니다 (§6.1, §11.2).`);
    }
  }
}

export function validateBundle(bundle: Bundle, options: ValidateOptions = {}): Issue[] {
  const issues: Issue[] = [];
  if (![...bundle.keys()].some(isMarkdown)) return issues; // 빈 번들
  if (!bundle.has('index.md')) {
    issues.push({ level: 'warning', rule: 'missing-root-index', file: '.', message: '번들 루트에 `okf_version: "0.3"`을 선언한 index.md를 둡니다 (§8.1).' });
  }
  for (const f of readBundle(bundle)) {
    const report = reporter(issues, f.path);
    if (f.kind === 'index') checkIndex(bundle, f, report);
    else if (f.kind === 'log') checkLog(f, report);
    else checkConcept(bundle, f, report, options); // concept·other
    checkLinks(bundle, f, report);
  }
  return issues;
}
