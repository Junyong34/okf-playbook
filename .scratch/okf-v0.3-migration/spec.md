# OKF v0.2 → v0.3 마이그레이션 스펙

Status: ready-for-agent

사용자 요청(2026-11-19): 코드, 실습 코드, `learn/` 학습 자료를 OKF v0.3 기준으로 바꾼다.

## 1차 자료

- v0.3 명세: https://github.com/open-knowledge-format/open-knowledge-format/blob/main/SPEC.md (로컬 사본 `/tmp/okf-v03/new/SPEC.md`, 커밋 `527e81a`)
- v0.2 명세 (deprecated 저장소): https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md (로컬 사본 `/tmp/okf-v03/old/SPEC.md`)
- 공식 이전 절차: `/tmp/okf-v03/new/skills/okf-generate/references/migration.md`
- 공식 검증기 참고: `/tmp/okf-v03/new/skills/okf-generate/scripts/validate.py`
- 링크는 새 저장소의 고정 커밋 `https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md#<anchor>` 형식을 쓴다. 앵커는 로컬 사본 제목으로 만든다(GitHub 규칙: 소문자, 공백→`-`, 구두점 제거). 예: `#53-trust-tiers`, `#13-changes-from-v02`.

## 절 번호 대응 (v0.2 → v0.3)

v0.3 제목 목록은 `grep -n '^#' /tmp/okf-v03/new/SPEC.md`로 확인한다. 주요 이동:
- v0.2 §13 "Changes from v0.1" → v0.3 Appendix B. v0.3 §13은 "Changes from v0.2".
- v0.2 §10 "Attested computations concept" → v0.3 §10 "Attested computations".
- v0.3 §3.2 (개념·asset 판별), §5.4 `superseded_by`, §6 해석 규칙, §6.4 그래프, §8.1 번들 메타데이터, §11.2 소비자 규칙, §12 버전 정책은 새로 생겼거나 크게 바뀌었다. 인용할 때마다 로컬 사본에서 다시 확인한다.

## 결정 사항 (코드)

| 영역 | v0.3 동작 | 근거 |
| --- | --- | --- |
| 개념 판별 | frontmatter가 없거나 `type`이 비어 있는 `.md`(예약 파일 제외)는 개념이 아니다. `validate`는 **warning** `not-a-concept`. frontmatter YAML 파싱 실패는 여전히 error `yaml-parse`. | §3.2, §11.1 |
| 점 경로 | `.`으로 시작하는 파일·디렉터리는 번들 밖. `loadBundle`이 읽지 않는다. | §3.2-4 |
| 루트 index frontmatter | `okf_version`, `title`, `description`, `license`와 확장 키를 허용한다. 오류 없음. `okf_version`이 없으면 warning `missing-okf-version`(SHOULD), 문자열이 아니면 warning `unquoted-version`. 하위 index.md frontmatter는 여전히 error. | §8, §8.1, §4 |
| log.md | frontmatter가 있으면 error `log-frontmatter`. | §9, §11.1-2 |
| 경로 해석 | `/`로 시작 → 번들 루트, 그 밖 → 파일 디렉터리. 링크와 경로 필드 같은 규칙. 번들 밖 → 외부. (기존 `resolveLink`와 같음) | §6 |
| v0.2 대체 해석 | 경로 필드가 `/` 없이 파일 기준으로 해석되지 않고, 번들이 `okf_version` 0.2 이하이거나 선언이 없으면 번들 루트 기준으로 다시 찾는다. 경로 필드에만 적용, 본문 링크에는 적용하지 않는다. 번들 버전 읽는 함수를 `concept.ts`에 둔다. | §6.2, §12.1 |
| 경로 필드 | `resource`, `sources[].resource`, `superseded_by` (`computation`, `executor.resource`, `attester.resource`는 이 번들에 없지만 그래프 수집 대상 목록에는 넣는다). | §6.2 |
| 그래프 | 간선 = 본문 링크 중 개념을 가리키는 것 + 개념으로 해석되는 모든 경로 필드. 간선 종류는 `link`·`source`에 `superseded-by`, `resource` 등을 더한다. | §6.4 |
| 시각 | 허용 형식: 오프셋 있는 date-time, 날짜만(UTC 0시). YAML 고유 Date도 허용. 오프셋 없는 date-time과 그 밖 형식은 무효. 공용 파서를 `concept.ts`에 둔다(`parseTimestamp(v): number \| null`). | §5 |
| verified | `by`와 `at`이 둘 다 있어야 기록으로 친다. 없으면 무시하고 warning. 대시 없는 매핑 하나는 목록 하나. | §5.2, §11.2-3 |
| 신뢰 등급 | `generated.at` 이상인 `at`을 가진 기록만 현재 기록. `generated`가 없으면 모두 현재. 현재 기록이 없으면 unverified, `human:`이 있으면 human-reviewed, 아니면 machine-confirmed. 현재가 아닌 기록은 이력으로 보여 준다("마지막 변경 전 검토"). | §5.3, §7 |
| status | 없으면 stable. draft·deprecated는 주의. 그 밖 값은 stable이 아니고 원래 값을 보여 준다. `superseded_by`가 있으면 판정 결과와 출력에 대체 경로를 보여 준다. | §5.4 |
| stale_after | 빈 값·null은 없는 것. 파싱 불가면 **신선하지 않다**(stale 아님이 아니라 `fresh: false`, 주의 `bad-date`). | §5.5, §11.2 |
| 빈 값·단일 값 | null·빈 문자열·빈 목록은 없는 것. 스칼라 `tags`는 태그 하나(쉼표로 나누지 않음). `sources`, `verified`도 단일 항목 허용. | §11.2 |
| 버전 | `knowledge/index.md`를 `okf_version: "0.3"`으로 바꾸고 `title`, `description`을 넣는다. `license`는 넣지 않는다(정보 없음). | §8.1, 이전 절차 1 |

## 하지 않는 것

- `verified`의 `human:` 기록을 에이전트가 추가하거나 고치지 않는다(AGENTS.md). `knowledge/references/returns-faq.md`의 `by: human`(콜론 없음)도 사용자 데이터이므로 그대로 둔다.
- `knowledge/policies/return-exceptions.md`의 `status: deprecated`는 사용자 실습 결과다. 바꾸지 않는다. 이 때문에 `tests/trust.test.ts`의 실제 번들 테스트가 마이그레이션 전부터 실패한다. 테스트를 사용자 데이터에 맞춰 억지로 고치지 말고 결과 보고에 남긴다.
- `learn/learning-records/`의 기존 기록 내용은 다시 쓰지 않는다. 사용자가 실제로 익힌 기록이기 때문이다. 맨 위에 v0.2 기준 기록이라는 한 줄 안내만 붙인다.
- 사용자 초안 `docs/faq-okf-skill-plan.md`, `docs/obsidian-graph-research.md`(untracked)는 손대지 않는다.
- 커밋하지 않는다.
