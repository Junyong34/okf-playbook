// 8회차(심화 2) 실습: normalizeVerified·trustTier·assess (tests/trust.test.ts). 순서: T1단계 → T2단계 → T3단계.
// 레슨: learn/lessons/0008-trust-lifecycle.html
import { parse } from 'yaml';
import type { Bundle } from './types.ts';
import { splitFrontmatter } from './validate.ts';

// ── frontmatter 읽기 (제공) ───────────────────────────────────────────
// 파싱할 수 없으면 null. 오류 보고는 validate가 맡는다.
export function readFrontmatter(bundle: Bundle, path: string): Record<string, unknown> | null {
  const text = bundle.get(path);
  if (text === undefined) return null;
  const { frontmatter } = splitFrontmatter(text);
  if (frontmatter === null) return null;
  try {
    const data = parse(frontmatter) ?? {};
    return typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// 날짜 값을 문자열로 둔다. YAML이 Date로 읽었으면 ISO 문자열로 바꾼다. (제공)
export function dateText(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString();
  if (v === undefined || v === null) return undefined;
  return String(v);
}

// ── 검토 기록 ─────────────────────────────────────────────────────────
// §5.2: verified는 { by, at } 검토 기록의 목록이다. by는 행위자(§7), at은 ISO 8601 시각.
export type Verification = { by: string; at?: string };

// T1단계: frontmatter의 verified 값을 목록으로 바꾼다.
//  - 키가 없으면(undefined·null) 빈 목록.
//  - 대시 없이 쓴 매핑 하나 { by, at }는 원소 하나짜리 목록으로 읽는다. 소비자의 MUST다(§5.2, §11).
//  - 목록이면 원소마다 읽는다. 매핑이 아니거나 by가 없는 원소는 건너뛴다.
//  - by는 String(...)으로, at은 dateText(...)로 읽는다. at이 없으면 at 키를 두지 않는다.
export function normalizeVerified(value: unknown): Verification[] {
  throw new Error('TODO T1단계: normalizeVerified');
}

// ── 신뢰 등급 ─────────────────────────────────────────────────────────
export type Tier = 'unverified' | 'machine-confirmed' | 'human-reviewed';

// T2단계: 검토 기록에서 신뢰 등급을 정한다 (§5.3).
//  - 검토 기록이 없으면 unverified.
//  - by가 'human:'으로 시작하는 기록이 하나라도 있으면 human-reviewed.
//  - 그 밖(에이전트·프로세스만)이면 machine-confirmed.
//  등급은 접두사로만 정한다(§7). 이름이 사람처럼 보여도 'human:'이 없으면 사람 검토가 아니다.
export function trustTier(verified: Verification[]): Tier {
  throw new Error('TODO T2단계: trustTier');
}

// ── 한 개념의 신뢰·수명 판정 ─────────────────────────────────────────
// 주의 표시는 고른 개념을 빼지 않고 함께 보여 준다. 신뢰 신호는 권고이고, 소비자는 개념을 거부하지 않는다(§5.3, §11).
export type Caution =
  | 'draft'          // §5.4 아직 검토 전, 불완전할 수 있음
  | 'deprecated'     // §5.4 기록용으로 남겨 둔 개념, 현재 내용이 아님
  | 'unknown-status' // draft·stable·deprecated가 아닌 status
  | 'stale'          // §5.5 now >= stale_after
  | 'bad-date';      // stale_after를 날짜로 읽을 수 없음

export type Assessment = {
  tier: Tier;
  latestVerifiedAt?: string; // 검토 기록 가운데 가장 늦은 at (§5.2 "얼마나 최근인가"). 날짜로 읽히는 at이 없으면 비운다
  status: string;            // 없으면 'stable' (§5.4)
  staleAfter?: string;
  stale: boolean;
  cautions: Caution[];
};

// T3단계: 개념 frontmatter와 현재 시각으로 판정한다.
//  - tier: normalizeVerified → trustTier.
//  - latestVerifiedAt: Date.parse로 비교해 가장 늦은 at을 원래 문자열 그대로 담는다.
//  - status: 없으면 'stable'. 'draft'·'deprecated'면 같은 이름의 주의, 세 값이 아니면 'unknown-status'.
//  - stale_after: dateText로 읽는다. Date.parse가 NaN이면 'bad-date'이고 stale은 false.
//    now.getTime() >= 그 시각이면 stale = true, 주의 'stale'. 같은 시각도 낡았다(§5.5 "on/after").
//  - cautions 순서: status 주의 → stale_after 주의.
export function assess(fm: Record<string, unknown>, now: Date): Assessment {
  throw new Error('TODO T3단계: assess');
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
  'bad-date': (a) => `stale_after를 날짜로 읽을 수 없다: ${a.staleAfter}`,
};

export function formatAssessment(a: Assessment): string[] {
  const when = a.latestVerifiedAt ? ` (최근 ${a.latestVerifiedAt})` : '';
  return [`신뢰: ${a.tier} · ${TIER[a.tier]}${when}`, ...a.cautions.map((c) => `주의: ${CAUTION[c](a)}`)];
}
