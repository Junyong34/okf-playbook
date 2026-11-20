# 검색·답변 평가

학습 계획 §4 "검증할 질문"의 기록표. 4회차에 검색 결과를 채우고, 5회차에 답변 결과를, 6회차에 설정 비교를 더한다.

## 4회차: 검색 (기본 설정 `body+meta`, 링크 on, max 3, min 2)

| # | 질문 | 기대 근거 | 키워드로 고른 개념 | 링크로 추가한 개념 | 빠진 근거 | 불필요한 개념 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 물건을 받은 지 5일 됐어요. 반품 신청할 수 있나요? | `returns.md` | `returns.md` (3: 반품, 신청, 청할), `refunds.md` (2: 5일, 반품) | `return-exceptions.md` | 없음 | `refunds.md`, `return-exceptions.md` |
| 2 | 8일이 지난 할인 상품도 반품할 수 있나요? | `returns.md` | `return-exceptions.md` (3: 반품, 상품, 품할), `returns.md` (3: 반품, 상품, 할인) | `refunds.md` | 없음 | `return-exceptions.md`, `refunds.md` |
| 3 | 할인 상품인데 주문할 때 최종 판매로 표시됐어요. | `returns.md`, `return-exceptions.md` | `return-exceptions.md` (7), `returns.md` (6) | `refunds.md` | 없음 | `refunds.md` |
| 4 | 반품이 승인됐는데 언제 환불되나요? | `refunds.md` | `returns.md` (3: 반품, 승인, 환불), `refunds.md` (3: 반품, 승인, 환불) | `return-exceptions.md` | 없음 | `returns.md`, `return-exceptions.md` |
| 5 | 할인 상품을 반품할 수 있나요? 환불은 언제 들어오나요? | `returns.md`, `return-exceptions.md`, `refunds.md` | `returns.md` (5), `return-exceptions.md` (3), `refunds.md` (3) | 없음 (상한 3개를 키워드가 채움) | 없음 | 없음 |
| 6 | 해외 주문 반품 배송비는 누가 부담하나요? | 없음 (번들에서 확인할 수 없음) | `return-exceptions.md` (2: 반품, 주문) | `returns.md` | 해당 없음 | `return-exceptions.md`, `returns.md` |

메모 (2026-11-18, 에이전트가 CLI 결과로 채움. 판단은 사용자가 검토할 것):

- **빠진 근거는 없다.** 6개 질문 모두 기대 근거를 찾았다. 대신 불필요한 개념이 거의 모든 질문에 섞인다. 개념이 3개뿐이고 상한도 3개라서, 키워드와 링크가 사실상 번들 전체를 넘기는 경우가 많다.
- **"반품"은 변별력이 없다.** 모든 개념에 있어서 모든 개념이 1점을 먼저 얻는다. 질문 6은 "반품"과 "주문" 두 개만 겹쳐도 기준 2점을 넘었다.
- **"5일" 오탐.** 질문 1의 "5일"이 환불 본문의 "3~5일"과 같은 묶음이 되어 `refunds.md`가 키워드로 걸렸다.
- **링크 확장은 대부분 불필요한 개념을 더했다.** 질문 1~4에서 링크로 들어온 개념은 모두 그 질문에 필요 없었다. 질문 5는 키워드가 상한을 채워 링크 단계가 아무것도 더하지 않았다.
- **설정 실험 (질문 1, `--max 1`)**: 링크를 켜도 끄도 `returns.md` 하나만 남는다. 링크 단계는 상한 경고만 남긴다. 상한을 줄이면 링크 확장이 결과를 바꿀 수 없다.
- **설정 실험 (질문 6, `--min 3`)**: 고른 개념이 없어져 "근거 없음"이 검색 단계에서 처리된다. 같은 기준을 질문 1~5에 적용하면 무엇이 빠지는지는 6회차에서 비교한다.

## 5회차: 답변

프롬프트는 `pnpm prompt`, 검사는 `pnpm check-answer`. 사람 확인 칸에는 인용한 파일을 열어 문장마다 내용이 실제로 있는지 표시한다.

| # | 답변 파일 | 모델 | 인용한 문서 | check-answer (ERROR / WARN) | 사람 확인: 문장별 근거 일치 | 근거 없음 처리 |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | `answers/q3.txt` | | | | | |
| 4 | `answers/q4.txt` | | | | | |
| 5 | `answers/q5.txt` | | | | | |
| 6 | `answers/q6.txt` | | | | | |

메모:

## 6회차: 설정 비교

세 설정(본문 / 본문+분류 / 본문+분류+링크)을 같은 상한·기준으로 비교한다. 표는 `pnpm -s compare` 출력을 붙여 넣는다. 레슨: `learn/lessons/0006-compare-settings.html`.

### 돌리기 전 예측

1. 본문과 본문+분류의 결과가 달라지는 질문 수:
2. 링크 확장이 기대 근거를 살린 질문 수:
3. `--min 3`에서 기대 근거를 잃는 질문(1~5):

### 기본 (max 3, min 2)

| # | 설정 | 고른 개념 (점수 또는 링크) | 빠진 근거 | 불필요한 개념 | 링크가 살린 근거 |
| --- | --- | --- | --- | --- | --- |
| q1 | 본문 | returns.md(3), refunds.md(2) | 없음 | refunds.md |  |
| q1 | 본문+분류 | returns.md(3), refunds.md(2) | 없음 | refunds.md |  |
| q1 | 본문+분류+링크 | returns.md(3), refunds.md(2), return-exceptions.md(링크) | 없음 | refunds.md, return-exceptions.md |  |
| q2 | 본문 | return-exceptions.md(3), returns.md(3) | 없음 | return-exceptions.md |  |
| q2 | 본문+분류 | return-exceptions.md(3), returns.md(3) | 없음 | return-exceptions.md |  |
| q2 | 본문+분류+링크 | return-exceptions.md(3), returns.md(3), refunds.md(링크) | 없음 | return-exceptions.md, refunds.md |  |
| q3 | 본문 | return-exceptions.md(7), returns.md(6) | 없음 | 없음 |  |
| q3 | 본문+분류 | return-exceptions.md(7), returns.md(6) | 없음 | 없음 |  |
| q3 | 본문+분류+링크 | return-exceptions.md(7), returns.md(6), refunds.md(링크) | 없음 | refunds.md |  |
| q4 | 본문 | returns.md(3), refunds.md(3) | 없음 | returns.md |  |
| q4 | 본문+분류 | returns.md(3), refunds.md(3) | 없음 | returns.md |  |
| q4 | 본문+분류+링크 | returns.md(3), refunds.md(3), return-exceptions.md(링크) | 없음 | returns.md, return-exceptions.md |  |
| q5 | 본문 | returns.md(5), return-exceptions.md(3), refunds.md(3) | 없음 | 없음 |  |
| q5 | 본문+분류 | returns.md(5), return-exceptions.md(3), refunds.md(3) | 없음 | 없음 |  |
| q5 | 본문+분류+링크 | returns.md(5), return-exceptions.md(3), refunds.md(3) | 없음 | 없음 |  |
| q6 | 본문 | return-exceptions.md(2) | 해당 없음 | return-exceptions.md |  |
| q6 | 본문+분류 | return-exceptions.md(2) | 해당 없음 | return-exceptions.md |  |
| q6 | 본문+분류+링크 | return-exceptions.md(2), returns.md(링크) | 해당 없음 | return-exceptions.md, returns.md |  |
| q7 | 본문 | (없음) | refunds.md | 없음 |  |
| q7 | 본문+분류 | refunds.md(2) | 없음 | 없음 |  |
| q7 | 본문+분류+링크 | refunds.md(2) | 없음 | 없음 |  |
| q8 | 본문 | returns.md(3), return-exceptions.md(2) | refunds.md | return-exceptions.md |  |
| q8 | 본문+분류 | returns.md(3), return-exceptions.md(2) | refunds.md | return-exceptions.md |  |
| q8 | 본문+분류+링크 | returns.md(3), return-exceptions.md(2), refunds.md(링크) | 없음 | return-exceptions.md | refunds.md |

| 설정 | 빠진 근거 | 불필요한 개념 | 링크가 살린 근거 |
| --- | --- | --- | --- |
| 본문 | 2 | 5 | 0 |
| 본문+분류 | 1 | 5 | 0 |
| 본문+분류+링크 | 0 | 10 | 1 |

### 기준 올림 (max 3, min 3)

| # | 설정 | 고른 개념 (점수 또는 링크) | 빠진 근거 | 불필요한 개념 | 링크가 살린 근거 |
| --- | --- | --- | --- | --- | --- |
| q1 | 본문 | returns.md(3) | 없음 | 없음 |  |
| q1 | 본문+분류 | returns.md(3) | 없음 | 없음 |  |
| q1 | 본문+분류+링크 | returns.md(3), return-exceptions.md(링크), refunds.md(링크) | 없음 | return-exceptions.md, refunds.md |  |
| q2 | 본문 | return-exceptions.md(3), returns.md(3) | 없음 | return-exceptions.md |  |
| q2 | 본문+분류 | return-exceptions.md(3), returns.md(3) | 없음 | return-exceptions.md |  |
| q2 | 본문+분류+링크 | return-exceptions.md(3), returns.md(3), refunds.md(링크) | 없음 | return-exceptions.md, refunds.md |  |
| q3 | 본문 | return-exceptions.md(7), returns.md(6) | 없음 | 없음 |  |
| q3 | 본문+분류 | return-exceptions.md(7), returns.md(6) | 없음 | 없음 |  |
| q3 | 본문+분류+링크 | return-exceptions.md(7), returns.md(6), refunds.md(링크) | 없음 | refunds.md |  |
| q4 | 본문 | returns.md(3), refunds.md(3) | 없음 | returns.md |  |
| q4 | 본문+분류 | returns.md(3), refunds.md(3) | 없음 | returns.md |  |
| q4 | 본문+분류+링크 | returns.md(3), refunds.md(3), return-exceptions.md(링크) | 없음 | returns.md, return-exceptions.md |  |
| q5 | 본문 | returns.md(5), return-exceptions.md(3), refunds.md(3) | 없음 | 없음 |  |
| q5 | 본문+분류 | returns.md(5), return-exceptions.md(3), refunds.md(3) | 없음 | 없음 |  |
| q5 | 본문+분류+링크 | returns.md(5), return-exceptions.md(3), refunds.md(3) | 없음 | 없음 |  |
| q6 | 본문 | (없음) | 해당 없음 | 없음 |  |
| q6 | 본문+분류 | (없음) | 해당 없음 | 없음 |  |
| q6 | 본문+분류+링크 | (없음) | 해당 없음 | 없음 |  |
| q7 | 본문 | (없음) | refunds.md | 없음 |  |
| q7 | 본문+분류 | (없음) | refunds.md | 없음 |  |
| q7 | 본문+분류+링크 | (없음) | refunds.md | 없음 |  |
| q8 | 본문 | returns.md(3) | refunds.md | 없음 |  |
| q8 | 본문+분류 | returns.md(3) | refunds.md | 없음 |  |
| q8 | 본문+분류+링크 | returns.md(3), return-exceptions.md(링크), refunds.md(링크) | 없음 | return-exceptions.md | refunds.md |

| 설정 | 빠진 근거 | 불필요한 개념 | 링크가 살린 근거 |
| --- | --- | --- | --- |
| 본문 | 2 | 2 | 0 |
| 본문+분류 | 2 | 2 | 0 |
| 본문+분류+링크 | 1 | 8 | 1 |

### 직접 만든 질문 (q7, q8)

| # | 질문 | 기대 근거 | 노린 사례 |
| --- | --- | --- | --- |
| 7 | 환불 기간이 얼마나 되나요? | `refunds.md` | 분류를 더하면 찾는다 ("기간"은 `description`에만 있음) |
| 8 | 할인 상품 반품했는데 돈은 언제 돌려받나요? | `returns.md`, `refunds.md` | 링크로만 들어온다 (`returns.md`의 환불 절차 링크) |

q7·q8은 레슨 모범 답안의 예시 질문이다 (에이전트가 넣음).

관찰 (2026-11-18, 에이전트가 CLI 결과로 채움. 판단은 사용자가 검토할 것):

- **본문 vs 본문+분류**: 질문 1~6은 결과가 같다. `title`·`tags`의 단어가 본문 제목이나 문장에 이미 있다. 차이는 q7에서만 난다. "기간"이 `refunds.md`의 `description`에만 있다.
- **링크**: 질문 1~6에서는 기대 근거를 하나도 살리지 못하고 불필요한 개념만 더했다 (q1~q6 합계 4 → 9). q8에서 처음으로 `refunds.md`를 살렸다. `returns.md` 본문의 "반품 승인 이후의 일정은 [환불 절차]…" 링크다.
- **`--min 3`**: 질문 1~6에서는 잃는 근거가 없다. q1의 "5일" 오탐(`refunds.md` 2점)이 빠지고, q6은 검색 단계에서 "고른 개념 없음"이 된다. 대신 q7(2점)을 모든 설정에서 잃는다. 기준을 올리면 짧은 질문이 먼저 빠진다.
- **기준과 링크의 상호작용**: `--min 3`의 q8에서는 `return-exceptions.md`가 키워드에서 떨어졌다가 링크로 다시 들어왔다.

예측과 비교 (2026-11-18, 사용자 요청으로 에이전트가 씀):

돌리기 전 예측은 기록하지 않고 결과를 먼저 봤다. 그래서 위 "돌리기 전 예측" 칸은 비워 두고, 4회차 메모에 남아 있던 기대와 실제 결과를 비교한다. 표의 설정 이름 "본문+분류"는 본문과 메타 필드를 함께 본다는 뜻이다.

| 레슨 2절 질문 | 4회차까지의 기대 | 실제 (질문 1~6) | 실제 (q7·q8 포함) |
| --- | --- | --- | --- |
| 1. 본문과 본문+메타 필드의 결과가 달라지는 질문 수 | 거의 차이가 없을 것이다 (메타 필드의 단어가 본문에도 있음) | 0개. 기대와 같다 | 1개 (q7) |
| 2. 링크 확장이 기대 근거를 살린 질문 수 | 링크는 대부분 불필요한 개념을 더한다 | 0개. 기대와 같다 | 1개 (q8) |
| 3. `--min 3`에서 기대 근거를 잃는 질문 (1~5) | 6회차에서 확인하기로 남김 | 없음 | q7을 모든 설정에서 잃는다 |

기대가 맞았다. 다만 질문 1~6만으로는 메타 필드와 링크 확장의 효과를 하나도 볼 수 없었다. 효과는 그 효과를 노리고 만든 질문(q7, q8)에서만 나왔다. 질문 목록이 결론을 정한다는 점이 이번 비교에서 가장 크게 배운 점이다.

결론: 빠진 근거, 불필요한 개념, 링크가 살린 근거의 사례 (2026-11-18, 사용자 요청으로 에이전트가 씀):

- **빠진 근거: q7, 본문 설정.** "환불 기간"을 물었는데 `refunds.md`를 고르지 못했다. "기간"이 `refunds.md`의 `description`에만 있고 본문에는 없다. 메타 필드를 더하면 찾는다. 원인은 메타 필드를 보지 않은 것이다. 같은 q7은 `--min 3`에서는 모든 설정에서 빠진다. 겹치는 키워드가 2개뿐이라 기준에 걸린다.
- **불필요한 개념: q1~q6, 본문+메타 필드+링크 설정.** 불필요한 개념이 4개에서 9개로 늘었다. 예를 들어 q4는 `refunds.md`만 필요한데 링크 확장이 `return-exceptions.md`를 더했다. 원인은 링크 확장이다. 링크는 관계가 있다는 사실만 담고 관계의 종류는 주변 문장이 전하는데(명세 §6.1), 검색기는 주변 문장을 보지 않고 모든 링크를 따라간다. "반품"이 모든 개념에 있어 질문 6 같은 근거 없음 질문에도 개념이 골라지는 것은 기준이 낮기 때문이다. `--min 3`이면 q6이 검색 단계에서 근거 없음이 된다.
- **링크가 살린 근거: q8, 본문+메타 필드+링크 설정.** "돈은 언제 돌려받나요"는 `refunds.md`와 키워드가 "반품" 하나만 겹쳐 키워드로는 고르지 못했다. `returns.md`의 "반품 승인 이후의 일정은 [환불 절차]를 따른다" 링크로 들어왔다. 질문이 쓰는 말과 개념이 쓰는 말이 다를 때 링크가 그 차이를 메운다.
- **조건.** 개념이 3개이고 상한도 3개다. 링크 확장을 켜면 번들 전체가 넘어가기 쉽다. "링크는 불필요한 개념을 더한다"는 결론은 이 번들 크기에서만 확인했다.

링크 확장이 불필요한 개념을 덜 더하게 하는 방법 (생각만 적음, 구현하지 않음):

- 링크로 더할 개념도 질문과 키워드가 1개 이상 겹칠 때만 더한다. q8의 `refunds.md`는 "반품"이 겹쳐 남고, q4의 `return-exceptions.md`도 "반품" 때문에 남는다. "반품"처럼 모든 개념에 있는 키워드는 세지 않아야 효과가 있다.
- 링크가 있는 문장(예: "반품 승인 이후의 일정은 …")을 질문과 비교해 점수를 매긴다. 명세 §6.1이 관계의 종류는 주변 문장이 전한다고 하므로 그 문장을 쓰는 방법이다.

## 7회차: 원문 개념을 더한 뒤의 검색

`bundles/knowledge/references/returns-faq.md`(`type: Reference`)를 더하기 전과 뒤의 `pnpm -s compare` 결과를 비교한다. 레슨: `learn/lessons/0007-sources-footnotes.html`.

2026-11-18, 사용자 요청으로 에이전트가 모범 답안을 적용하고 CLI 결과로 채움. 판단은 사용자가 검토할 것.

예측: 기록하지 않았다 (모범 답안을 바로 적용함).

설정별 합계 (질문 q1~q8, max 3, min 2):

| 설정 | 빠진 근거 (전 → 후) | 불필요한 개념 (전 → 후) | 링크가 살린 근거 (전 → 후) |
| --- | --- | --- | --- |
| 본문 | 2 → 3 | 5 → 13 | 0 → 0 |
| 본문+분류 | 1 → 2 | 5 → 13 | 0 → 0 |
| 본문+분류+링크 | 0 → 2 | 10 → 14 | 1 → 0 |

질문별로 본 두 줄 (본문+분류+링크):

| # | 전 | 후 |
| --- | --- | --- |
| q4 | returns.md(3), refunds.md(3), return-exceptions.md(링크) | returns-faq.md(7), returns.md(3), refunds.md(3) |
| q8 | returns.md(3), return-exceptions.md(2), refunds.md(링크) | returns-faq.md(5), returns.md(3), return-exceptions.md(2). 빠진 근거 refunds.md |

메모:

- **FAQ가 모든 질문에서 키워드 1순위가 됐다.** FAQ는 고객이 묻는 말투로 썼다("언제", "~나요", "되나"). 질문도 같은 말투라서 두 글자 묶음이 많이 겹친다. q4에서 FAQ는 7점, 정책 개념은 3점이다. 질문 6(근거 없음)에도 FAQ가 들어온다.
- **FAQ가 근거를 밀어냈다.** 상한이 3개라서 FAQ가 한 자리를 차지하면 다른 개념이 빠진다. q8은 링크로 들어오던 `refunds.md`가 상한에 걸려 빠졌다. 그래서 "링크가 살린 근거"가 1 → 0이 됐다.
- **FAQ를 인용한 답변도 사실은 맞을 수 있다.** FAQ에도 같은 사실이 있다. 하지만 FAQ는 출처이고, 번들이 정리한 근거는 정책·절차 개념이다. FAQ가 근거 자리를 차지하면 정책 개념의 각주로 원문을 따라가는 흐름이 의미를 잃는다.
- **소비자가 할 일 (생각만 적음, 구현하지 않음).** `type`은 소비자가 라우팅과 필터링에 쓴다(§4.1). 검색 단계에서 `type: Reference`를 근거 후보에서 빼고, 답변을 확인할 때 `trace`로만 따라가게 할 수 있다. 다른 방법은 Reference를 후보로 두되 정책 개념보다 낮은 순위로 두는 것이다.
- **6회차 표를 다시 만들려면.** 지금 `pnpm compare`는 FAQ가 든 번들을 읽는다. 6회차 표는 `references/`를 뺀 번들로 만든 것이다. 테스트(R5단계, C2단계 실제 번들)도 그 시점의 번들로 고정했다.

끝까지 따라가기 (실습 5단계):

- 답변: "할인 상품도 수령 후 7일 이내라면 반품할 수 있습니다. [policies/returns.md]"
- 인용 → `policies/returns.md` 4행 "할인 상품을 포함해 수령 후 7일 이내에 반품을 신청할 수 있다.[^returns-faq]"
- 각주 → `sources` id `returns-faq` → `references/returns-faq.md` "상품을 받은 날부터 7일 이내에 신청할 수 있습니다. 할인 상품도 같습니다."
- 세 곳 모두 "7일 이내"와 "할인 상품 포함"이 같다 (에이전트가 파일을 열어 대조함).

## 8회차: 검토 상태와 낡은 개념

레슨: `learn/lessons/0008-trust-lifecycle.html`. 출력은 `--now 2026-11-18T00:00:00Z`로 고정해서 본다.

2026-11-18, 사용자 요청으로 에이전트가 `trust.ts` 모범 답안을 적용하고 CLI 결과로 표를 채움. 3단계(사람 대조)와 5단계(소비자 정책)는 사용자 몫으로 비워 둠.

예측 (실습 2단계, 돌리기 전에):

- 기록하지 않았다 (모범 답안을 바로 적용함).

직접 대조한 개념 (실습 3단계):

| 개념 | 대조한 출처 | 같은가 | 적은 `verified` |
| --- | --- | --- | --- |
| `policies/returns.md` | `references/returns-faq.md` | | (사용자가 직접 대조한 뒤 적는다. 에이전트는 `human:`을 적지 않는다) |

낡은 사본에서 본 것 (실습 4단계, `/tmp/okf-stale`):

| 질문 | `--now` | 주의가 붙은 개념 |
| --- | --- | --- |
| q4 | 2026-11-18T00:00:00Z | `processes/refunds.md`: stale_after 2026-10-01T00:00:00Z가 지났다 |
| q4 | 2026-09-01T00:00:00Z | 없음 (고른 개념은 위와 같다) |
| q3 | 2026-11-18T00:00:00Z | `policies/return-exceptions.md`: status deprecated |

관찰:

- 진짜 번들(`bundles/knowledge/`)은 지금 모든 개념이 unverified이고 주의가 없다. q5 출력에도 신뢰 줄만 붙는다.
- 신뢰 신호는 순위를 바꾸지 않는다. 사본에서도 FAQ(unverified)가 q3·q4 모두 1순위다.
- q3에서 deprecated인 `return-exceptions.md`가 7점으로 2순위다. 이 질문의 핵심 근거라서, 빼면 "최종 판매는 반품 제외"를 받칠 개념이 FAQ밖에 남지 않는다.
- `pnpm validate /tmp/okf-stale`는 오류 0개, 경고 0개. 낡음과 deprecated는 검증 문제가 아니다.

소비자 정책 (실습 5단계):

- 낡은 개념:
- deprecated 개념:
- 모델에 주의를 넘길지, 넘긴다면 어떤 모양으로:

## 9회차: 같은 번들을 다른 방식으로 읽기

레슨: `learn/lessons/0009-read-bundle-differently.html`.

두 소비자로 읽은 진짜 번들 (실습 4단계):

| 비교할 것 | `pnpm graph` (+ `retrieve`) | 공식 뷰어 |
| --- | --- | --- |
| 간선 수 (링크 / 출처) | | |
| FAQ가 이어지는 방식 | | |
| 신뢰 등급·낡음 표시 | | |
| 검색이 보는 필드 ("3~5일", "환불") | | |

사본에서 갈린 지점 (실습 5단계, `/tmp/okf-exp`):

| 바꾼 것 | 우리 | 공식 뷰어 | 명세로 본 판단, 생산자가 쓸 형식 |
| --- | --- | --- | --- |
| (가) 본문 링크 `/processes/refunds.md` | | | |
| (나) `stale_after: 2026-10-01` | | | |
| (다) `verified: { by: human, … }` | | | |

§10 예제 읽기 (실습 6단계, `acme_retail/computations/revenue-ytd.md`):

| 필드 | 내용 |
| --- | --- |
| `runtime` | |
| `parameters` | |
| `executor.receipt` | |
| `attester` | |
| `verified`·`stale_after` | |

환불 예정일을 Attested Computation으로 둘 가치가 있나:

-

