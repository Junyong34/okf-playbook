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
