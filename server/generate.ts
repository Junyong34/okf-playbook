import type Anthropic from '@anthropic-ai/sdk';
import { toApiRequest } from '../src/claude/apiRequest.ts';
import type { GenerateParams, GenerationResult, Refusal, StopReason, TokenUsage } from '../src/claude/types.ts';

type FinalMessage = Anthropic.Beta.BetaMessage;

const KNOWN_STOP_REASONS: readonly StopReason[] = ['end_turn', 'max_tokens', 'stop_sequence', 'refusal', 'pause_turn'];

function stopReasonOf(message: FinalMessage): StopReason {
  const reason = message.stop_reason as StopReason | null;
  return reason && KNOWN_STOP_REASONS.includes(reason) ? reason : 'other';
}

function textOf(message: FinalMessage): string {
  return message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
}

function usageOf(message: FinalMessage): TokenUsage {
  const u = message.usage;
  return {
    input: u.input_tokens,
    output: u.output_tokens,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
  };
}

// fallback 모델이 답했는지: usage.iterations에 fallback_message가 있으면 다른 모델이 이어 받은 것이다.
function fallbackUsedOf(message: FinalMessage): boolean {
  const iterations = (message.usage as { iterations?: ReadonlyArray<{ type?: string }> | null }).iterations ?? [];
  return iterations.some((entry) => entry.type === 'fallback_message');
}

function refusalOf(message: FinalMessage): Refusal | null {
  if (message.stop_reason !== 'refusal') return null;
  const details = (message as { stop_details?: { category?: string | null; explanation?: string | null } | null }).stop_details;
  return { category: details?.category ?? null, explanation: details?.explanation ?? null };
}

export async function generate(client: Anthropic, { request, settings, signal, onText }: GenerateParams): Promise<GenerationResult> {
  const stream = client.beta.messages.stream(toApiRequest(request, settings), { signal });
  stream.on('text', onText);
  const message = await stream.finalMessage();
  return {
    text: textOf(message),
    stopReason: stopReasonOf(message),
    servedModel: message.model,
    fallbackUsed: fallbackUsedOf(message),
    usage: usageOf(message),
    refusal: refusalOf(message),
  };
}
