# Mission: OKF로 근거를 붙이는 RAG·에이전트 만들기

## Why
OKF 번들(v0.3)을 지식 원천으로 삼아, 질문에 맞는 문서를 고르고 파일 경로를 근거로 붙여 답하는 RAG 파이프라인을 직접 구현한다. 최종적으로 Vite + React + TypeScript 웹 화면에서 Claude SDK로 같은 흐름을 돌려 본다.

## Success looks like
- 명세만 보고 적합한(conformant) 개념 문서와 루트 `index.md`를 손으로 쓴다.
- `validate.ts`가 잘못된 YAML은 오류로, `type`이 없어 개념이 아닌 파일과 끊어진 링크는 경고로 보고한다 (v0.3 §3.2·§11.1).
- `retrieve.ts`가 질문마다 처음 고른 문서, 링크로 추가한 문서, 선택 이유를 출력한다.
- 모델 답변의 정책 주장마다 근거 파일 경로가 붙고, 번들 밖 질문에는 "확인할 수 없음"으로 답한다.
- 본문만 / +분류 / +링크 확장 세 가지 검색 설정을 같은 질문 세트로 비교한 결과표를 남긴다.

## Constraints
- 2주, 90분 × 6회 (읽기 20 · 실습 50 · 검토 20).
- 소재는 가상 쇼핑몰의 반품·환불 문서 3개.
- 기준은 `open-knowledge-format/open-knowledge-format` 저장소의 OKF 명세 v0.3(커밋 `527e81a`). 2026-11-19에 v0.2에서 옮겼다. 처음 기준이던 `GoogleCloudPlatform/open-knowledge-format`(v0.2)은 2026-11-18에 deprecated됐다. 바뀐 점은 `../docs/okf-v0.3-changes.md`. v0.1 자료는 대응 관계만 확인한다.

## Out of scope
- Attested Computation 실행·판정(§10). 기본 실습 뒤 심화로 미룬다.
- 임베딩·벡터 검색. 이번에는 키워드 매칭과 링크 따라가기만 쓴다.
- 웹 UI 구현. 6회차까지 끝낸 뒤 별도로 진행한다.
