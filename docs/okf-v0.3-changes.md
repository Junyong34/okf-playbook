# OKF v0.3에서 바뀐 것

2026-11-19 확인 · v0.3 명세(커밋 `527e81a`)를 v0.2 명세(deprecated 저장소 마지막 커밋 `8a8ff87`)와 대조했다.

v0.2로 OKF를 배운 사람이 v0.3에서 무엇을 다르게 읽고 써야 하는지 정리한다. 명세 요약은 v0.3 §13을 따르고, 이 저장소에 적용한 결정은 [마이그레이션 스펙](../.scratch/okf-v0.3-migration/spec.md)을 따른다. 용어는 [GLOSSARY.md](../GLOSSARY.md)를 쓴다. 이 문서의 `§` 번호는 따로 적지 않으면 v0.3 번호다.

## 1. 배경

OKF 개발 저장소가 `GoogleCloudPlatform/open-knowledge-format`에서 `open-knowledge-format/open-knowledge-format`으로 옮겨 갔다. 새 저장소는 2026-10-23에 명세·예제 번들·도구를 v0.3으로 올렸고, 2026-10-27에 공식 에이전트 스킬 `okf-generate`·`okf-consume`을 더했다. 옛 저장소는 2026-11-18에 deprecated로 표시됐다. README와 SPEC.md 맨 위에 "최신 명세(v0.3)는 새 저장소에 있고 이 저장소는 더 갱신하지 않는다"는 경고가 붙었다. 날짜는 두 저장소의 git 기록 기준이다. [v0.3 명세](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#open-knowledge-format-okf) · [deprecated 표시 커밋](https://github.com/GoogleCloudPlatform/open-knowledge-format/commit/8a8ff87bfd3847c34c9ddd4fbfd9296be2aee4a3)

시각 형식에는 사연이 있다. v0.2 처음 공개본은 `stale_after`·`sources[].last_modified` 등에 날짜만 쓴 예를 두었다. 2026-08-20 커밋이 v0.2 본문을 고쳐 모든 시각에 명시적 UTC 오프셋을 요구했고, 날짜만 쓴 값은 무시하게 했다(okf#24). 날짜만 쓴 `2026-12-31`은 시간대마다 다른 순간이라 같은 번들이 사무실마다 다르게 낡는다는 이유였다. v0.3은 이 수정을 되돌려 날짜만 쓴 값을 다시 허용하되 "그날 UTC 0시"라는 고정된 뜻을 붙였다. 그래서 날짜만 쓴 v0.2 번들도 유효하다. 오프셋 없는 date-time은 여전히 무효다. [v0.3 §5](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#5-provenance-trust-and-lifecycle) · [v0.3 §13.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#132-clarifications-and-errata) · [v0.2 오프셋 수정 커밋](https://github.com/GoogleCloudPlatform/open-knowledge-format/commit/3dc3029168d2f98e331feeb4ca05c9178973a9b9)

버전 정책도 바뀌었다. v0.2 §12는 minor 버전이 하위 호환 추가만 한다고 적었다. v0.3 §12는 1.0 전에는 minor 버전도 깨지는 변경을 담을 수 있고, 그때는 변경 절에 깨지는 변경과 소비자 대체 해석을 적어야 한다고 정했다. 출시한 버전의 규범 문장을 고치려면 새 버전이 필요하다는 규칙도 생겼다. v0.2 오프셋 수정 같은 일이 다시 없게 하는 규칙이다. [v0.3 §12](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#12-versioning) · [v0.2 §12](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/8a8ff87bfd3847c34c9ddd4fbfd9296be2aee4a3/SPEC.md#12-versioning)

## 2. 깨지는 변경 2개

v0.3은 깨지는 변경이 두 개라고 밝힌다. 둘 다 v0.2 값을 소비자가 읽는 방식을 바꾼다. [§13.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#131-breaking-changes)

| 변경 | v0.2 번들에 미치는 영향 | 대체 해석 |
| --- | --- | --- |
| `/` 없는 경로 필드는 그 파일이 있는 디렉터리 기준으로 해석한다. | v0.2 예제처럼 번들 루트 기준으로 쓴 `references/x.md` 같은 값이 해석되지 않는다. | 번들이 `okf_version` 0.2 이하이거나 선언이 없으면 번들 루트 기준으로 다시 찾아도 된다(MAY). |
| 현재 검토 기록만 신뢰 등급을 정한다. | 사람이 검토한 뒤 다시 쓴 개념은 human-reviewed에서 낮은 등급으로 내려간다. | 필요 없다. 등급은 내려가기만 하고, 그쪽이 안전하다. |

**경로 해석.** v0.2 §6.2는 경로 필드에 URL, `/` 시작 경로, 상대 경로를 허용했지만 상대 경로의 기준을 적지 않았다. v0.3 §6은 링크와 경로 필드에 같은 규칙을 둔다. URI 스킴이 있으면 절대 URL, `/`로 시작하면 번들 루트 기준, 그 밖은 그 파일의 디렉터리 기준이다. 번들 밖으로 나가는 값은 외부이고 로컬 파일 시스템에서 읽지 않는다. 대체 해석은 경로 필드에만 있고 본문 링크에는 없다. [§6](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#6-links-and-paths) · [§6.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#62-path-fields) · [§12.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#121-bundles-from-earlier-versions) · [v0.2 §6.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/8a8ff87bfd3847c34c9ddd4fbfd9296be2aee4a3/SPEC.md#62-path-valued-fields)

**현재 검토 기록.** 검토 기록의 `at`이 `generated.at`과 같거나 늦으면, 또는 `generated`가 없으면 그 기록은 현재 기록이다. 신뢰 등급은 현재 기록으로만 정한다. 현재 기록이 없으면 unverified, 현재 기록이 `human:` 아닌 주체뿐이면 machine-confirmed, `human:` 주체가 있으면 human-reviewed다. 현재가 아닌 기록은 이력으로 남고 "마지막 변경 전 검토"로 보여 줄 수 있다. v0.2 §5.3은 `verified` 전체로 등급을 정했다. 에이전트가 사람 검토 뒤 개념을 다시 쓰면 그 사람은 새 문장을 읽지 않았다는 것이 바뀐 이유다. [§5.3](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#53-trust-tiers) · [v0.2 §5.3](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/8a8ff87bfd3847c34c9ddd4fbfd9296be2aee4a3/SPEC.md#53-trust-tiers)

## 3. 명확해진 규칙

v0.2가 비워 두거나 모호하게 둔 곳을 채웠다. 아래는 이 저장소 실습에 닿는 것만 고른 목록이다. 전체 목록은 §13.2에 있다. [§13.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#132-clarifications-and-errata)

- **개념 판별.** 예약 파일이 아니고 frontmatter에 비어 있지 않은 `type`이 있는 `.md`만 개념이다. frontmatter나 `type`이 없는 `.md`는 개념이 아니고 적합성에도 영향이 없다. 검증기는 경고하는 편이 좋다(SHOULD). `.md`가 아닌 파일은 asset이다. `.`으로 시작하는 파일·디렉터리는 번들에 들지 않는다. v0.2 §11은 예약 파일이 아닌 모든 `.md`에 frontmatter와 `type`을 요구했다. [§3.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#32-concepts-assets-and-other-files) · [§11.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#111-bundle-conformance)
- **frontmatter 문법.** YAML 1.2 core schema, 첫 줄과 끝 줄은 정확히 `---`, 키 중복 금지, 숫자·불리언처럼 보이는 값은 따옴표, 사용자 정의 YAML 태그 금지, 바꾸지 않은 값은 다시 직렬화하지 않는다. 본문은 CommonMark에 GFM 표와 `[^label]` 각주를 쓴다. [§4](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#4-concept-documents)
- **시각 형식.** 시각 키는 `generated.at`, `verified[].at`, `stale_after`, `sources[].last_modified`, `usage_window.from`·`to`다. 값은 오프셋 있는 RFC 3339 date-time 또는 날짜만(그날 UTC 0시)이다. 소비자는 따옴표 문자열과 YAML 고유 시각을 모두 받는다. 생산자는 `generated.at`·`verified[].at`에 date-time을 쓰는 편이 좋다. 둘을 비교하기 때문이다. [§5](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#5-provenance-trust-and-lifecycle)
- **`generated.at`과 `verified`.** `generated.at`은 내용의 마지막 의미 있는 변경 시각 하나만 뜻한다. 서식·공백·링크 수리는 바꾸지 않는다. 검토 기록에는 `by`와 `at`이 둘 다 있어야 하고, 하나라도 없으면 소비자가 무시한다. [§5.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#52-trust-generated-and-verified)
- **알 수 없는 `status`.** 목록에 없는 값은 `stable`이 아니다. 현재 지식만 거르는 소비자는 그 개념을 뺀다. 원래 값을 보여 주는 편이 좋다. [§5.4](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#54-lifecycle-status-and-superseded_by)
- **`stale_after`.** 낡았다는 것은 "다시 확인하라"는 뜻이지 "틀렸다"는 뜻이 아니다. 빈 값·null은 키가 없는 것과 같다. 파싱할 수 없는 값을 신선하다고 보면 안 된다(MUST NOT). [§5.5](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#55-lifecycle-stale_after)
- **링크 규칙.** v0.2 §6.1은 `/` 시작 링크를 권장했다. v0.3은 두 번들 내부 형식을 동등하게 두고 어느 쪽도 권장하지 않는다. 링크 대상은 URI 참조라 공백은 퍼센트 인코딩하고, 경로는 대소문자를 구별한다. `#fragment`를 뺀 대상이 개념 파일로 해석될 때만 개념을 가리키는 링크다. `[[wikilink]]`는 OKF 링크가 아니다. [§6](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#6-links-and-paths) · [§6.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#61-links-between-concepts)
- **번들 그래프.** 간선은 개념에서 개념으로 가는 링크와, 개념으로 해석되는 경로 필드 두 종류다. [§6.4](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#64-the-bundle-graph)
- **주체 표기.** 일반형 `<scheme>:<id>`와 `team:` 스킴이 생겼다. `team:`은 사람을 특정하지 않으므로 machine-confirmed를 준다. `sources[].author`도 같은 주체 표기를 쓴다. [§7](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#7-actor-convention)
- **`log.md`.** frontmatter가 없다. [§9](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#9-log-files)
- **빈 값·단일 값.** null·빈 문자열·빈 목록은 키가 없는 것과 같다. 목록 필드(`tags`, `sources`, `verified`, `parameters`)는 항목 하나를 목록 하나로 받는다. 스칼라 `tags`는 태그 하나이고 쉼표로 나누지 않는다. 필수 키가 없는 항목은 무시하고 경고하는 편이 좋다. [§11.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#112-consumer-rules)

## 4. 추가된 기능 3개

모두 선택 사항이다. [§13.3](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#133-additive-changes)

1. **`superseded_by`.** `status: deprecated`인 개념에 대체 개념 경로 하나를 적는다. 경로 필드라 §6 규칙으로 해석한다. 현재 지식만 거르는 소비자는 이 경로를 따라가 대체 개념을 주는 편이 좋다. 개념을 옮기거나 이름을 바꿀 때는 옛 경로에 짧은 deprecated 개념을 남기고 `superseded_by`로 새 경로를 가리킨다. [§5.4](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#54-lifecycle-status-and-superseded_by)
2. **번들 메타데이터.** 루트 `index.md` frontmatter에 `okf_version`, `title`, `description`, `license`와 확장 키를 둘 수 있다. `description`은 여러 번들을 가진 에이전트가 번들을 고를 때 읽는다. 루트 `index.md`를 다시 만드는 생산자는 기존 frontmatter를 지켜야 한다. 하위 `index.md`에는 여전히 frontmatter가 없다. v0.2는 루트 `index.md`에 `okf_version` 하나만 허용했다. [§8](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#8-index-files) · [§8.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#81-bundle-metadata)
3. **확장 키 규칙.** 생산자는 어느 단계에나, `sources` 항목이나 `verified` 항목 같은 명세 정의 매핑 안에도 키를 더할 수 있다. 소비자는 모르는 키로 문서를 거부하지 않고, 파일을 고치는 생산자는 모르는 키를 지켜야 한다. 앞으로의 버전은 `x-`로 시작하는 키를 정의하지 않으므로 자기 키는 `x-<producer>-<name>`으로 짓는 편이 좋다. [§4.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#41-frontmatter)

## 5. 공식 스킬 `okf-generate`·`okf-consume`

새 저장소 `skills/`에 에이전트 스킬 두 개가 들어 있다. 쓰기와 읽기를 나눠 맡는다. [스킬 추가 커밋](https://github.com/open-knowledge-format/open-knowledge-format/commit/c4df7bab129884a19673c7098dd8a5c55bf06c86)

| 스킬 | 맡는 일 | 보조 파일 |
| --- | --- | --- |
| `okf-generate` | 번들 생성·갱신·이전·수리·검증과 검토 기록 남기기. 경로 필드는 `/`로 시작하게, 본문 링크는 파일 기준으로 쓰게 한다. 루트 `index.md`에 `okf_version: "0.3"`, `title`, `description`을 넣게 한다. | `references/frontmatter.md`, `templates.md`, `attested-computations.md`, `migration.md`, `scripts/validate.py` |
| `okf-consume` | 번들에서 답하고, 쓴 개념마다 신뢰 등급·상태·최신성·인증 여부를 보고한다. 번들을 고치는 일은 `okf-generate`로 넘긴다. 개념끼리 충돌하면 현재 개념, 높은 신뢰 등급, 낡지 않은 개념, 늦은 `generated.at` 순으로 고른다. | `references/trust.md`, `scripts/scan.py` |

[okf-generate SKILL.md](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-generate/SKILL.md) · [okf-consume SKILL.md](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-consume/SKILL.md)

`okf-generate`의 v0.2 → v0.3 이전 절차는 일곱 단계다. 루트 `index.md`에 `okf_version: "0.3"`·`title`·`description` 추가, 번들 루트 기준으로 쓴 `/` 없는 경로 필드에 `/` 추가, `log.md` frontmatter 제거, 스칼라 `tags`를 목록으로 바꾸기, 대체 개념이 있는 deprecated 개념에 `superseded_by` 추가, 오프셋 없는 date-time에 오프셋 추가(시간대를 모르면 사용자에게 묻는다), 검증기 실행 뒤 신뢰 등급을 잃은 개념 알리기 순이다. [이전 절차](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-generate/references/migration.md)

두 스킬은 저장소의 `.agents/skills/`(Codex)와 `.claude/skills/`(Claude Code)에 그대로 들어 있다(2026-11-19). 검증은 공식 `scripts/validate.py` 대신 TS 검증기 `pnpm validate`가 기준이다. 공식 검증기 규칙을 `src/okf/validate.ts`로 옮겼고(Attested Computation 규칙 제외), 30개 사례에서 두 검증기의 판정이 같은 것을 확인했다. 공식 검증기는 `pnpm okf:validate`로 대조할 때만 쓴다. 자세한 운영 규칙은 [AGENTS.md](../AGENTS.md)의 "공식 OKF 스킬"에 있다.

다른 외부 스킬과의 비교는 [외부 OKF 스킬 비교](okf-skills-comparison.md)에 있다.

## 6. 절 번호 대응표

v0.2 절을 인용한 옛 노트를 읽을 때 쓴다. 번호가 같아도 내용이 바뀐 절은 비고에 적었다. [v0.3 명세](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#open-knowledge-format-okf) · [v0.2 명세](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/8a8ff87bfd3847c34c9ddd4fbfd9296be2aee4a3/SPEC.md)

| v0.2 | v0.3 | 비고 |
| --- | --- | --- |
| §1 Motivation | §1 Motivation | 최신성을 일급 항목에 더했다. |
| §2 Terminology | §2 Terminology | 번들 루트, asset, 경로 필드, 확장 키 등 정의 추가. |
| §3 Bundle structure, §3.1 | §3, §3.1 | 예약 파일은 frontmatter가 있어도 개념이 아니다. |
| 없음 | §3.2 Concepts, assets, and other files | 새 절. 개념 판별. |
| §4 Concept documents, §4.1~4.4 | §4, §4.1~4.4 | §4에 frontmatter 문법, §4.1에 확장 키 규칙 추가. |
| §5 앞머리 | §5 앞머리 | 시각 형식 표. 날짜만 쓴 값 허용. |
| §5.1~5.3 | §5.1~5.3 | §5.3에 현재 검토 기록 규칙. |
| §5.4 Lifecycle: `status` | §5.4 Lifecycle: `status` and `superseded_by` | `superseded_by`와 알 수 없는 값 규칙 추가. |
| §5.5 | §5.5 | 빈 값, 파싱 불가 값 규칙 추가. |
| §6 Cross-linking and paths | §6 Links and paths | 앞머리에 공통 해석 규칙. |
| §6.1, §6.3 | §6.1, §6.3 | `/` 시작 링크 권장 삭제. |
| §6.2 Path-valued fields | §6.2 Path fields | `superseded_by` 추가, v0.2 대체 해석. |
| 없음 | §6.4 The bundle graph | 새 절. |
| §7 Actor convention | §7 | `<scheme>:<id>`, `team:`. |
| §8 Index files | §8 | 루트 `index.md` frontmatter는 §8.1로. |
| 없음 | §8.1 Bundle metadata | 새 절. |
| §9 Log files | §9 | frontmatter 없음을 명시. |
| §10 Attested computations concept | §10 Attested computations | §10.5·§10.6 제목도 바뀌었다. |
| §11 Conformance | §11.1 Bundle conformance, §11.2 Consumer rules | 둘로 나눴다. |
| §12 Versioning, Considered and deferred(번호 없음) | §12, §12.2 Considered and deferred | 1.0 전 버전 정책. |
| 없음 | §12.1 Bundles from earlier versions | 새 절. |
| §13 Changes from v0.1 | Appendix B: Changes from v0.1 to v0.2 | 자리를 옮겼다. |
| 없음 | §13 Changes from v0.2 | 새 절. |
| Appendix A | Appendix A | v0.1 형·v0.2 형 하위 절을 없앴다. |

## 7. 이 저장소에서 바뀐 것

2026-11-19 사용자 요청으로 코드·실습·`learn/`을 v0.3 기준으로 옮겼다. 결정 사항은 [마이그레이션 스펙](../.scratch/okf-v0.3-migration/spec.md)의 표를 따르고, 모듈별 세부 동작은 [src/okf 모듈 구조](okf-modules.md)에 있다. 팀 규칙 경고는 [팀 규칙](team-rules.md)에 있다.

| 영역 | v0.3 동작 (요약) | 주로 맡는 모듈 | 근거 |
| --- | --- | --- | --- |
| 개념 판별 | frontmatter나 `type`이 없는 `.md`는 개념이 아니다. 경고 `not-a-concept`. YAML 파싱 실패는 여전히 오류. | `concept.ts`, `validate.ts` | [§3.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#32-concepts-assets-and-other-files) |
| 점 경로 | `.`으로 시작하는 파일·디렉터리는 읽지 않는다. | `load.ts` | [§3.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#32-concepts-assets-and-other-files) |
| 루트 index | 번들 메타데이터와 확장 키를 허용한다. `okf_version`이 없거나 문자열이 아니면 경고. 하위 index frontmatter는 오류. | `validate.ts` | [§8.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#81-bundle-metadata) |
| `log.md` | frontmatter가 있으면 오류. | `validate.ts` | [§9](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#9-log-files) |
| 경로 해석 | `/` 시작은 번들 루트, 그 밖은 파일 디렉터리 기준. 링크와 경로 필드가 같은 규칙. 번들 밖은 외부. | `concept.ts`, `provenance.ts` | [§6](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#6-links-and-paths) |
| v0.2 대체 해석 | 번들 버전이 0.2 이하이거나 선언이 없을 때 경로 필드만 번들 루트 기준으로 다시 찾는다. 번들 버전 읽기는 `concept.ts`. | `concept.ts`, `provenance.ts`, `graph.ts` | [§12.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#121-bundles-from-earlier-versions) |
| 그래프 | 간선은 개념을 가리키는 본문 링크와 개념으로 해석되는 모든 경로 필드. `superseded_by` 등 간선 종류 추가. | `graph.ts` | [§6.4](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#64-the-bundle-graph) |
| 시각 | 오프셋 있는 date-time, 날짜만, YAML 고유 Date만 허용. 공용 파서는 `concept.ts`. | `concept.ts`, `trust.ts` | [§5](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#5-provenance-trust-and-lifecycle) |
| 검토 기록 | `by`·`at`이 둘 다 있어야 기록. 대시 없는 매핑은 목록 하나. | `trust.ts` | [§5.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#52-trust-generated-and-verified) |
| 신뢰 등급 | 현재 검토 기록으로만 정한다. 현재가 아닌 기록은 "마지막 변경 전 검토" 이력으로 보여 준다. | `trust.ts`, `ask.ts` | [§5.3](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#53-trust-tiers) |
| `status` | 없으면 stable. draft·deprecated는 주의. 그 밖 값은 stable이 아니고 원래 값을 보인다. `superseded_by`가 있으면 대체 경로를 보인다. | `trust.ts`, `ask.ts` | [§5.4](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#54-lifecycle-status-and-superseded_by) |
| `stale_after` | 빈 값·null은 없는 것. 파싱 불가면 신선하지 않다고 보고 주의 `bad-date`. | `trust.ts` | [§5.5](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#55-lifecycle-stale_after) |
| 빈 값·단일 값 | null·빈 문자열·빈 목록은 없는 것. 스칼라 `tags`는 태그 하나. `sources`·`verified`도 단일 항목 허용. | `concept.ts`, `provenance.ts`, `trust.ts` | [§11.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#112-consumer-rules) |
| 번들 버전 | `bundles/knowledge/index.md`를 `okf_version: "0.3"`으로 올리고 `title`·`description`을 넣는다. `license`는 정보가 없어 넣지 않는다. | `bundles/knowledge/index.md` | [§8.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#81-bundle-metadata) |

손대지 않은 것도 있다. `verified`의 `human:` 기록은 여전히 사용자가 직접 대조한 뒤 적는다. `bundles/knowledge/references/returns-faq.md`의 `by: human`(콜론 없음)과 `bundles/knowledge/policies/return-exceptions.md`의 `status: deprecated`는 사용자 실습 결과라 그대로 둔다. `learn/learning-records/`의 기존 기록은 v0.2 기준 기록이라는 안내만 붙인다. [AGENTS.md](../AGENTS.md)
