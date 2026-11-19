import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import type { Bundle } from './types.ts';
import { isMarkdown } from './concept.ts';

// 디렉터리 아래 파일을 번들 루트 기준 경로("policies/returns.md")를 키로 담는다.
//  - .md 파일은 내용을 읽는다.
//  - .md가 아닌 파일은 asset이다 (§3.2-3). 링크·경로 필드의 대상이 될 수 있으므로 경로만 담고 내용은 빈 문자열로 둔다.
//  - 이름이 '.'으로 시작하는 파일·디렉터리(.git, .obsidian …)는 번들이 아니다 (§3.2-4).
//  - 심볼릭 링크는 따라가지 않는다 (§3.2-5). readdir의 Dirent는 링크를 파일로 보지 않는다.
export async function loadBundle(root: string): Promise<Bundle> {
  const bundle: Bundle = new Map();
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const abs = join(entry.parentPath, entry.name);
    const key = relative(root, abs).split(sep).join('/');
    if (key.split('/').some((part) => part.startsWith('.'))) continue;
    bundle.set(key, isMarkdown(key) ? await readFile(abs, 'utf8') : '');
  }
  return bundle;
}
