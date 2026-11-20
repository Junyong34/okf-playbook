// 8회차(심화 2) 실습: normalizeVerified·trustTier·assess 구현 완료 (tests/trust.test.ts). 순서: T1단계 → T2단계 → T3단계.
// OKF v0.3 기준으로 고쳤다 (2026-11-19): by·at 필수, 현재 기록만 등급에 반영, 읽을 수 없는 stale_after는 신선하지 않음, superseded_by.
// 레슨: learn/lessons/0008-trust-lifecycle.html
import type { Bundle } from './types.ts';
import { asList, dateText, frontmatterData, isBlank, parseTimestamp, readBundleFile } from './concept.ts';

// ── frontmatter 읽기 (제공) ───────────────────────────────────────────
// 개념 읽기 모듈(concept.ts)을 쓴다. 파싱할 수 없으면 null. 오류 보고는 validate가 맡는다.
export function readFrontmatter(bundle: Bundle, path: string): Record<string, unknown> | null {
  const file = readBundleFile(bundle, path);
  return file === null ? null : frontmatterData(file);
}

// 날짜 값을 문자열로 둔다 (concept.ts). 레슨·테스트가 이 경로로 import하므로 다시 내보낸다.
export { dateText };

// ── 검토 기록 ─────────────────────────────────────────────────────────
// §5.2: verified는 { by, at } 검토 기록의 목록이다. by는 행위자(§7), at은 시각(§5). v0.3에서 by와 at은 둘 다 필수다.
export type Verification = { by: string; at: string };

// 검토 기록과 무시한 항목 수. 무시한 항목은 validate가 incomplete-verified·bad-timestamp로, assess가 주의로 알린다(§11.2-3 SHOULD warn).
export type VerifiedRead = { events: Verification[]; ignored: number };

export function readVerified(value: unknown): VerifiedRead {
  const out: VerifiedRead = { events: [], ignored: 0 };
  for (const item of asList(value)) { // 빈 값은 없는 것, 대시 없는 매핑 하나 = 원소 하나짜리 목록 (§5.2, §11.2)
    const o = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>) : null;
    if (o === null || isBlank(o.by) || isBlank(o.at) || parseTimestamp(o.at) === null) {
      out.ignored++;
      continue;
    }
    out.events.push({ by: String(o.by), at: dateText(o.at)! });
  }
  return out;
}

// T1단계: frontmatter의 verified 값을 목록으로 바꾼다.
//  - 키가 없거나 빈 값(undefined·null·''·[])이면 빈 목록 (§11.2-1).
//  - 대시 없이 쓴 매핑 하나 { by, at }는 원소 하나짜리 목록으로 읽는다. 소비자의 MUST다(§5.2, §11.2-2).
//  - 목록이면 원소마다 읽는다. 매핑이 아니거나, by나 at이 없거나, at을 시각으로 읽을 수 없는 원소는 건너뛴다 (§5.2, §11.2-3).
//  - by는 String(...)으로, at은 dateText(...)로 읽는다.
export function normalizeVerified(value: unknown): Verification[] {
  // T1단계 (완료)
  return readVerified(value).events;
}

// generated.at (§5.2). generated에 by가 없으면 항목을 무시하고(§11.2-3), at을 시각으로 읽을 수 없으면 없는 것으로 본다.
export function generatedAt(fm: Record<string, unknown>): string | undefined {
  const g = fm.generated;
  if (!g || typeof g !== 'object' || Array.isArray(g)) return undefined;
  const o = g as Record<string, unknown>;
  if (isBlank(o.by) || parseTimestamp(o.at) === null) return undefined;
  return dateText(o.at);
}

// 현재 기록: at이 generated.at과 같거나 늦다. generated가 없으면 모두 현재다 (§5.3).
export function isCurrent(v: Verification, generated?: string): boolean {
  if (generated === undefined) return true;
  const g = parseTimestamp(generated);
  const t = parseTimestamp(v.at);
  return g === null || (t !== null && t >= g);
}

// ── 신뢰 등급 ─────────────────────────────────────────────────────────
export type Tier = 'unverified' | 'machine-confirmed' | 'human-reviewed';

// T2단계: 검토 기록에서 신뢰 등급을 정한다 (§5.3).
//  - 현재 기록만 센다(§5.3, §11.2 MUST). generated를 주지 않으면 모든 기록이 현재다.
//  - 현재 기록이 없으면 unverified.
//  - by가 'human:'으로 시작하는 현재 기록이 하나라도 있으면 human-reviewed.
//  - 그 밖(에이전트·프로세스·team:만)이면 machine-confirmed.
//  등급은 접두사로만 정한다(§7). 이름이 사람처럼 보여도 'human:'이 없으면 사람 검토가 아니다.
export function trustTier(verified: Verification[], generated?: string): Tier {
  // T2단계 (완료)
  const current = verified.filter((v) => isCurrent(v, generated));
  if (current.length === 0) return 'unverified';
  return current.some((v) => v.by.startsWith('human:')) ? 'human-reviewed' : 'machine-confirmed';
}

// ── 한 개념의 신뢰·수명 판정 ─────────────────────────────────────────
// 주의 표시는 고른 개념을 빼지 않고 함께 보여 준다. 신뢰 신호는 권고이고, 소비자는 개념을 거부하지 않는다(§5.3, §11.2).
export type Caution =
  | 'draft'          // §5.4 아직 검토 전, 불완전할 수 있음
  | 'deprecated'     // §5.4 기록용으로 남겨 둔 개념, 현재 내용이 아님
  | 'unknown-status' // §5.4 draft·stable·deprecated가 아닌 status. stable이 아니다
  | 'stale'          // §5.5 now >= stale_after
  | 'bad-date'       // §5.5 stale_after를 시각으로 읽을 수 없음. 신선하다고 보지 않는다
  | 'bad-verified';  // §5.2 · §11.2-3 by·at이 없거나 at을 읽을 수 없어 무시한 verified 항목이 있음

export type Assessment = {
  tier: Tier;
  latestVerifiedAt?: string; // 현재 기록 가운데 가장 늦은 at (§5.2 "most recent check"). 현재 기록이 없으면 비운다
  generatedAt?: string;      // generated.at (§5.2). 현재 기록을 가르는 기준
  history: Verification[];   // 현재가 아닌 기록: 마지막 변경 전 검토 (§5.3 MAY show)
  ignoredVerified?: number;  // 무시한 verified 항목 수. 0이면 두지 않는다
  status: string;            // 없거나 빈 값이면 'stable' (§5.4). 모르는 값은 원래 값 그대로
  supersededBy?: string;     // status: deprecated일 때 superseded_by 원래 값 (§5.4). 해석은 호출하는 쪽(ask)이 번들로 한다
  staleAfter?: string;
  stale: boolean;            // now >= stale_after
  fresh: boolean;            // 신선하다: stale_after가 없거나, 읽을 수 있고 아직 지나지 않았다. 읽을 수 없으면 false (§5.5)
  cautions: Caution[];
};

// T3단계: 개념 frontmatter와 현재 시각으로 판정한다.
//  - tier: normalizeVerified → trustTier(기록, generatedAt). 현재 기록만 센다.
//  - latestVerifiedAt: 현재 기록 가운데 parseTimestamp로 비교해 가장 늦은 at을 원래 문자열 그대로 담는다.
//  - history: 현재가 아닌 기록, 파일 순서대로.
//  - status: 없거나 빈 값이면 'stable'. 'draft'·'deprecated'면 같은 이름의 주의, 세 값이 아니면 'unknown-status'.
//    deprecated이고 superseded_by가 있으면 supersededBy에 담는다.
//  - stale_after: 빈 값은 없는 것. parseTimestamp가 null이면 'bad-date', stale·fresh 모두 false.
//    now.getTime() >= 그 시각이면 stale = true, 주의 'stale'. 같은 시각도 낡았다(§5.5 "on or after").
//  - cautions 순서: status 주의 → stale_after 주의 → bad-verified.
export function assess(fm: Record<string, unknown>, now: Date): Assessment {
  // T3단계 (완료)
  const { events, ignored } = readVerified(fm.verified);
  const generated = generatedAt(fm);
  const a: Assessment = { tier: trustTier(events, generated), history: [], status: 'stable', stale: false, fresh: true, cautions: [] };
  if (generated !== undefined) a.generatedAt = generated;
  let latest = -Infinity;
  for (const v of events) {
    if (!isCurrent(v, generated)) {
      a.history.push(v);
      continue;
    }
    const t = parseTimestamp(v.at)!;
    if (t > latest) {
      latest = t;
      a.latestVerifiedAt = v.at;
    }
  }
  if (!isBlank(fm.status)) a.status = String(fm.status);
  if (a.status === 'draft' || a.status === 'deprecated') a.cautions.push(a.status);
  else if (a.status !== 'stable') a.cautions.push('unknown-status');
  if (a.status === 'deprecated' && typeof fm.superseded_by === 'string' && fm.superseded_by.trim() !== '') a.supersededBy = fm.superseded_by;
  const staleAfter = dateText(fm.stale_after);
  if (staleAfter !== undefined) {
    a.staleAfter = staleAfter;
    const t = parseTimestamp(fm.stale_after);
    if (t === null) {
      a.fresh = false; // 읽을 수 없는 값을 신선하다고 보지 않는다 (§5.5, §11.2 MUST NOT)
      a.cautions.push('bad-date');
    } else if (now.getTime() >= t) {
      a.stale = true;
      a.fresh = false;
      a.cautions.push('stale');
    }
  }
  if (ignored > 0) {
    a.ignoredVerified = ignored;
    a.cautions.push('bad-verified');
  }
  return a;
}

// ── 출력 (제공) ─────────────────────────────────────────────────────
const TIER: Record<Tier, string> = {
  unverified: '검토 기록 없음',
  'machine-confirmed': '기계 확인',
  'human-reviewed': '사람 검토',
};

const CAUTION: Record<Caution, (a: Assessment) => string> = {
  draft: () => 'status: draft, 아직 검토 전이다',
  deprecated: () => 'status: deprecated, 현재 내용이 아니다',
  'unknown-status': (a) => `알 수 없는 status: ${a.status}`,
  stale: (a) => `stale_after ${a.staleAfter}가 지났다`,
  'bad-date': (a) => `stale_after를 시각으로 읽을 수 없어 신선하다고 보지 않는다: ${a.staleAfter}`,
  'bad-verified': (a) => `by·at이 없거나 at을 읽을 수 없는 verified 항목 ${a.ignoredVerified}개를 무시했다`,
};

export function formatAssessment(a: Assessment): string[] {
  const when = a.latestVerifiedAt ? ` (최근 ${a.latestVerifiedAt})` : '';
  const out = [`신뢰: ${a.tier} · ${TIER[a.tier]}${when}`];
  // 현재가 아닌 기록은 등급에 넣지 않고 이력으로만 보여 준다 (§5.3).
  for (const v of a.history) out.push(`이력: 마지막 변경(${a.generatedAt}) 전 검토 ${v.by} (${v.at})`);
  out.push(...a.cautions.map((c) => `주의: ${CAUTION[c](a)}`));
  if (a.supersededBy) out.push(`대체: ${a.supersededBy}`);
  return out;
}
