// 상담 대화 기록: 실행(QaRun)에서 화면에 필요한 것만 남긴 ChatTurn과, 그 목록을 브라우저 저장소에 읽고 쓰는 함수.
// - 문서 본문(prepared)은 저장하지 않는다. 상담 화면은 인용 링크용 providedPaths만 쓴다.
// - 번들마다 최근 HISTORY_LIMIT개만 남긴다. 형식이 다르거나 깨졌으면 빈 기록으로 시작한다(마이그레이션 안 함).
// - 생성 도중 저장된 실행(streaming)은 복원할 때 stopped로 바꾼다.
// node 테스트가 별칭을 못 읽으므로 이 파일은 상대 경로로만 import한다.
import type { QaRun, RunPhase } from '../qa/runs.ts';
import type { GenerationError, Refusal } from '../../../../shared/claude/types.ts';

export const HISTORY_KEY = 'okf.chat.v1';
export const HISTORY_VERSION = 1;
export const HISTORY_LIMIT = 50;

export type ChatTurn = {
  id: string;
  question: string;
  phase: RunPhase;
  text: string;
  refusal: Refusal | null;
  error: GenerationError | null;
  startedAt: number;
  finishedAt: number | null;
  providedPaths: string[];
};

// localStorage가 이 모양을 만족한다. 테스트는 Map으로 만든 가짜를 넣는다.
export type HistoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type Stored = { version: typeof HISTORY_VERSION; bundles: Record<string, ChatTurn[]> };

export function toChatTurn(run: QaRun): ChatTurn {
  return {
    id: run.id,
    question: run.input.question,
    phase: run.phase,
    text: run.text,
    refusal: run.result?.refusal ?? null,
    error: run.error,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    providedPaths: run.prepared.assembled.record.providedPaths,
  };
}

const isTurn = (value: unknown): value is ChatTurn => {
  const turn = value as ChatTurn | null;
  return typeof turn === 'object' && turn !== null
    && typeof turn.id === 'string'
    && typeof turn.question === 'string'
    && typeof turn.phase === 'string'
    && typeof turn.text === 'string'
    && typeof turn.startedAt === 'number'
    && Array.isArray(turn.providedPaths);
};

function readAll(storage: HistoryStorage): Stored['bundles'] {
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (raw === null) return {};
    const parsed = JSON.parse(raw) as Partial<Stored> | null;
    if (parsed?.version !== HISTORY_VERSION || typeof parsed.bundles !== 'object' || parsed.bundles === null) return {};
    return parsed.bundles;
  } catch {
    return {};
  }
}

export function loadHistory(storage: HistoryStorage, bundleId: string): ChatTurn[] {
  const turns = readAll(storage)[bundleId];
  if (!Array.isArray(turns)) return [];
  return turns.filter(isTurn).map((turn) =>
    turn.phase === 'streaming' ? { ...turn, phase: 'stopped', finishedAt: turn.finishedAt ?? turn.startedAt } : turn,
  );
}

// 저장에 실패해도(용량 초과, 저장소 막힘) 화면은 계속 쓴다. 기록만 남지 않는다.
export function saveHistory(storage: HistoryStorage, bundleId: string, turns: readonly ChatTurn[]): void {
  const bundles = readAll(storage);
  if (turns.length === 0) delete bundles[bundleId];
  else bundles[bundleId] = turns.slice(-HISTORY_LIMIT);
  try {
    if (Object.keys(bundles).length === 0) storage.removeItem(HISTORY_KEY);
    else storage.setItem(HISTORY_KEY, JSON.stringify({ version: HISTORY_VERSION, bundles } satisfies Stored));
  } catch {
    // 무시한다
  }
}
