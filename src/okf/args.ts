// CLI 인자 → 검색 설정. retrieve·prompt·check-answer·compare가 함께 쓴다.
// 잘못된 값은 조용히 넘기지 않고 오류 문구를 돌려준다. (예: --max abc가 "고른 개념 없음"으로 보이면 근거 없음과 구별되지 않는다.)
import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';
import { DEFAULT_OPTIONS, type Options } from './retrieve.ts';

export type SearchArgs = {
  options: Options;
  dir: string;
  now: Date;
  positionals: string[];
  extra: Record<string, string | boolean | undefined>; // extra로 등록한 옵션 값
};

export type ParsedArgs = { ok: true; args: SearchArgs } | { ok: false; error: string };

export type ParseConfig = {
  // compare처럼 fields·링크 확장을 설정 목록이 정하는 CLI는 true. 그때 --fields·--no-links는 알 수 없는 옵션이다.
  fixedSetting?: boolean;
  extra?: ParseArgsOptionsConfig; // CLI 고유 옵션 (예: check-answer --prompt)
};

const intAtLeast = (raw: string, min: number): number | null => {
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= min ? n : null;
};

// CLI가 --dir 없이 읽는 번들. 번들은 모두 bundles/ 아래에 둔다.
export const DEFAULT_BUNDLE_DIR = 'bundles/knowledge';

export function parseSearchArgs(argv: string[], config: ParseConfig = {}): ParsedArgs {
  const base: ParseArgsOptionsConfig = {
    max: { type: 'string', default: String(DEFAULT_OPTIONS.maxDocs) },
    min: { type: 'string', default: String(DEFAULT_OPTIONS.minScore) },
    dir: { type: 'string', default: DEFAULT_BUNDLE_DIR },
    now: { type: 'string' },
    'boost-meta': { type: 'boolean', default: false }, // title·tags 일치 가산 (fixedSetting에서도 받는다)
  };
  if (!config.fixedSetting) {
    base.fields = { type: 'string', default: DEFAULT_OPTIONS.fields };
    base['no-links'] = { type: 'boolean', default: false };
  }
  let values: Record<string, string | boolean | (string | boolean)[] | undefined>;
  let positionals: string[];
  try {
    ({ values, positionals } = parseArgs({ args: argv, allowPositionals: true, strict: true, options: { ...base, ...config.extra } }));
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  const s = (k: string) => values[k] as string;

  const fields = config.fixedSetting ? DEFAULT_OPTIONS.fields : s('fields');
  if (fields !== 'body' && fields !== 'body+meta') return { ok: false, error: `--fields는 body 또는 body+meta: ${fields}` };
  const maxDocs = intAtLeast(s('max'), 1);
  if (maxDocs === null) return { ok: false, error: `--max(상한)는 1 이상의 정수: ${s('max')}` };
  const minScore = intAtLeast(s('min'), 0);
  if (minScore === null) return { ok: false, error: `--min(기준)은 0 이상의 정수: ${s('min')}` };
  const now = values.now === undefined ? new Date() : new Date(s('now'));
  if (Number.isNaN(now.getTime())) return { ok: false, error: `--now는 ISO 8601 시각 (예: 2026-11-18T00:00:00Z): ${s('now')}` };

  const extra: SearchArgs['extra'] = {};
  for (const k of Object.keys(config.extra ?? {})) extra[k] = values[k] as string | boolean | undefined;
  return {
    ok: true,
    args: {
      options: {
        fields,
        followLinks: config.fixedSetting ? DEFAULT_OPTIONS.followLinks : !values['no-links'],
        maxDocs,
        minScore,
        boostMeta: values['boost-meta'] === true,
      },
      dir: s('dir'),
      now,
      positionals,
      extra,
    },
  };
}

// CLI용: 실패하면 문구를 찍고 종료 코드 2로 끝낸다.
export function searchArgsOrExit(argv: string[], usage: string, config: ParseConfig = {}): SearchArgs {
  const r = parseSearchArgs(argv, config);
  if (r.ok) return r.args;
  console.error(`${r.error}\n사용법: ${usage}`);
  process.exit(2);
}
