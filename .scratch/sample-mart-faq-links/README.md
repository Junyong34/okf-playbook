# sample_mart_faq 문서 연결 (영수증 파일럿)

## 문제
FAQ 258개가 원본 JSON 한 줄마다 문서 하나로 펼쳐져 있고 문서 사이 링크가 0개였다. 검색이 키워드 한 번에 모든 것을 걸고 있었다.

## 파일럿 (2026-11-20)
- `topics/receipts.md`(type: Topic) 허브: 영수증 규칙 요지와 FAQ 12개 링크, FAQ마다 `sources` 항목.
- FAQ 12개: `## 관련 문서`(허브 + 형제 FAQ), `tags` 주제어, `description`에 고객 표현을 넣음. 답변 본문은 그대로.
- `apply-receipts.ts`: FAQ 수정 스크립트(한 번만 실행). `eval.ts`: 질문 8개 적중 비교.

## 결과
- 적중: 전 6/8 → 후 8/8. 허브가 8개 질문 모두에서 상위 3개 안에 들었다.
- 그래프 간선: 0 → 57 (링크 46, 출처 11).
- 링크 확장(`followLinks`)은 효과가 없었다. retrieve는 키워드 결과가 `maxDocs`를 채우면 링크 개념을 더하지 않는데, 큰 번들에서는 키워드 후보가 늘 3개를 넘는다. 개선은 tags·description 보강과 허브 본문에서 왔다.

## 배송·결제수단 (2026-11-20)
- 허브 8개(`delivery-types`·`delivery-areas`·`delivery-time`·`order-changes`·`delivery-tracking`·`payment-methods`·`sample-pay`·`gift-cards`), FAQ 71개(purchase 70, claim/159).
- 데이터는 `topics-delivery-payment.ts`, 생성은 `apply-topics.ts`(허브만 다시: `--hubs-only`). 질문은 `cases.ts`.
- FAQ 적중(상위 3개): 배송 3/10 → 9/10, 결제 3/6 → 3/6, 영수증 8/8 → 7/8(허브로는 도달).
- 허브가 길어지면 말끝 bigram(`어요`·`는데`·`나요`)으로 엉뚱한 질문에 걸렸다. 각주를 `원문 FAQ.`로 줄이고, 반복 문구와 질문체 예시를 빼서 줄였다.
- 남은 실패는 점수 방식 탓이다. `eval-idf.ts`(IDF 가중 실험)로는 결제 6/6, 배송 9/10, 영수증 7/8.

## 나머지 카테고리 (2026-11-20)
- 새 주제 문서 19개(`topics-rest.ts`), FAQ 175개. 기존 주제(배송 시간·결제수단·상품권)에 4개 추가. FAQ 258개 모두 주제 문서 하나에 속한다.
- `apply-topics.ts`는 두 데이터 파일을 합치고, 이미 적용된 FAQ는 건너뛰며, 본문이 같은 허브는 다시 쓰지 않는다(generated.at 유지).
- 평가 55문항(`cases.ts`), 작업 전 번들(`git archive HEAD`)과 비교: FAQ 적중 32 → 38, 근거 도달(FAQ 또는 그 요약이 있는 주제 문서) 32 → 45.
- 주제 문서가 상위 3자리를 차지해 FAQ가 밀리는 경우가 늘었다(선물세트·상품). IDF 실험은 이번엔 오히려 나빴다(주제 문서가 희귀 bigram을 많이 가져 더 위로 올라감).
- 원문끼리 다른 숫자 3곳(+faq-216)은 사용자 결정으로 FAQ A 값에 맞춰 통일했다(log.md 참고).

## 다음 후보
- 사용자가 주제 문서를 뺀 번들과 답변을 직접 비교한다.
- 주제 문서가 FAQ 자리를 뺏는 문제: retrieve에서 주제 문서와 FAQ 자리를 나누거나, 주제 문서를 고른 뒤 링크로 FAQ를 붙이는 방식 검토.
- retrieve 점수에 IDF 가중이나 불용 bigram 제외를 넣을지 결정(실습 코드라 사용자 결정).
- 링크 확장을 살리려면 retrieve에서 링크 개념 자리를 따로 두는 방안을 검토한다(실습 코드라 사용자 결정).
