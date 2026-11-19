// 웹 화면(상담·디버깅) 빌드 설정. 스펙: .scratch/okf-web-ui/spec.md "환경"
// - Vite 루트는 web/, 번들(knowledge/)과 말투 설정(docs/)은 저장소 루트에 있으므로 fs.allow로 연다.
// - StyleX 플러그인은 react()보다 앞에 둔다 (Fast Refresh). Astryx 레이어 뒤에 우리 스타일을 둔다.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';

const webRoot = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: webRoot,
  plugins: [
    stylex.vite({
      useCSSLayers: { before: ['reset', 'astryx-base', 'astryx-theme'] },
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@claude': fileURLToPath(new URL('../src/claude', import.meta.url)),
      '@okf': fileURLToPath(new URL('../src/okf', import.meta.url)),
    },
  },
  server: {
    fs: { allow: [repoRoot] },
    proxy: { '/api': 'http://127.0.0.1:3001' },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    target: 'es2023',
    // 첫 화면 청크 대부분은 Astryx 컴포넌트다. 로컬 시연용이라 경고 기준만 올린다.
    chunkSizeWarningLimit: 2000,
  },
});
