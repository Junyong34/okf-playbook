// 생성 단계의 입력·결과 타입. 화면은 SDK 타입 대신 이 타입만 본다 (서버로 옮겨도 화면 코드는 그대로).
import type { ModelRequest } from '../../src/okf/request.ts';
import type { Effort, GenerationSettings } from './models.ts';

export type GenerateParams = {
  request: ModelRequest;
  settings: GenerationSettings;
  signal: AbortSignal;
  onText: (delta: string) => void;
};

export type TokenUsage = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
};

export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'refusal' | 'pause_turn' | 'other';

export type Refusal = { category: string | null; explanation: string | null };

export type GenerationResult = {
  text: string;
  stopReason: StopReason;
  servedModel: string;     // 실제로 답한 모델 (fallback이 돌면 요청한 모델과 다를 수 있다)
  fallbackUsed: boolean;
  usage: TokenUsage;
  refusal: Refusal | null;
};

// 모델 요청을 SDK에 넘기기 직전 모양. 디버깅 화면의 "모델 요청" 탭과 JSON 내려받기에 쓴다.
export type ApiRequestPreview = {
  model: string;
  max_tokens: number;
  output_config: { effort: Effort };
  betas?: string[];
  fallbacks?: 'default';
  system: string;
  messages: ModelRequest['messages'];
};

export type GenerateInput = Pick<GenerateParams, 'request' | 'settings'>;

export type GenerationEvent =
  | { type: 'text'; delta: string }
  | { type: 'result'; result: GenerationResult }
  | { type: 'error'; error: GenerationError };

export type GenerationErrorKind =
  | 'missing-key'
  | 'auth'
  | 'permission'
  | 'rate-limit'
  | 'overloaded'
  | 'bad-request'
  | 'network'
  | 'api'
  | 'unknown';

export type GenerationError = {
  kind: GenerationErrorKind;
  title: string;
  message: string;
  status?: number;
  retryable: boolean;
};
