// 웹과 서버가 사용하는 Claude 모델과 생성 옵션.
export type ModelId = 'claude-opus-5-5' | 'claude-sonnet-5-5' | 'claude-haiku-5-5';

type ModelOption = {
  id: ModelId;
  // Claude API의 fallbacks: "default"를 지원하는가.
  serverFallback: boolean;
};

export const MODEL_OPTIONS: readonly ModelOption[] = [
  { id: 'claude-opus-5-5', serverFallback: true },
  { id: 'claude-sonnet-5-5', serverFallback: true },
  { id: 'claude-haiku-5-5', serverFallback: false },
];

export const EFFORTS = ['low', 'medium', 'high'] as const;
export type Effort = typeof EFFORTS[number];

export type GenerationSettings = { model: ModelId; effort: Effort };

export const MAX_OUTPUT_TOKENS = 16000;

export function findModel(id: ModelId): ModelOption {
  return MODEL_OPTIONS.find((model) => model.id === id) ?? MODEL_OPTIONS[0];
}
