/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 로컬 시연 전용. VITE_ 값은 JS 번들에 그대로 들어가므로 배포하기 전에 서버로 옮긴다.
  readonly VITE_ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
