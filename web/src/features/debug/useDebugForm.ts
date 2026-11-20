// 디버깅 화면 입력 상태: 질문, 검색 설정, 말투 설정 켜기·끄기, 모델·effort.
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_OPTIONS, type Options as RetrievalOptions } from '@okf/retrieve.ts';
import type { GenerationSettings } from '@claude/models.ts';
import { DEBUG_DEFAULT_GENERATION } from '@/config/models.ts';

export type DebugForm = {
  question: string;
  retrieval: RetrievalOptions;
  voiceEnabled: boolean;
  generation: GenerationSettings;
};

export const DEFAULT_DEBUG_FORM: DebugForm = {
  question: '',
  retrieval: DEFAULT_OPTIONS,
  voiceEnabled: true,
  generation: DEBUG_DEFAULT_GENERATION,
};

export type DebugFormApi = {
  form: DebugForm;
  setQuestion: (question: string) => void;
  setRetrieval: (patch: Partial<RetrievalOptions>) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setGeneration: (patch: Partial<GenerationSettings>) => void;
  resetSettings: () => void; // 질문은 남기고 설정만 기본값으로
  isDefaultSettings: boolean;
};

const sameSettings = (a: DebugForm, b: DebugForm) =>
  JSON.stringify([a.retrieval, a.voiceEnabled, a.generation]) === JSON.stringify([b.retrieval, b.voiceEnabled, b.generation]);

// retrieval: 번들의 기본 검색 설정. 번들을 바꾸면 검색 설정이 그 번들 기본값으로 돌아간다.
export function useDebugForm(retrieval: RetrievalOptions = DEFAULT_OPTIONS): DebugFormApi {
  const defaults: DebugForm = { ...DEFAULT_DEBUG_FORM, retrieval };
  const [form, setForm] = useState<DebugForm>(defaults);
  useEffect(() => setForm((f) => ({ ...f, retrieval })), [retrieval]);

  const setQuestion = useCallback((question: string) => setForm((f) => ({ ...f, question })), []);
  const setRetrieval = useCallback(
    (patch: Partial<RetrievalOptions>) => setForm((f) => ({ ...f, retrieval: { ...f.retrieval, ...patch } })),
    [],
  );
  const setVoiceEnabled = useCallback((voiceEnabled: boolean) => setForm((f) => ({ ...f, voiceEnabled })), []);
  const setGeneration = useCallback(
    (patch: Partial<GenerationSettings>) => setForm((f) => ({ ...f, generation: { ...f.generation, ...patch } })),
    [],
  );
  const resetSettings = useCallback(() => setForm((f) => ({ ...DEFAULT_DEBUG_FORM, retrieval, question: f.question })), [retrieval]);

  return {
    form,
    setQuestion,
    setRetrieval,
    setVoiceEnabled,
    setGeneration,
    resetSettings,
    isDefaultSettings: sameSettings(form, defaults),
  };
}
