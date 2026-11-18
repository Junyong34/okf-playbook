// 사용법: pnpm validate [번들 디렉터리]   (기본값 knowledge)
import { loadBundle } from './src/okf/load.ts';
import { validateBundle } from './src/okf/validate.ts';

const root = process.argv[2] ?? 'knowledge';
const bundle = await loadBundle(root);
const issues = validateBundle(bundle);

for (const i of issues) {
  const tag = i.level === 'error' ? 'ERROR' : 'WARN ';
  console.log(`${tag} ${i.file}  [${i.rule}] ${i.message}`);
}
const errors = issues.filter((i) => i.level === 'error').length;
const warnings = issues.length - errors;
console.log(`\n${root}: 파일 ${bundle.size}개, 오류 ${errors}개, 경고 ${warnings}개`);
process.exitCode = errors > 0 ? 1 : 0;
