# src/okf 모듈 구조

`src/okf/`의 TS 파일이 각각 무엇을 하고 서로 어떻게 이어지는지 정리한다. 용어는 [GLOSSARY.md](../GLOSSARY.md)를 따른다. 명세 절 번호(§)는 OKF v0.3 기준이다 (2026-11-19 v0.2에서 이전).

모든 모듈은 파일 시스템을 모른다. 입력은 `Bundle`(번들 루트 기준 경로 → 파일 내용)이고 출력은 값이다. 디스크를 읽는 곳은 `load.ts` 하나, 화면에 찍는 곳은 루트 CLI뿐이다. 그래서 나중의 웹 화면도 같은 모듈을 그대로 쓴다.

## 1. 한눈에 보기

```mermaid
flowchart TB
  subgraph cli["루트 CLI"]
    c_validate["validate.ts"]
    c_retrieve["retrieve.ts"]
    c_prompt["prompt.ts"]
    c_check["check-answer.ts"]
    c_compare["compare.ts"]
    c_trace["trace.ts"]
    c_graph["graph.ts"]
  end

  m_ask["ask.ts<br/>질의응답: 질문 하나 처리"]

  subgraph consumers["소비자 모듈"]
    m_validate["validate.ts<br/>적합성 검사"]
    m_retrieve["retrieve.ts<br/>검색 단계"]
    m_answer["answer.ts<br/>프롬프트·인용 검사"]
    m_trust["trust.ts<br/>신뢰 등급·낡음"]
    m_provenance["provenance.ts<br/>출처·각주"]
    m_compare["compare.ts<br/>검색 설정 비교"]
    m_graph["graph.ts<br/>링크·출처 그래프"]
  end

  m_concept[["concept.ts<br/>개념 읽기"]]
  m_types["types.ts<br/>Bundle · Issue"]

  c_validate --> m_validate
  c_retrieve --> m_ask
  c_prompt --> m_ask
  c_check --> m_ask
  c_check --> m_answer
  c_compare --> m_compare
  c_trace --> m_provenance
  c_graph --> m_graph

  m_ask --> m_retrieve & m_trust & m_answer
  m_compare --> m_retrieve
  m_graph --> m_provenance
  m_validate & m_retrieve & m_answer & m_trust & m_provenance & m_graph & m_ask --> m_concept
  m_concept --> m_types
```

그림에서 뺀 입력 모듈 두 개: 모든 CLI는 `load.ts`(디렉터리 → `Bundle`)로 번들을 읽고, `retrieve`·`prompt`·`check-answer`·`compare`는 `args.ts`(argv → 검색 설정)로 옵션을 검증한다.

아래층일수록 많이 쓰인다. `concept.ts`는 모든 소비자 모듈이 거치는 바닥이다.

## 2. 모듈별 역할

| 파일 | 역할 | 주요 export | 쓰는 모듈 | 회차 |
| --- | --- | --- | --- | --- |
| `types.ts` | 공용 타입. 번들은 `Map<경로, 내용>`이다 | `Bundle`, `Issue`, `Rule`, `Level` | 전부 | 3 |
| `load.ts` | 디렉터리 아래 `.md`를 읽어 `Bundle`로 만든다. `.`으로 시작하는 파일·디렉터리는 번들이 아니라 읽지 않는다(§3.2-4). 유일하게 디스크를 읽는다 | `loadBundle` | CLI, 실제 번들 테스트 | 3 |
| `concept.ts` | **개념 읽기.** 파일 하나를 frontmatter와 본문으로 나누고 YAML을 한 번 파싱하고 링크를 뽑는다. 예약 파일(`index.md`·`log.md`)과 개념이 아닌 파일(type 없음, §3.2)을 구분한다. 빈 값·단일 값(§11.2), 시각(§5), 번들 버전(§8.1), 경로 필드와 v0.2 대체 해석(§6.2, §12.1)도 여기서 공통으로 읽는다 | `readBundle`, `readFile`, `readBundleFile`, `readConcepts`, `toConcept`, `conceptType`, `isConceptPath`, `frontmatterData`, `splitFrontmatter`, `resolveLink`, `extractLinks`, `dateText`, `isBlank`, `asList`, `parseTimestamp`, `bundleVersion`, `allowsLegacyPaths`, `classifyResource`, `pathFields`, `resolvePathField` | 모든 소비자 모듈 | 3·4 (리팩터링으로 모음) |
| `validate.ts` | 명세 §11.1 적합성 오류(YAML 파싱, 예약 파일 frontmatter)와, 개념이 아닌 파일·버전 선언·시각·검토 기록·링크 경고, 팀 규칙 경고를 낸다 | `validateBundle` (+ concept.ts 함수 다시 내보냄) | `validate` CLI | 3 |
| `retrieve.ts` | **검색 단계.** 질문과 개념의 두 글자 묶음(bigram) 겹침으로 점수를 매기고, 기준·상한으로 고른 뒤 링크 확장을 한 단계 한다 | `retrieve`, `score`, `bigrams`, `DEFAULT_OPTIONS`, `Options`, `Pick` | `ask`, `compare`, `args` | 4 |
| `answer.ts` | **생성 단계의 입력과 출력.** 고른 개념의 본문으로 프롬프트를 만들고, 모델 답변의 인용을 검사한다 | `buildPrompt`, `providedPaths`, `checkAnswer`, `extractCitations`, `splitSentences`, `INSTRUCTION` | `ask`, `check-answer` CLI | 5 |
| `compare.ts` | 질문 목록 × 검색 설정 세 가지로 검색을 돌려 기대 근거와 비교한다 (빠진 근거, 불필요한 개념, 링크가 살린 근거) | `compare`, `judge`, `settings`, `QUESTIONS`, `toMarkdown`, `summarize` | `compare` CLI | 6 |
| `provenance.ts` | frontmatter `sources`와 본문 각주를 읽고 서로 맞는지 검사한다. 출처를 `resolvePathField`로 풀어 원문 개념까지 거슬러 올라간다 | `readProvenance`, `provenanceOf`, `classifyResource`, `checkAttribution`, `trace`, `formatTrace` | `graph`, `trace` CLI | 7 |
| `trust.ts` | 검토 기록(`verified`) 가운데 `generated.at` 이후의 현재 기록만으로 신뢰 등급을 정하고(§5.3), `status`·`superseded_by`·`stale_after`로 주의를 붙인다. 개념을 빼지 않는다 | `assess`, `normalizeVerified`, `readVerified`, `generatedAt`, `isCurrent`, `trustTier`, `readFrontmatter`, `formatAssessment` | `ask` | 8 |
| `graph.ts` | 개념을 노드로, 개념을 가리키는 링크와 경로 필드(sources·superseded_by·resource …)를 간선으로 그래프를 만들고(§6.4) 역링크를 구한다. 개념을 가리키지 않는 참조는 `dangling`에 둔다 | `buildGraph`, `backlinks`, `formatGraph`, `toMermaid` | `graph` CLI | 9 |
| `ask.ts` | **질의응답.** 질문 하나에 대해 검색 → 고른 개념마다 신뢰 판정(deprecated면 대체 경로 해석) → 프롬프트까지 한 번에 돌려준다 | `ask`, `Asked`, `AssessedPick`, `Replacement` | `retrieve`·`prompt`·`check-answer` CLI | 리팩터링 |
| `args.ts` | CLI 인자를 검색 설정으로 바꾸고 검증한다. 잘못된 상한·기준·fields·시각은 오류로 끝낸다 | `parseSearchArgs`, `searchArgsOrExit` | `retrieve`·`prompt`·`check-answer`·`compare` CLI | 리팩터링 |

## 3. 데이터가 바뀌는 순서

질문 하나가 프롬프트가 되기까지 값의 모양이 이렇게 바뀐다.

```mermaid
flowchart LR
  dir[(knowledge/)] -->|loadBundle| B[Bundle<br/>Map 경로→문자열]
  B -->|readBundle| F[BundleFile 목록<br/>kind · frontmatter 상태 · body · links]
  F -->|toConcept<br/>kind가 concept인 것만| C[Concept 목록<br/>메타 필드 · body · links · frontmatter]
  C -->|retrieve<br/>점수·기준·상한·링크 확장| P[Pick 목록<br/>path · via · score · matched]
  P -->|ask: assess| A[AssessedPick 목록<br/>+ 신뢰 등급 · 주의]
  P -->|buildPrompt<br/>본문만| Q[프롬프트 문자열]
  Q -.모델.-> R[답변]
  R -->|checkAnswer<br/>providedPaths로 준 문서와 비교| K[AnswerCheck<br/>인용 · 지어낸 근거 · 인용 없는 문장]
```

- `BundleFile.frontmatter`는 세 상태 중 하나다: `absent`(블록이 없음), `invalid`(닫는 `---` 없음, YAML 오류, 매핑이 아님), `ok`(파싱 결과).
- `BundleFile.kind`는 넷 중 하나다: `index`·`log`(예약 파일, §3.1), `concept`(frontmatter가 `ok`이고 비어 있지 않은 문자열 `type`이 있음), `other`(그 밖의 `.md`. 개념이 아니다, §3.2).
- `Concept.frontmatter`에는 메타 필드 밖의 키(`status`, `verified`, `stale_after`, `sources` …)도 그대로 있다. `ask`는 이것으로 신뢰 판정을 한다.
- 프롬프트에는 frontmatter가 들어가지 않는다. 메타 필드는 검색 단계에서만 쓰고, 근거는 본문에서만 온다.

## 4. CLI별 흐름

### `pnpm validate [dir]`

```mermaid
flowchart LR
  load[loadBundle] --> rb[readBundle]
  rb --> k{kind}
  k -->|index| ci[checkIndex<br/>§8 · §8.1 index-frontmatter · missing-okf-version · unquoted-version]
  k -->|concept · other| cc[checkConcept<br/>§4 yaml-parse · §3.2 not-a-concept<br/>§5 bad-timestamp · incomplete-verified]
  k -->|log| cl2[checkLog<br/>§9 log-frontmatter]
  rb --> cl[checkLinks<br/>broken-link · link-outside-bundle · team/relative-links]
  ci & cc & cl2 & cl --> out[Issue 목록 → ERROR/WARN 출력, 오류 있으면 종료 코드 1]
```

### `pnpm retrieve "질문"` · `pnpm prompt "질문"`

```mermaid
sequenceDiagram
  participant CLI as retrieve / prompt
  participant args as args.ts
  participant ask as ask.ts
  participant r as retrieve.ts
  participant t as trust.ts
  participant a as answer.ts
  CLI->>args: searchArgsOrExit(argv)
  args-->>CLI: 검색 설정 · dir · now
  CLI->>ask: ask(bundle, 질문, 설정, now)
  ask->>r: retrieve → picks · warnings
  ask->>t: 고른 개념마다 assess(frontmatter, now)
  ask->>a: buildPrompt(bundle, 질문, picks)
  ask-->>CLI: Asked { picks(+assessment), warnings, prompt }
  Note over CLI: retrieve는 picks와 신뢰·주의를 찍고<br/>prompt는 prompt만 찍는다
```

검색 단계 안쪽(`retrieve.ts`):

1. `readConcepts`로 개념을 읽는다 (인덱스·로그·type 없는 파일·파싱 실패 제외).
2. 개념마다 `score`: 질문 bigram ∩ 개념 bigram 수. `fields`가 `body+meta`이면 type·title·description·tags도 본다.
3. 기준(`minScore`) 이상을 점수 내림차순·경로순으로 상한(`maxDocs`)까지 고른다.
4. `followLinks`이면 키워드로 고른 개념의 링크만 한 단계 따라가 더한다. 대상이 개념이 아니면(번들에 없음, type 없음) 경고하고 건너뛴다. 상한을 넘으면 경고만 남긴다.

`ask`는 고른 개념마다 `assess`를 부르고, `status: deprecated`에 `superseded_by`가 있으면 `resolvePathField`로 풀어 `replacement`에 담는다. 대체 개념을 검색 결과에 더하지는 않는다. `retrieve` CLI는 `대체 개념:` 줄로 보여 준다.

### `pnpm check-answer "질문" answers/qN.txt [--prompt answers/qN.prompt.txt]`

```mermaid
flowchart LR
  args[searchArgsOrExit] --> has{--prompt?}
  has -->|있음| pp[providedPaths<br/>저장한 프롬프트의 document path]
  has -->|없음| re[ask를 다시 돌려 picks 경로]
  pp & re --> ca[checkAnswer<br/>문장 나누기 → 인용 뽑기]
  ca --> out[주지 않은 문서 인용 = ERROR<br/>인용 없는 문장 = WARN<br/>근거 없음 선언 여부]
```

`--prompt` 없이 돌리면 그 사이 번들이나 설정이 바뀌었을 때 실제로 준 문서와 다를 수 있다. 인용한 파일에 정말 그 내용이 있는지는 사람이 확인한다.

### `pnpm compare [--max --min]`

```mermaid
flowchart LR
  Q[QUESTIONS<br/>질문 · 기대 근거] --> cmp
  S[settings<br/>본문 / 본문+분류 / 본문+분류+링크] --> cmp
  cmp[compare<br/>질문 × 설정마다 retrieve] --> j[judge<br/>빠진 근거 · 불필요한 개념 · 링크가 살린 근거]
  j --> md[toMarkdown · summarize<br/>evaluation.md용 표]
```

fields와 링크 확장은 세 설정이 정하므로 `--fields`·`--no-links`는 받지 않는다.

### `pnpm trace policies/returns.md`

```mermaid
flowchart TB
  t[trace 개념] --> rp[readProvenance<br/>sources · 각주 주장]
  rp --> ca[checkAttribution<br/>unknown-label · missing-resource]
  rp --> each[sources 항목마다 classifyResource]
  each -->|url · scope| stop[따라가지 않음]
  each -->|path| rl[resolvePathField<br/>파일 기준, v0.2 번들이면 루트 기준 대체 해석]
  rl -->|번들 밖| out1[outside]
  rl -->|파일 없음| out2[missing]
  rl -->|개념이 아닌 파일| out3[not-a-concept]
  rl -->|번들 안 개념| rec[그 개념을 다시 trace<br/>방문한 개념은 건너뜀]
```

### `pnpm graph [--mermaid]`

```mermaid
flowchart LR
  rb[readBundle] --> tc[toConcept<br/>노드: path · type · title]
  rb --> links[본문 links → resolveLink → link]
  rb --> pf[pathFields → resolvePathField<br/>source · superseded-by · resource …]
  links & pf --> res{대상}
  res -->|번들 밖| w[warnings]
  res -->|개념| e[edges]
  res -->|없음 · 개념 아님| d[dangling]
  tc & e & d --> g[Graph]
  g --> bl[backlinks · formatGraph · toMermaid]
```

## 5. 개념이 아닌 파일과 파싱할 수 없는 파일을 다루는 방식

파싱은 `concept.ts`가 한 번 한다. 결과를 어떻게 다룰지는 소비자마다 다르고, 그 차이는 의도다 (`tests/concept.test.ts`가 고정한다).

| 소비자 | frontmatter가 `invalid`일 때 | frontmatter가 `absent`이거나 `type`이 없을 때 |
| --- | --- | --- |
| validate | `yaml-parse` 오류 (§4, §11.1) | `not-a-concept` 경고. 적합성에는 영향 없음 (§3.2) |
| retrieve · graph · ask | 개념에서 뺀다. 나머지 개념은 계속 읽는다 | 개념에서 뺀다 (§3.2) |
| provenance | 출처가 없는 개념으로 다룬다 |
| trust | `readFrontmatter`가 `null`. 호출하는 쪽이 `{}`로 판정하면 unverified다 |

## 6. 링크·경로 필드 해석이 쓰이는 곳

`resolveLink(from, target)`은 `/`로 시작하면 번들 루트 기준, 아니면 파일이 있는 디렉터리 기준으로 풀고, 루트 밖이면 `null`(외부)이다 (§6). 링크와 경로 필드가 같은 규칙을 쓴다.

경로 필드(`resource`, `sources[].resource`, `superseded_by`, `computation`, `executor.resource`, `attester.resource`, §6.2)는 `resolvePathField(bundle, from, value)`로 푼다. 규칙은 `resolveLink`와 같고, 하나를 더한다: `/` 없는 값이 파일 기준으로 번들에 없고, 번들이 `okf_version` 0.2 이하이거나 선언이 없으면(`allowsLegacyPaths`) 번들 루트 기준으로 다시 찾는다(`legacy: true`, §6.2, §12.1). 본문 링크에는 이 대체 해석을 쓰지 않는다.

| 소비자 | 대상 | 번들 밖 | 번들에 없음 · 개념 아님 |
| --- | --- | --- | --- |
| validate | 본문 링크 | `link-outside-bundle` 경고 | `broken-link` 경고 (`dir/index.md`가 있으면 정상) |
| retrieve | 키워드로 고른 개념의 본문 링크 | 경고 후 건너뜀 | 경고 후 건너뜀 |
| graph | 본문 링크 + 모든 경로 필드 | 경고, 간선 없음 | 간선 없음, `dangling`에 `missing`·`not-a-concept` |
| provenance | sources (`resolvePathField`) | `outside` | `missing` · `not-a-concept` |
| ask | `superseded_by` (`resolvePathField`) | `replacement.target: null` | `replacement.concept: false` |

## 7. 테스트

| 테스트 | 대상 |
| --- | --- |
| `tests/concept.test.ts` | 파일 읽기, frontmatter 상태, kind, 소비자별 파싱 실패 처리, 빈 값·단일 값, 시각, 번들 버전, 경로 필드·대체 해석, 점 경로 |
| `tests/validate.test.ts` | 0003 1~7단계 (4단계는 v0.3 규칙) |
| `tests/retrieve.test.ts` | 0004 bigram·score·retrieve, 실제 번들 기록 |
| `tests/answer.test.ts` | 0005 buildPrompt·checkAnswer |
| `tests/compare.test.ts` | 0006 judge·compare, 실제 번들 기록 |
| `tests/provenance.test.ts` | 0007 checkAttribution·trace |
| `tests/trust.test.ts` | 0008 normalizeVerified·trustTier·assess, 실제 번들 (T4) |
| `tests/graph.test.ts` | 0009 buildGraph·backlinks·toMermaid, 경로 필드 간선·dangling·대체 해석 |
| `tests/ask.test.ts` | 질의응답: 고른 개념별 신뢰 판정, 대체 경로, 프롬프트, providedPaths |
| `tests/args.test.ts` | 검색 설정 인자 검증 |

## 8. 바꿀 때 손댈 곳

- **주의를 모델에게도 넘기기 (0008 실습 5단계):** 정책을 정한 뒤 `ask.ts`의 `buildPrompt` 호출 한 곳에서 `AssessedPick.assessment`를 프롬프트에 반영한다. 지금 프롬프트는 0005 그대로다.
- **검색 순위나 원문 개념(`type: Reference`) 처리 바꾸기:** `retrieve.ts`.
- **새 검색 설정 옵션:** `retrieve.ts`의 `Options`와 `args.ts`의 `parseSearchArgs`를 함께 고친다.
- **새 frontmatter 필드 읽기:** `Concept.frontmatter`에서 바로 읽는다. 빈 값은 `isBlank`, 목록 필드는 `asList`, 시각은 `parseTimestamp`로 읽는다. 공통 해석이 필요하면 `concept.ts`에 둔다.
- **새 경로 필드:** `concept.ts`의 `PathFieldName`·`pathFields`와 `graph.ts`의 `FIELD_KIND`를 함께 고친다.
- **웹 화면:** `Bundle`을 브라우저에서 만든 뒤 `ask`, `validateBundle`, `buildGraph`, `trace`를 그대로 부른다. `load.ts`와 `args.ts`만 화면 쪽 adapter로 바꾸면 된다.
