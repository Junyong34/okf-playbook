import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import type { Bundle } from './types.ts';

// 디렉터리 아래 모든 .md 파일을 읽어 번들 루트 기준 경로("policies/returns.md")를 키로 담는다.
export async function loadBundle(root: string): Promise<Bundle> {
  const bundle: Bundle = new Map();
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const abs = join(entry.parentPath, entry.name);
    const key = relative(root, abs).split(sep).join('/');
    bundle.set(key, await readFile(abs, 'utf8'));
  }
  return bundle;
}
