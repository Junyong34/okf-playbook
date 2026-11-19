// 브라우저용 Anthropic 클라이언트. 로컬 시연 전용 (dangerouslyAllowBrowser).
import Anthropic from '@anthropic-ai/sdk';
import { readApiKey } from './apiKey.ts';
import { MissingApiKeyError } from './errors.ts';

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (client) return client;
  const apiKey = readApiKey();
  if (!apiKey) throw new MissingApiKeyError();
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  return client;
}
