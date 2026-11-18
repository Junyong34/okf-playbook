# OKF Resources

## Knowledge

- [Spec: OKF v0.2 (GoogleCloudPlatform)](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md)
  유일한 규범 문서. Use for: 필수·권장 필드, 예약 파일, 링크 규칙, 적합성(§11). 레슨의 모든 규칙 주장은 여기로 인용한다.
- [Repo: open-knowledge-format](https://github.com/GoogleCloudPlatform/open-knowledge-format)
  공식 구현 README, 생성 에이전트, HTML 시각화 도구. Use for: 생산자·소비자 도구 예시(6회차 이후).
- [Bundle: Acme Retail](https://github.com/GoogleCloudPlatform/open-knowledge-format/tree/main/bundles/acme_retail)
  공식 예제 번들. Use for: 루트 인덱스·하위 디렉터리 구성, `tables/orders.md`의 `sources`·각주 대조.
- [Blog: How the Open Knowledge Format can improve data sharing (Google Cloud)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
  최초 발표. Use for: 등장 배경. 필드 문법은 명세로 확인한다.
- [Blog: OKF v0.2 adds trust signals (Google Cloud)](https://cloud.google.com/blog/products/data-analytics/okf-v0-2-adds-trust-signals)
  v0.2 변경 사례. Use for: `sources`·`verified`·`stale_after` 학습 전 동기 부여.
- [Paper: Retrieval-Augmented Generation (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)
  RAG 원 논문. Use for: 검색 단계와 생성 단계를 나누는 개념.
- [Video: Prism Labs 입문 영상](https://www.youtube.com/watch?v=14C0E6pwBIQ)
  v0.1 기준 7분 개관(2:19부터). Use for: 1회차 전 빠른 그림. 필드는 v0.2로 바꿔 읽는다.
- [Article: Marie Haynes, Build an OKF brain like mine](https://www.mariehaynes.com/build-an-okf-brain-like-mine/)
  개인 지식 베이스 적용기. Use for: 2회차 뒤 폴더 분류 아이디어.
- [Video + code: AaiTech SQL 에이전트](https://www.youtube.com/watch?v=cfr5Ke7JBqo) · [code](https://github.com/Sandesh-hase/aai-food-okf)
  OKF 문서를 SQL 에이전트에 붙인 사례. Use for: 5~6회차 뒤 확장 방향.

- [Docs: Elasticsearch CJK bigram token filter](https://www.elastic.co/docs/reference/text-analysis/analysis-cjk-bigram-tokenfilter)
  한·중·일 텍스트를 두 글자 묶음으로 자르는 표준 분석기. Use for: 레슨 0004 한국어 키워드 매칭의 근거.

## Wisdom (Communities)

- [GitHub Issues: open-knowledge-format](https://github.com/GoogleCloudPlatform/open-knowledge-format/issues)
  명세 관리자와 사용자가 해석 문제를 논의하는 곳. Use for: 명세가 모호할 때 기존 논의 검색, 질문 등록.

## Gaps

- Anthropic 공식 프롬프트 가이드와 Citations 문서(`platform.claude.com`)가 회사 네트워크에서 차단된다. 레슨 0005의 프롬프트 형식은 이 과정의 설계로 표시했고, Citations 설명은 Claude API 스킬 문서에서 확인한 내용만 썼다. 개인 환경에서 원문을 확인해 이 항목을 채운다.

- 한국어로 된 v0.2 해설 자료가 없다. 레슨과 `reference/`가 그 역할을 한다.
- OKF 전용 커뮤니티(포럼·디스코드)는 아직 확인하지 못했다.
