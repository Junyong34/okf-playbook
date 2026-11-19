// API 키 읽기. 로컬 시연 전용으로 브라우저에서 .env의 VITE_ANTHROPIC_API_KEY를 읽는다.
// 배포할 때는 이 파일과 client.ts를 지우고 generate()를 서버 fetch로 바꾼다.

export const API_KEY_ENV = 'VITE_ANTHROPIC_API_KEY';

export function readApiKey(): string | null {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY?.trim();
  return key ? key : null;
}

export function hasApiKey(): boolean {
  return readApiKey() !== null;
}
