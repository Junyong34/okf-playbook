import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import type { Bundle } from './types.ts';

// 디렉터리 아래 모든 .md 파일을 읽어 번들 루트 기준 경로("policies/returns.md")를 키로 담는다.
//  - 이름이 '.'으로 시작하는 파일·디렉터리(.git, .obsidian …)는 번들이 아니다 (§3.2-4).
//  - 심볼릭 링크는 따라가지 않는다 (§3.2-5). readdir의 Dirent는 링크를 파일로 보지 않는다.
export async function loadBundle(root: string): Promise<Bundle> {
  const bundle: Bundle = new Map();
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const abs = join(entry.parentPath, entry.name);
    const key = relative(root, abs).split(sep).join('/');
    if (key.split('/').some((part) => part.startsWith('.'))) continue;
    bundle.set(key, await readFile(abs, 'utf8'));
  }
  return bundle;
}
