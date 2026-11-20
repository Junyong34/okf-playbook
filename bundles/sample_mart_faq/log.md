# 번들 변경 이력

## 2026-11-20

* 원문끼리 숫자가 다른 FAQ를 한쪽 값으로 통일했다(사용자 결정). 판매자 택배 기간은 [faq-221](faqs/purchase/faq-221.md)의 4~7일로([faq-247](faqs/purchase/faq-247.md), [faq-216](faqs/purchase/faq-216.md)), 지연배송 시 기사 연락 시각은 [faq-187](faqs/purchase/faq-187.md)의 20시로([benefit/faq-004](faqs/benefit/faq-004.md)), 부분취소 카드사 확인은 [claim/faq-182](faqs/claim/faq-182.md)의 3~5일로([claim/faq-192](faqs/claim/faq-192.md)) 맞췄다. 고친 FAQ에는 원본 JSON 값과 바꾼 이유를 적고 `generated`를 갱신했다. 원본 JSON 사본은 바꾸지 않았다.
* (나머지 카테고리) 주제 문서 19개를 [주제](topics/index.md)에 추가하고 남은 FAQ 175개를 이었다. 배송 시간과 받기·결제수단·상품권 결제 주제에도 FAQ 4개를 더했다. 이제 FAQ 258개 모두가 주제 문서 하나에 속한다.
* 같은 질문이 두 카테고리에 있는 FAQ(예: 부분취소란, 쿠폰 사용 시 환불금액)는 서로 링크했다. 
* (배송·결제수단) 주제 문서 8개(배송 종류와 배송비, 배송 지역과 배송 매장, 배송 시간과 받기, 주문 후 변경, 배송 조회와 배송 문제, 결제수단, 샘플페이, 상품권 결제)를 [주제](topics/index.md)에 추가하고 FAQ 71개(주문/결제/배송 70개, 취소/교환/반품 1개)를 출처와 본문 링크로 이었다.
* 그 FAQ 71개에 `## 관련 문서` 절을 붙이고 `tags`·`description`을 보강했다. 답변 본문은 바꾸지 않아 `generated`는 그대로 두었다.
* (영수증 파일럿) [영수증 안내](topics/receipts.md) 주제 문서를 추가하고 영수증 관련 FAQ 12개를 출처(`sources`)와 본문 링크로 이었다.
* 그 FAQ 12개에 `## 관련 문서` 절(주제 문서와 형제 FAQ 링크)을 붙이고, `tags`에 주제어를, `description`에 고객이 쓸 법한 표현을 넣었다. 답변 본문은 바꾸지 않아 `generated`는 그대로 두었다.
* 테스트용 원본 JSON의 카테고리 7개와 질문 258개를 [FAQ](faqs/index.md)로 변환했다.
* [원본 JSON 사본](references/sample-faq.json)을 추가하고 FAQ마다 해당 배열 항목을 각주에 기록했다.
