// 질문 → 검색 단계 → 모델 요청 조립. 모델을 부르기 전까지의 순수한 처리다.
import { ask } from '@okf/ask.ts';
import { buildModelRequest } from '@okf/request.ts';
import { toApiRequest } from '@/lib/claude/apiRequest.ts';
import type { LoadedBundle } from '@/lib/bundles/loadBundles.ts';
import type { PreparedRun, QaInput } from './types.ts';

export function prepareRun(loaded: LoadedBundle, input: QaInput, now: Date): PreparedRun {
  const asked = ask(loaded.bundle, input.question, input.retrieval, now);
  const voice = input.voiceEnabled ? loaded.voice : null;
  const assembled = buildModelRequest(loaded.bundle, input.question, asked.picks, { voice, now });
  return {
    asked,
    assembled,
    apiRequest: assembled.request ? toApiRequest(assembled.request, input.generation) : null,
  };
}
