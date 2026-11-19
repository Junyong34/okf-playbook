// 번들은 "번들 루트 기준 경로 → 파일 내용" 맵이다.
// 파일 시스템을 모르는 순수 데이터라서 CLI와 나중의 웹 화면이 같은 코드를 쓴다.
export type Bundle = Map<string, string>;

// info: 고칠 필요는 없지만 알아 둘 것 (공식 검증기의 I 코드와 같은 수준)
export type Level = 'error' | 'warning' | 'info';

// 괄호 안은 공식 검증기(.agents/skills/okf-generate/scripts/validate.py)의 같은 규칙 코드다.
export type Rule =
  // 파일·예약 파일 (§3.2, §4, §8, §9)
  | 'yaml-parse'          // E002·E007 §4 · §11.1-1 frontmatter 블록이 YAML 매핑으로 파싱되지 않음 (닫는 --- 없음, 중복 키 포함)
  | 'not-a-concept'       // W120 §3.2-2 frontmatter나 비어 있지 않은 type이 없는 .md. 적합성에는 영향 없음 (경고)
  | 'index-frontmatter'   // E004 §8 하위 디렉터리 index.md에 frontmatter
  | 'missing-root-index'  // W125 §8.1 번들 루트에 index.md가 없음 (경고)
  | 'missing-okf-version' // W125 §8.1 루트 index.md에 okf_version이 없음 (SHOULD, 경고)
  | 'unquoted-version'    // W117 §4 · §8.1 okf_version이 따옴표 없는 숫자 등 문자열이 아님 (경고)
  | 'bad-license'         // W116 §8.1 license가 SPDX 표현식도 번들 안 파일도 아님 (경고)
  | 'log-frontmatter'     // E006 §9 log.md에 frontmatter
  | 'log-date-heading'    // E005 §9 log.md의 ## 제목이 YYYY-MM-DD가 아님
  | 'log-order'           // W118 §9 log.md 날짜가 최신순이 아님 (경고)
  // 개념 frontmatter 값 (§4, §5, §7, §11.2) — 모두 경고. 소비자는 거부하지 않고 무시하거나 다르게 읽는다
  | 'unquoted-value'      // W117 §4 type·title·description·status가 문자열이 아님
  | 'tags-not-list'       // W110 §4.1 · §11.2-2 tags가 목록이 아님. 스칼라는 태그 하나로 읽힌다
  | 'unknown-status'      // W105 §5.4 status가 draft·stable·deprecated가 아님. 소비자는 현재 지식이 아니라고 본다
  | 'superseded-without-deprecated' // W123 §5.4 superseded_by는 status: deprecated와 함께일 때만 뜻이 있다
  | 'bad-generated'       // W102 §5.2 generated가 by를 가진 매핑이 아님
  | 'bad-actor'           // W103 §7 행위자가 <producer>/<version>이나 <scheme>:<id> 형식이 아님 (예: by: human)
  | 'incomplete-verified' // W104 §5.2 · §11.2-3 verified 항목에 by나 at이 없음. 소비자는 무시한다
  | 'bad-timestamp'       // W101 §5 시각 값이 허용 형식(오프셋 있는 date-time, 날짜만)이 아님
  | 'date-only-trust-time' // W122 §5 generated.at·verified[].at이 날짜만. 둘은 서로 비교하므로 date-time으로 쓴다
  | 'bad-usage-window'    // W101 §5.1 usage_window가 { from, to } 매핑이 아님
  | 'usage-count-window'  // W109 §5.1 usage_count에 기간을 알려 줄 usage_window가 없음
  | 'missing-source-resource' // W106 §5.1 sources 항목에 resource가 없음. 소비자는 무시한다
  | 'duplicate-source-id' // W107 §5.1 sources id가 겹침
  | 'unknown-footnote'    // W108 §5.1 본문 각주 라벨에 맞는 sources id가 없음
  | 'missing-path-target' // W116 §6.2 경로 필드(resource·sources[].resource·superseded_by)가 번들 안 파일을 가리키지 않음
  | 'legacy-path'         // W119 §6.2 · §12.1 v0.2 대체 해석(번들 루트 기준)으로만 풀리는 경로 필드. '/'를 붙인다
  | 'stale-verification'  // I204 §5.3 모든 검토 기록이 generated.at보다 이르다. 소비자는 unverified로 읽는다 (정보)
  | 'stale-concept'       // I201 §5.5 now >= stale_after. 다시 확인할 때다 (정보, now를 줄 때만)
  | 'unprefixed-extension-key' // I203 §4.1 명세에 없는 키가 x- 접두사 없이 쓰였다 (정보)
  // 링크 (§6.1)
  | 'broken-link'         // W115 §6.1 대상이 번들에 없음 (거부 금지 → 경고)
  | 'link-outside-bundle' // §6 번들 루트 밖을 가리킴 (외부, 경고). 공식 검증기는 외부로 보고 보고하지 않는다
  | 'team/relative-links'; // 팀 규칙: 번들 안 링크는 상대 경로만 (공식 규칙 아님)

export type Issue = {
  level: Level;
  rule: Rule;
  file: string;
  message: string;
};
