# v0.3 코드 변경 요약 (코드 에이전트 보고, 2026-11-19)

레슨 HTML의 설명·모범 답안·퀴즈를 고칠 때 이 요약을 기준으로 삼고, 세부는 실제 코드 `src/okf/*.ts`와 `tests/*.test.ts`를 읽어 확인한다.

## 공개 이름 변경

- Rule id 삭제: `missing-type` (→ `not-a-concept` 경고). 추가: `not-a-concept`, `missing-okf-version`, `unquoted-version`, `log-frontmatter`, `incomplete-verified`, `bad-timestamp`.
- concept.ts 추가: `isBlank`, `asList`, `parseTimestamp(v): number|null`, `conceptType`, `isConceptPath`, `bundleVersion`, `allowsLegacyPaths`, `classifyResource`(provenance에서 이동, provenance가 다시 내보냄), `pathFields`, `resolvePathField(bundle, from, value): {target, legacy}`. 타입 `PathField`·`PathFieldName`·`ResolvedPath`. `FileKind`에 `'other'`. 여는 `---`만 있고 닫힘이 없으면 `invalid`. 스칼라 `tags`는 태그 하나.
- load.ts: `.`으로 시작하는 파일·디렉터리 제외.
- trust.ts: `Verification.at` 필수. `trustTier(verified, generated?)`. 추가 `readVerified`·`VerifiedRead`·`generatedAt`·`isCurrent`. `Caution`에 `bad-verified`. `Assessment`에 `history`·`fresh`(필수), `generatedAt?`·`ignoredVerified?`·`supersededBy?`.
- provenance.ts: `TraceSource.kind`에 `'not-a-concept'`, `TraceSource.legacy?`. `sources` 단일 매핑 허용.
- graph.ts: `GraphEdge.broken` 삭제, `legacy?: true` 추가. `Graph.dangling: DanglingRef[]`. `EdgeKind` = `link|source|superseded-by|resource|computation|executor|attester`.
- ask.ts: `Replacement`, `AssessedPick.replacement?`. retrieve CLI에 `대체 개념:` 줄.

## 레슨 단계별 동작

- validate 1~3단계, 5·6단계: 변화 없음. 4단계: frontmatter 없음·type 없음/빈 값 → warning `not-a-concept`(예전 error). YAML 오류·닫힘 누락 → error `yaml-parse`. 루트 index에 `title`·`description`·`license`·확장 키 허용. `okf_version` 없음 → `missing-okf-version`, 숫자 → `unquoted-version`(warning). 하위 index frontmatter → error `index-frontmatter`. `log.md` frontmatter → error `log-frontmatter`. `verified` 항목에 by/at 누락 → warning `incomplete-verified`. `verified.at`·`generated.at`·`stale_after` 무효(오프셋 없는 date-time 포함) → warning `bad-timestamp`.
- retrieve: `type` 없는 파일 제외. 링크 대상이 개념이 아니면 따라가지 않고 경고.
- answer·compare: 변화 없음.
- provenance P0: `sources` 단일 매핑 → 목록 하나, 빈 값은 없음. P1: 변화 없음. P2 `trace`: `resolvePathField`, type 없는 대상은 `not-a-concept`, v0.2 이하/미선언 번들에서 `/` 없는 값이 파일 기준으로 없으면 루트 기준 재시도 + `legacy: true`, 출력에 "v0.2 대체 해석".
- trust T1 `normalizeVerified`: by·at 둘 다 있고 at이 유효한 항목만. T2 `trustTier`: generated 주면 `at >= generated.at`만. `team:`은 machine-confirmed. T3 `assess`: `latestVerifiedAt`은 현재 기록에서만, 이전 기록은 `history`("이력: 마지막 변경(…) 전 검토 …"). 빈 status = stable. deprecated + `superseded_by` → `supersededBy`, "대체: …". 무효 `stale_after` → `bad-date`, `fresh: false`. 날짜만 = UTC 0시. 무시된 verified → `bad-verified`. 주의 순서 status → stale → bad-verified. T4: 기존 실패 1건 그대로(사용자 데이터 `status: deprecated`).
- graph G0 `toMermaid`: 경로 필드 간선은 점선+종류 이름(`-. 출처 .->`, `-. 대체 .->`). dangling 중 missing만 빨간 노드. G1 `buildGraph`: 끊긴 링크·개념 아닌 대상은 `dangling`. 경로 필드 간선 순서 resource → sources → superseded_by → … v0.2 대체 해석은 경로 필드에만. G2 `backlinks`: edges+dangling, from 순 → EdgeKind 순. G3 실제 번들: 링크 3 + 출처 1, dangling 없음.

## 검증 결과

`pnpm test` 173/174 (기존 T4 실패 1건), `pnpm typecheck` 통과, `pnpm validate knowledge` 오류·경고 0.
