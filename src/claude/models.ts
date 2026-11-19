// 화면에서 고를 수 있는 모델과 effort. 목록은 코드에 고정한다 (Models API로 받아 오지 않는다).
// 스펙: .scratch/okf-web-ui/spec.md "디버깅 화면", "API 호출"

export type ModelId = 'claude-opus-5-5' | 'claude-sonnet-5-5' | 'claude-haiku-5-5';
export type Effort = 'low' | 'medium' | 'high';

export type ModelOption = {
  id: ModelId;
  label: string;
  description: string;
  // 안전 분류기 거절 시 서버가 다른 모델로 다시 돌리는 fallbacks: "default"를 쓸 수 있는가.
  // Haiku 5.5는 서버 측 fallback이 없다.
  serverFallback: boolean;
};

export const MODEL_OPTIONS: readonly ModelOption[] = [
  { id: 'claude-opus-5-5', label: 'Opus 5.5', description: '가장 정확한 기본 모델', serverFallback: true },
  { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5', description: '속도와 품질의 균형', serverFallback: true },
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5', description: '가장 빠르고 저렴함', serverFallback: false },
];

export type EffortOption = { value: Effort; label: string };

export const EFFORT_OPTIONS: readonly EffortOption[] = [
  { value: 'low', label: 'low' },
  { value: 'medium', label: 'medium' },
  { value: 'high', label: 'high' },
];

export type GenerationSettings = { model: ModelId; effort: Effort };

// 디버깅 화면의 기본값
export const DEBUG_DEFAULT_GENERATION: GenerationSettings = { model: 'claude-opus-5-5', effort: 'low' };

// 상담 화면은 선택 UI 없이 이 값으로 고정한다.
// 디버깅 화면에서 모델을 비교한 뒤 사용자가 정한다. 그때까지는 임시값이다.
export const CHAT_GENERATION: GenerationSettings = { model: 'claude-opus-5-5', effort: 'low' };

// 답변은 짧지만 잘리면 다시 물어야 하므로 넉넉히 둔다.
export const MAX_OUTPUT_TOKENS = 16000;

export function findModel(id: ModelId): ModelOption {
  return MODEL_OPTIONS.find((m) => m.id === id) ?? MODEL_OPTIONS[0];
}

export function modelLabel(id: string): string {
  return MODEL_OPTIONS.find((m) => m.id === id)?.label ?? id;
}
