// 답변의 인용을 Astryx Markdown 인용 칩으로 보여 줄 준비를 한다.
// Markdown은 sources에 있는 id의 [id] 표시만 칩으로 바꾼다. 그래서
//  - [a.md, b.md] → [a.md][b.md]  (칩 하나에 id 하나)
//  - [/a.md]      → [a.md]        (extractCitations와 같은 정규화)
// 모델에 주지 않은 경로는 sources에 없으므로 그대로 글자로 남는다 (디버깅 화면: 지어낸 근거를 숨기지 않는다).
// 상담 화면은 keepOnly에 준 문서 목록을 넘겨 그 밖의 인용 표시를 지운다 (고객에게 파일 경로를 보이지 않는다).
// 이 파일은 DOM·React를 모른다 (node:test로 검사한다).

export type CitationSource = { title: string };

const CITATION_GROUP = /\[([^\]]+?\.md(?:\s*,\s*[^\]]+?\.md)*)\](?!\()/g;

export type NormalizeOptions = { keepOnly?: readonly string[] };

export function normalizeCitations(answer: string, options: NormalizeOptions = {}): string {
  const keep = options.keepOnly ? new Set(options.keepOnly) : null;
  const out = answer.replace(CITATION_GROUP, (_whole, group: string) =>
    group
      .split(',')
      .map((path) => path.trim().replace(/^\/+/, ''))
      .filter((path) => keep === null || keep.has(path))
      .map((path) => `[${path}]`)
      .join(''),
  );
  // 인용을 지운 자리에 남은 문장부호 앞 공백을 정리한다: "합니다. ." 가 되지 않도록
  return keep === null ? out : out.replace(/[ \t]+(?=[.,!?]|$)/gm, '');
}

// 모델에 준 문서만 칩이 된다. 제목이 없으면 경로를 쓴다.
export function citationSources(
  providedPaths: readonly string[],
  titleOf: (path: string) => string | undefined,
): Record<string, CitationSource> {
  return Object.fromEntries(providedPaths.map((path) => [path, { title: titleOf(path) || path }]));
}
