// 모델 요청 + 생성 설정 → Messages API 파라미터. 순수 함수라 디버깅 화면 미리보기와 실제 호출이 같은 값을 쓴다.
// - thinking은 보내지 않는다 (Opus 5.5·Sonnet 5.5·Haiku 5.5 모두 생략하면 adaptive)
// - 거절 시 서버 측 fallback: Opus 5.5·Sonnet 5.5만 "default" 형태로 켠다 (Haiku 5.5는 지원하지 않음)
import type { ModelRequest } from '../../src/okf/request.ts';
import { findModel, MAX_OUTPUT_TOKENS, type GenerationSettings } from './models.ts';
import type { ApiRequestPreview } from './types.ts';

export const SERVER_FALLBACK_BETA = 'server-side-fallback-2026-07-01';

export function toApiRequest(request: ModelRequest, settings: GenerationSettings): ApiRequestPreview {
  const fallback = findModel(settings.model).serverFallback;
  return {
    model: settings.model,
    max_tokens: MAX_OUTPUT_TOKENS,
    output_config: { effort: settings.effort },
    ...(fallback ? { betas: [SERVER_FALLBACK_BETA], fallbacks: 'default' as const } : {}),
    system: request.system,
    messages: request.messages,
  };
}
