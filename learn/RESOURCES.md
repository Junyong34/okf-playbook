# OKF Resources

## Knowledge

- [Spec: OKF v0.3 (open-knowledge-format, 커밋 527e81a)](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/SPEC.md)
  유일한 규범 문서. Use for: 필수·권장 필드, 예약 파일, 개념 판별(§3.2), 링크·경로 필드 해석(§6), 신뢰 등급(§5.3), 적합성·소비자 규칙(§11). 레슨의 모든 규칙 주장은 이 고정 커밋으로 인용한다. 최신판은 [main의 SPEC.md](https://github.com/open-knowledge-format/open-knowledge-format/blob/main/SPEC.md).
- [Notes: OKF v0.3에서 바뀐 것](../docs/okf-v0.3-changes.md)
  이 저장소가 정리한 v0.2 → v0.3 변경 안내. Use for: 깨지는 변경 2개, 절 번호 대응표, 이 저장소 코드에 적용한 결정. v0.2로 쓴 노트·learning record를 읽을 때 함께 본다.
- [Repo: open-knowledge-format](https://github.com/open-knowledge-format/open-knowledge-format)
  v0.3 공식 저장소. README, 생성 에이전트, HTML 시각화 도구, 예제 번들. Use for: 생산자·소비자 도구 예시(6회차 이후), 0009 공식 뷰어 비교.
- [Skill: okf-generate](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-generate/SKILL.md) · [v0.2 → v0.3 이전 절차](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-generate/references/migration.md)
  공식 에이전트 스킬(쓰기 쪽). 번들 생성·갱신·이전·수리·검증과 검토 기록 남기기. 경로 필드는 `/`로, 본문 링크는 파일 기준으로 쓰게 한다. Use for: 생산자 규칙 확인, v0.2 번들 이전, `scripts/validate.py`와 우리 `validate.ts` 비교.
- [Skill: okf-consume](https://github.com/open-knowledge-format/open-knowledge-format/blob/527e81aff55992be21507e97004286789126f88c/skills/okf-consume/SKILL.md)
  공식 에이전트 스킬(읽기 쪽). 번들에서 답하고 쓴 개념마다 신뢰 등급·상태·최신성·인증 여부를 보고한다. 개념끼리 충돌하면 현재 개념, 높은 신뢰 등급, 낡지 않은 개념, 늦은 `generated.at` 순으로 고른다. Use for: 0008 소비자 정책, 웹 화면 설계.
- [Bundle: Acme Retail](https://github.com/open-knowledge-format/open-knowledge-format/tree/527e81aff55992be21507e97004286789126f88c/bundles/acme_retail)
  공식 예제 번들(v0.3). Use for: 루트 인덱스·번들 메타데이터, `tables/orders.md`의 `sources`·각주·`verified`, `metrics/gross-margin-legacy.md`의 `superseded_by`, §10 계산 개념.
- [Spec: OKF v0.2 (GoogleCloudPlatform, deprecated)](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/8a8ff87bfd3847c34c9ddd4fbfd9296be2aee4a3/SPEC.md)
  옛 저장소의 마지막 v0.2 명세. 2026-11-18에 deprecated로 표시됐고 더 갱신하지 않는다. Use for: v0.2 기준으로 남긴 learning record와 노트의 § 번호 확인. 규칙 인용에는 쓰지 않는다.
- [Blog: How the Open Knowledge Format can improve data sharing (Google Cloud)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
  최초 발표. Use for: 등장 배경. 필드 문법은 명세로 확인한다.
- [Blog: OKF v0.2 adds trust signals (Google Cloud)](https://cloud.google.com/blog/products/data-analytics/okf-v0-2-adds-trust-signals)
  v0.2 변경 사례. Use for: `sources`·`verified`·`stale_after` 학습 전 동기 부여. 규칙은 v0.3 명세로 확인한다(신뢰 등급 계산이 바뀌었다).
- [Paper: Retrieval-Augmented Generation (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)
  RAG 원 논문. Use for: 검색 단계와 생성 단계를 나누는 개념.
- [Video: Prism Labs 입문 영상](https://www.youtube.com/watch?v=14C0E6pwBIQ)
  v0.1 기준 7분 개관(2:19부터). Use for: 1회차 전 빠른 그림. 필드는 v0.3으로 바꿔 읽는다.
- [Article: Marie Haynes, Build an OKF brain like mine](https://www.mariehaynes.com/build-an-okf-brain-like-mine/)
  개인 지식 베이스 적용기. Use for: 2회차 뒤 폴더 분류 아이디어.
- [Video + code: AaiTech SQL 에이전트](https://www.youtube.com/watch?v=cfr5Ke7JBqo) · [code](https://github.com/Sandesh-hase/aai-food-okf)
  OKF 문서를 SQL 에이전트에 붙인 사례. Use for: 5~6회차 뒤 확장 방향.

- [Docs: Elasticsearch CJK bigram token filter](https://www.elastic.co/docs/reference/text-analysis/analysis-cjk-bigram-tokenfilter)
  한·중·일 텍스트를 두 글자 묶음으로 자르는 표준 분석기. Use for: 레슨 0004 한국어 키워드 매칭의 근거.

## Wisdom (Communities)

- [GitHub Issues: open-knowledge-format](https://github.com/open-knowledge-format/open-knowledge-format/issues)
  v0.3 저장소에서 명세 관리자와 사용자가 해석 문제를 논의하는 곳. Use for: 명세가 모호할 때 기존 논의 검색, 질문 등록, 공식 도구와 명세가 어긋날 때 알리기(예: 0009에서 본 뷰어의 `type` 없는 파일 처리). v0.2 시절 논의는 [옛 저장소 Issues](https://github.com/GoogleCloudPlatform/open-knowledge-format/issues)에 남아 있다.

## Gaps

- Anthropic 공식 프롬프트 가이드와 Citations 문서(`platform.claude.com`)가 회사 네트워크에서 차단된다. 레슨 0005의 프롬프트 형식은 이 과정의 설계로 표시했고, Citations 설명은 Claude API 스킬 문서에서 확인한 내용만 썼다. 개인 환경에서 원문을 확인해 이 항목을 채운다.

- 한국어로 된 v0.3 해설 자료가 없다. 레슨과 `reference/`가 그 역할을 한다.
- OKF 전용 커뮤니티(포럼·디스코드)는 아직 확인하지 못했다.
