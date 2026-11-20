import { MODEL_OPTIONS, type GenerationSettings, type ModelId } from '@claude/models.ts';

const MODEL_DISPLAY = {
  'claude-opus-5-5': { label: 'Opus 5.5', description: '가장 정확한 기본 모델' },
  'claude-sonnet-5-5': { label: 'Sonnet 5.5', description: '속도와 품질의 균형' },
  'claude-haiku-5-5': { label: 'Haiku 5.5', description: '가장 빠르고 저렴함' },
} satisfies Record<ModelId, { label: string; description: string }>;

export const MODEL_SELECTOR_OPTIONS = MODEL_OPTIONS.map(({ id }) => {
  const { label, description } = MODEL_DISPLAY[id];
  return { value: id, label, description: `${id} · ${description}` };
});

export const DEBUG_DEFAULT_GENERATION: GenerationSettings = { model: 'claude-opus-5-5', effort: 'low' };
export const CHAT_GENERATION: GenerationSettings = { model: 'claude-opus-5-5', effort: 'low' };

export function modelLabel(id: string): string {
  return MODEL_SELECTOR_OPTIONS.find((option) => option.value === id)?.label ?? id;
}
