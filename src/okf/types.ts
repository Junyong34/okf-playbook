// 번들은 "번들 루트 기준 경로 → 파일 내용" 맵이다.
// 파일 시스템을 모르는 순수 데이터라서 CLI와 나중의 웹 화면이 같은 코드를 쓴다.
export type Bundle = Map<string, string>;

export type Level = 'error' | 'warning';

export type Rule =
  | 'yaml-parse'          // §11-1 frontmatter가 없거나 YAML로 파싱되지 않음
  | 'missing-type'        // §11-2 비어 있지 않은 type 없음
  | 'index-frontmatter'   // §8 · §12 index.md frontmatter 규칙 위반
  | 'broken-link'         // §6.1 대상이 번들에 없음 (거부 금지 → 경고)
  | 'link-outside-bundle' // 번들 루트 밖을 가리킴 (경고)
  | 'team/relative-links'; // 팀 규칙: 번들 안 링크는 상대 경로만

export type Issue = {
  level: Level;
  rule: Rule;
  file: string;
  message: string;
};
