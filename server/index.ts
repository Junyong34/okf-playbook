// 로컬 API 서버 실행: 키를 읽어 SDK adapter를 만들고 app을 띄운다.
import Anthropic from '@anthropic-ai/sdk';
import { createApp } from './app.ts';
import { generate } from './generate.ts';

const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
const client = apiKey ? new Anthropic({ apiKey }) : null;

createApp({ generate: client ? (params) => generate(client, params) : null }).listen(3001, '127.0.0.1', () => {
  console.log('OKF API http://127.0.0.1:3001');
});
