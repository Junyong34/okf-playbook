// 번들은 "번들 루트 기준 경로 → 파일 내용" 맵이다.
// 파일 시스템을 모르는 순수 데이터라서 CLI와 나중의 웹 화면이 같은 코드를 쓴다.
export type Bundle = Map<string, string>;

export type Level = 'error' | 'warning';

export type Rule =
  | 'yaml-parse'          // §4 · §11.1-1 frontmatter 블록이 YAML 매핑으로 파싱되지 않음 (닫는 --- 없음 포함)
  | 'not-a-concept'       // §3.2-2 frontmatter나 비어 있지 않은 type이 없는 .md. 적합성에는 영향 없음 (경고)
  | 'index-frontmatter'   // §8 하위 디렉터리 index.md에 frontmatter
  | 'missing-okf-version' // §8.1 루트 index.md에 okf_version이 없음 (SHOULD, 경고)
  | 'unquoted-version'    // §4 · §8.1 okf_version이 따옴표 없는 숫자 등 문자열이 아님 (경고)
  | 'log-frontmatter'     // §9 log.md에 frontmatter
  | 'incomplete-verified' // §5.2 · §11.2-3 verified 항목에 by나 at이 없음. 소비자는 무시한다 (경고)
  | 'bad-timestamp'       // §5 시각 값이 허용 형식(오프셋 있는 date-time, 날짜만)이 아님 (경고)
  | 'broken-link'         // §6.1 대상이 번들에 없음 (거부 금지 → 경고)
  | 'link-outside-bundle' // §6 번들 루트 밖을 가리킴 (외부, 경고)
  | 'team/relative-links'; // 팀 규칙: 번들 안 링크는 상대 경로만

export type Issue = {
  level: Level;
  rule: Rule;
  file: string;
  message: string;
};
