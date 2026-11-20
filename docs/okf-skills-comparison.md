# 외부 OKF 스킬 비교

2026-11-18 · 두 저장소의 `main`에 있는 스킬 원문과 보조 파일을 읽고, 당시 공식 OKF v0.2 명세 및 이 저장소의 실습 코드와 대조했다. 2026-11-19 · OKF v0.3 명세(커밋 `527e81a`) 기준으로 명세 언급과 링크를 고치고, 공식 스킬 `okf-generate`·`okf-consume`을 비교 대상에 더했다. 두 외부 스킬의 내용은 11-18에 읽은 v0.2 기준 그대로다. v0.2와 v0.3의 차이는 [OKF v0.3에서 바뀐 것](okf-v0.3-changes.md)에 있다.

**권장안은 scaccogatto의 작성 흐름과 Inkeep의 작성 판단 기준을 참고해 `okf-playbook` 전용 스킬 하나를 짧게 만드는 것이다.** v0.3 이후에는 명세 규칙(경로 필드, 시각 형식, 루트 인덱스, 검토 기록)의 기준을 공식 `okf-generate`·`okf-consume`에 맞춘다. 두 외부 스킬은 v0.2 기준이라 그 부분을 그대로 옮기지 않는다. 지금 필요한 일은 이미 시작한 반품·환불 번들에 예제를 추가하고 기존 CLI로 확인하는 것이다. 두 후보를 학습 자료로 직접 읽는 데에는 설치가 필요 없다.

## Inkeep `open-knowledge-skills`

OpenKnowledge의 Markdown 협업 플랫폼용 스킬과 목적별 스타터 팩을 배포한다. `skills/core/`에는 플랫폼과 스킬 작성 도구가 있고, `skills/starter-packs/<pack>/`에는 팩 README, 안내 스킬, 팩에 따라 개별 작업 스킬이 들어 있다. 팩은 `software-lifecycle`, `knowledge-base`, `codebase-wiki`, `personal-crm`, `note-taking`, `writing-workflow`, `worldbuilding`, `okf-knowledge-base` 여덟 종류다. README는 일부 개별 작업 스킬의 독립 사용도 안내한다. [저장소 README](https://github.com/inkeep/open-knowledge-skills/blob/main/README.md)

| 스킬 | 목적과 파일 구성 | 재사용 범위 |
| --- | --- | --- |
| `open-knowledge` | 도구 목록, Markdown 읽기·쓰기, 근거 수집, 링크, 템플릿, 미리보기를 설명한다. 세부 절차는 `references/`로 연결한다. | `ok init`으로 설정한 프로젝트용이다. 적용 범위 내 Markdown은 MCP로 다루고, CRDT 이력과 미리보기, `.ok/` 폴더 설정을 사용한다. 웹 원문을 내부에 보존한 후 로컬 문서로 인용하는 것도 플랫폼 규칙이다. [원문](https://github.com/inkeep/open-knowledge-skills/blob/main/skills/core/open-knowledge/SKILL.md) |
| `open-knowledge-discovery` | `ok init` 설치, 프로젝트 공유, Cowork·Desktop 연결, 프로젝트 밖 Markdown 미리보기까지 안내한다. | 스킬을 읽는 데 MCP 연결은 필요 없고, 안내하는 동작은 OpenKnowledge 제품을 대상으로 한다. [원문](https://github.com/inkeep/open-knowledge-skills/blob/main/skills/core/open-knowledge-discovery/SKILL.md) |
| `open-knowledge-write-skill` | 의도·범위 결정, 작성, 평가, 호출 설명 최적화, 설치까지 8단계로 안내한다. | 짧은 본문과 필요할 때 읽는 참고 파일, 호출 문구 검증은 재사용할 수 있다. `write`·`edit`·`install` MCP와 미리보기·평가 서버 절차는 제품에 맞춰져 있다. [원문](https://github.com/inkeep/open-knowledge-skills/blob/main/skills/core/open-knowledge-write-skill/SKILL.md) |
| `okf-knowledge-base` | 팩 README와 안내 `SKILL.md`로 구성된다. 스킬은 v0.2 핵심 규칙(확인 시점 기준), 작성 판단, 읽기·유지보수, 선택 사항인 OpenKnowledge `okf` 플러그인으로 이어진다. | 개념을 링크하거나 인용할 수 있는 크기로 나누는 기준, 출처·검토를 실제 기록에 맞추는 기준은 범용이다. 파일 작업은 `open-knowledge`에 위임하며 `.ok/okf/*.schema.json`, 쓰기 시 경고와 감사, 자동 생성 인덱스의 편집 제한은 제품 규칙이다. `SKILL.md`의 `type: Document`는 파일 자체가 번들 안에 있을 때를 대비한 선택이다. [팩 README](https://github.com/inkeep/open-knowledge-skills/blob/main/skills/starter-packs/okf-knowledge-base/README.md) · [원문](https://github.com/inkeep/open-knowledge-skills/blob/main/skills/starter-packs/okf-knowledge-base/okf-knowledge-base/SKILL.md) |

별도 `knowledge-base` 팩의 `research-with-sources`는 원문 수집과 잠정 조사 문서 작성을, `consolidate-notes`는 실제 결정이 난 뒤 기존 조사를 확정 문서로 정리하는 절차를 제공한다. 원문에서 요약까지 근거를 잇는 방식은 실습과 닮았다. `research/`, `articles/`, `supersedes` 필드와 MCP 중심 작업은 해당 팩의 구성이다. [조사 스킬](https://github.com/inkeep/open-knowledge-skills/blob/main/skills/starter-packs/knowledge-base/research-with-sources/SKILL.md) · [정리 스킬](https://github.com/inkeep/open-knowledge-skills/blob/main/skills/starter-packs/knowledge-base/consolidate-notes/SKILL.md)

## scaccogatto `okf-skills`

OKF 번들을 만들고 유지하며 읽는 에이전트 도구 모음이다. 지정한 `skills/okf/`가 작성·유지·소비를 다루고, 형제 스킬 `validate`는 검증과 v0.1 마이그레이션, `visualize`는 링크 그래프 HTML, `backfill`은 Git 이력과 Claude 세션에서 번들 복원을 맡는다. Claude Code 플러그인에는 하위 에이전트, 선택형 `Stop` 훅, 읽기 전용 MCP도 들어 있다. [저장소 README](https://github.com/scaccogatto/okf-skills/blob/main/README.md)

| 파일 | 내용 |
| --- | --- |
| `SKILL.md` | 호출 조건과 세 모드를 선언한다. `produce`는 자료 선택 → 개념 작성 → 인덱스 갱신 → 검증, `maintain`은 영향받는 개념과 링크·수명 주기 갱신, `consume`은 인덱스부터 관련 문서와 신뢰·최신성 신호를 확인하는 흐름이다. [원문](https://github.com/scaccogatto/okf-skills/blob/main/skills/okf/SKILL.md) |
| `reference/SPEC.md` | 번들 안에서 바로 읽을 수 있는 공식 v0.2 명세 사본이다. 2026-11-18 확인 시점에 출처 주석을 제외한 본문이 옛 공식 저장소의 v0.2 명세와 일치했다. v0.3 명세와는 다르다. [사본](https://github.com/scaccogatto/okf-skills/blob/main/skills/okf/reference/SPEC.md) · [v0.2 명세(deprecated 저장소)](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/8a8ff87bfd3847c34c9ddd4fbfd9296be2aee4a3/SPEC.md) · [v0.3 명세](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md) |
| `templates/` | `concept.md`는 선택 메타데이터와 `sources[].id`를 참조하는 각주 예시를 담는다. `index.md`는 링크와 짧은 설명을 모으는 목차, `log.md`는 생성·폐기·대체·재생성·검토 기록 예시다. [템플릿](https://github.com/scaccogatto/okf-skills/tree/main/skills/okf/templates) |
| `scripts/okf_init.py` | 빈 디렉터리에 인덱스, 로그, 첫 `Reference` 개념을 만든다. Python 3.11 이상과 PyYAML을 쓰며, `.md`가 있는 디렉터리는 `--force` 없이 거부한다. 검증기는 형제 스킬에 있다. [초기화 스크립트](https://github.com/scaccogatto/okf-skills/blob/main/skills/okf/scripts/okf_init.py) · [검증기](https://github.com/scaccogatto/okf-skills/blob/main/skills/validate/scripts/okf_validate.py) |

작성·유지·소비 절차는 도메인에 상관없이 응용할 수 있다. `.okf/`는 기존 경로가 없을 때의 기본값이다. `CLAUDE_SKILL_DIR`, `/okf:validate`, `upkeep: enforced`, `recursive`, 수명 주기 이벤트만 루트 로그에 적는 방식은 도구 또는 저자의 운영 선택이다. 검증 스크립트를 다른 환경에서 쓸 때는 실제 파일 경로와 Python 의존성이 필요하다. `--strict`는 경고까지 종료 실패로 처리하고, `--migrate`는 파일을 제자리에서 변경한다. [스킬 원문](https://github.com/scaccogatto/okf-skills/blob/main/skills/okf/SKILL.md) · [검증 스킬](https://github.com/scaccogatto/okf-skills/blob/main/skills/validate/SKILL.md)

적합성 규칙을 옮길 때는 명세 §11을 직접 기준으로 삼는다. scaccogatto의 요약은 파싱 가능한 YAML과 비어 있지 않은 `type`을 강조한다. v0.3 §11.1은 frontmatter가 YAML mapping으로 파싱되는 것과 예약 파일이 있으면 §8·§9를 따르는 것만 요구한다. `type`이 없는 `.md`는 개념이 아닐 뿐 적합성을 깨지 않는다(§3.2). 스킬의 요약과 검증기의 경고 정책은 그대로 명세 판정에 옮기기 어렵다. [v0.3 명세 §11.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#111-bundle-conformance) · [§3.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#32-concepts-assets-and-other-files) · [검증기](https://github.com/scaccogatto/okf-skills/blob/main/skills/validate/scripts/okf_validate.py)

타임스탬프에서도 차이가 있다. Inkeep은 명시적 UTC 오프셋을 포함한 ISO 8601 날짜·시간만 쓰도록 안내한다. 이는 오프셋을 요구하도록 고친 v0.2 본문과 맞았다. scaccogatto의 검증기는 날짜만 있는 값도 허용한다. v0.3 §5는 오프셋 있는 date-time과 날짜만(그날 UTC 0시) 두 형식을 허용하고, 오프셋 없는 date-time은 무효로 둔다. 따라서 날짜만 쓴 값은 v0.3에서 scaccogatto 쪽이 맞다. `generated.at`·`verified[].at`은 서로 비교하므로 date-time을 쓰는 편이 좋다. `log.md`의 변경 이력 제목은 §9에 따라 `YYYY-MM-DD`를 쓴다. [v0.3 명세 §5](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#5-provenance-trust-and-lifecycle) · [§13.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#132-clarifications-and-errata) · [검증기](https://github.com/scaccogatto/okf-skills/blob/main/skills/validate/scripts/okf_validate.py)

## 공식 `okf-generate`·`okf-consume`

OKF 공식 저장소가 2026-10-27에 넣은 에이전트 스킬 두 개다. 같은 저장소의 v0.3 명세를 따르고, 쓰기와 읽기를 서로 다른 스킬로 나눴다. 각 스킬은 상대 스킬로 넘길 경우를 본문에 적는다. [스킬 디렉터리](https://github.com/open-knowledge-format/open-knowledge-format/tree/527e81aff55992be21507e97004286789126f88c/skills)

| 스킬 | 목적과 파일 구성 | 재사용 범위 |
| --- | --- | --- |
| `okf-generate` | 번들 생성·갱신·이전·수리·검증과 검토 기록을 맡는다. 범위 정하기 → 트리 계획 → 개념 작성 → 링크·경로 → 출처·신뢰·수명 → 계산 → 인덱스·로그 → 검증 → 보고 9단계다. `references/`에 필드 목록, 문서 유형별 템플릿, 계산 개념 작성법, v0.1·v0.2 이전 절차가 있고 `scripts/validate.py`가 검증기다. [원문](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-generate/SKILL.md) · [이전 절차](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-generate/references/migration.md) | 규칙은 명세 그대로라 도메인과 상관없이 쓸 수 있다. 출처 없는 사실을 쓰지 않는다, 이번 실행에서 만든 내용에 `verified`를 달지 않는다, `human:<id>`는 그 사람이 확인하고 id를 밝혔을 때만 적는다는 규칙은 이 저장소의 `human:` 규칙과 같다. 경로 필드는 `/`로 시작하고 본문 링크는 파일 기준으로 쓰게 한다. 검증기는 Python 3.9 이상과 PyYAML이 필요하다. |
| `okf-consume` | 번들에서 답하고, 쓴 개념마다 신뢰 등급·상태·최신성·인증 여부를 보고한다. 번들 루트와 `description` 찾기 → 관련 개념 찾기 → 개념 읽기 → 신뢰·최신성 판정 → 충돌 해소 → 계산 값 얻기 → 답변 7단계다. `references/trust.md`에 등급·상태·경로·값 규칙이 있고 `scripts/scan.py`가 개념 목록을 찍는다. [원문](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-consume/SKILL.md) · [판정 규칙](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-consume/references/trust.md) | 신뢰 등급을 현재 검토 기록으로만 정하고, 파싱할 수 없는 `stale_after`를 낡은 것으로 보고, deprecated 개념은 `superseded_by`를 따라간다. 답변 형식은 "쓴 개념(신뢰 등급·상태·최신성) / 인용 / 빈 곳"이다. 이 저장소의 `pnpm retrieve`·`pnpm prompt`가 하는 일과 겹친다. 개념이 충돌할 때의 우선순위(현재 개념 → 높은 등급 → 낡지 않음 → 늦은 `generated.at`)는 이 저장소 코드에 없다. |

두 외부 스킬과 비교하면, 공식 스킬은 명세 해석에서 기준이 되고 작성 판단(개념 크기, 원문 보존 방식)은 거의 다루지 않는다. 작성 판단은 여전히 Inkeep과 scaccogatto 쪽이 자세하다.

## `okf-playbook`에 적용하는 방법

1. **작성·수정에만 호출한다.** `knowledge/`에서 예제를 설계하거나 개념 문서를 바꾸는 요청을 대상으로 잡는다. `produce`와 `maintain`을 한 흐름으로 묶어 원문 확인 → 개념 단위 결정 → 문서·링크 수정 → 필요한 목차 갱신 → 검증으로 둔다. 질문에 답하는 실습은 기존 `pnpm retrieve`, `pnpm prompt`, `pnpm check-answer`를 안내한다. [학습 계획](okf-learning-plan.md) · [CLI 정의](../package.json)
2. **작성 예시는 반품 도메인으로 줄인다.** `Policy`, `Process`, `Reference` 예시와 출처를 가진 문장 하나를 보여준다. FAQ로 뒷받침되는 반품 기한 문장은 `[^returns-faq]`와 `sources[].id: returns-faq`를 맞추고, 사람이 실제 검토한 경우에 `verified`를 기록한다. `# Schema`나 계산 실행 절차는 해당 유형을 연습할 때 읽으면 된다. [반품 정책](../knowledge/policies/returns.md) · [0007 레슨](../learn/lessons/0007-sources-footnotes.html)
3. **본문 링크와 출처 경로를 구별한다.** 본문에서 환불 절차를 연결할 때 `../processes/refunds.md`를 쓴다. `sources[].resource`는 경로 필드라 v0.3 §6.2에 따라 `/` 없는 값은 그 파일의 디렉터리 기준이다. 공식 `okf-generate`처럼 `/references/returns-faq.md`로 쓴다. v0.3 §8.1은 루트 인덱스에 확장 키를 허용하므로 `upkeep`·`recursive`를 넣어도 v0.3 기준 검증기는 오류로 보지 않는다. 다만 명세가 정의하지 않은 키라 `x-` 접두사를 붙이는 편이 좋다(§4.1). [v0.3 명세 §6.2](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#62-path-fields) · [§8.1](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#81-bundle-metadata) [팀 규칙](team-rules.md) · [로컬 검증기](../src/okf/validate.ts) · [0007 레슨](../learn/lessons/0007-sources-footnotes.html)
4. **기존 검사 범위에 맞춘다.** `pnpm validate knowledge`로 문서와 링크를 검사한다. 2026-11-18 실행은 파일 4개, 오류 0개, 경고 0개였다. 당시 `log.md` 구조는 검사 범위 밖이었고, 출처 연결 검사와 추적은 0007 TODO 상태라 각주와 출처를 직접 대조했다. v0.3 이전에서 `log.md` frontmatter 검사가 들어간다. Python 검증기를 도입한다면 실습 검증기를 교체하기 전에 별도 비교 도구로 쓰는 편이 적합하다. 공식 `okf-generate/scripts/validate.py`가 v0.3 기준 비교 대상이다. [로컬 검증기](../src/okf/validate.ts) · [출처 실습 코드](../src/okf/provenance.ts)

실제로 가져올 부분은 **scaccogatto의 작성·검증 순서와 각주 예시, Inkeep의 인용 가능한 개념 크기와 출처·검토 기록 기준**이다. 문구는 반품·환불 예제로 다시 쓰고 원문 링크를 남기면 된다. 이번 작업은 도입 판단을 위한 비교이며, 분석 결과만 이 문서에 저장했다.

완성된 번들을 다른 소비 도구에서 읽는 실습에는 scaccogatto의 `visualize`가 별도로 쓸 만하다. `knowledge/`를 대상으로 개념 링크와 출처 관계를 HTML 그래프로 살펴볼 수 있다. 이번 비교는 소스 검토를 기준으로 하며 외부 스킬이나 Python 스크립트는 실행하지 않았다. [시각화 스킬 안내](https://github.com/scaccogatto/okf-skills#use-it)
