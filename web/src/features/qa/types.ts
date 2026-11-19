// 질문 하나를 처리한 결과(실행)의 타입. 상담 화면과 디버깅 화면이 같이 쓴다.
import type { Asked } from '@okf/ask.ts';
import type { Options as RetrievalOptions } from '@okf/retrieve.ts';
import type { Assembled } from '@okf/request.ts';
import type { AnswerCheck } from '@okf/answer.ts';
import type { GenerationSettings } from '@/config/models.ts';
import type { GenerationError } from '@/lib/claude/errors.ts';
import type { ApiRequestPreview, GenerationResult } from '@/lib/claude/types.ts';

export type { RetrievalOptions };

export type QaInput = {
  bundleId: string;
  question: string;
  retrieval: RetrievalOptions;
  voiceEnabled: boolean;
  generation: GenerationSettings;
};

// 모델을 부르기 전까지 만든 것: 검색 결과 + 모델 요청 + 요청 조립 기록 + API 파라미터 미리보기
export type PreparedRun = {
  asked: Asked;
  assembled: Assembled;
  apiRequest: ApiRequestPreview | null; // 고른 개념이 없으면 null
};

// idle → (assembled | skipped | streaming → done | stopped | error)
//  - assembled: 조립만 보기(모델 호출 없음)
//  - skipped: 고른 개념이 0개라 모델 요청을 생략
export type RunPhase = 'streaming' | 'done' | 'stopped' | 'error' | 'assembled' | 'skipped';

export type QaRun = {
  id: string;
  input: QaInput;
  startedAt: number;
  finishedAt: number | null;
  prepared: PreparedRun;
  phase: RunPhase;
  text: string;                     // 지금까지 받은 답변 (스트리밍 중에는 부분)
  result: GenerationResult | null;
  check: AnswerCheck | null;        // 답변이 끝난 뒤 인용 검사
  error: GenerationError | null;
};

export const ACTIVE_PHASES: readonly RunPhase[] = ['streaming'];

export function isActive(run: QaRun | null | undefined): boolean {
  return run != null && ACTIVE_PHASES.includes(run.phase);
}
