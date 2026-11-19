# OKF 학습 절차

[`docs/okf-learning-plan.md`](../docs/okf-learning-plan.md)의 6회차 계획을 `/teach` 방식으로 진행하는 절차다. 목적은 [MISSION.md](MISSION.md)에 있다.

## 구성

| 경로 | 내용 |
| --- | --- |
| `MISSION.md` | 왜 배우는지, 완료 기준, 범위 밖 |
| `RESOURCES.md` | 믿을 수 있는 자료와 커뮤니티 |
| `lessons/` | 레슨 HTML. 한 번에 하나씩 만든다 |
| `reference/` | 다시 볼 요약본. 출력해서 써도 된다 |
| `assets/` | 레슨 공용 스타일·퀴즈·OKF 검사기 |
| `learning-records/` | 실제로 익힌 것과 바로잡은 오해 (첫 기록이 생길 때 만든다) |
| `NOTES.md` | 진행 방식 선호와 작업 메모 |

실습 산출물(`bundles/knowledge/`, `source/`, `validate.ts`, `retrieve.ts`, `evaluation.md`)은 저장소 루트에 둔다.

## 한 회차 진행 순서 (90분)

1. 회상 (5분): 지난 레슨 끝의 "다음 회차 시작 질문"에 노트 없이 답한다. 막힌 질문은 그 레슨을 다시 본다.
2. 레슨 받기: 에이전트에게 `/teach`로 다음 레슨을 요청한다. 에이전트는 `learning-records/`를 보고 다음 단계를 정해 `lessons/`에 만들고 연다.
3. 읽기 (15~20분): 레슨 본문과 1차 자료. 모든 주장에 명세 링크가 붙어 있다.
4. 퀴즈: 스크롤하지 않고 답한다. 즉시 정답과 근거가 나온다.
5. 실습 (50분): 레슨 안 검사기나 저장소 실습 파일로 직접 만든다. 결과는 루트 실습 파일에 저장한다.
6. 검토 (20분): 막힌 점을 에이전트에게 묻는다. 에이전트는 실제로 익힌 것을 `learning-records/`에 기록하고 필요하면 `reference/`를 갱신한다.

복습 간격: 레슨 다음 날, 3일 뒤, 7일 뒤에 `reference/`만 보고 시작 질문을 다시 푼다.

## 레슨 로드맵

진행 상황에 따라 순서와 범위가 바뀔 수 있다. 레슨은 앞 레슨을 끝낸 뒤 하나씩 만든다.

| 회차 | 레슨 | 손에 남는 것 | 상태 |
| --- | --- | --- | --- |
| 1 | [0001 개념 문서 한 장](lessons/0001-concept-document.html) | 검사기를 통과한 `policies/returns.md` | 완료 (`bundles/knowledge/policies/returns.md` 저장) |
| 2 | [0002 첫 번들 완성](lessons/0002-first-bundle.html) | 개념 3개 + 루트 `index.md`, 링크 형식 팀 규칙 | 완료 (상대 경로 규칙 → `docs/team-rules.md`) |
| 3 | [0003 검증기](lessons/0003-validate.html) | `src/okf/validate.ts` 구현, 테스트 통과 (v0.3 기준, 공식 검증기 규칙 이식 뒤 `tests/validate.test.ts` 54개) | 완료 (에이전트 구현, 2026-11-18) |
| 4 | [0004 질문별 문서 찾기](lessons/0004-retrieve.html) | `src/okf/retrieve.ts` 구현, `evaluation.md` 4회차 표 | 완료 (에이전트 구현, 2026-11-18) |
| 5 | [0005 근거를 붙인 답변](lessons/0005-grounded-answer.html) | `src/okf/answer.ts` 구현, 답변 저장·검사, `evaluation.md` 5회차 표 | 코드 완료 (에이전트 구현). 모델 답변 저장·검사는 남음 |
| 6 | [0006 검색 설정 비교](lessons/0006-compare-settings.html) | `src/okf/compare.ts` 구현, `pnpm compare` 결과표, `evaluation.md` 6회차 | 코드 완료 (에이전트 구현, 2026-11-18). 예측·결론 메모는 남음 |
| 심화 1 | [0007 원문으로 거슬러 올라가기](lessons/0007-sources-footnotes.html) | `src/okf/provenance.ts` 구현, `references/returns-faq.md`, `sources`·각주, `pnpm trace`, `evaluation.md` 7회차. 선택 레슨이던 FAQ 실습을 여기에 합쳤다 | 완료 (에이전트 구현, 2026-11-18). 팀 규칙 결정은 사용자 확인 필요 |
| 심화 2 | [0008 검토 상태와 낡은 개념](lessons/0008-trust-lifecycle.html) | `src/okf/trust.ts` 구현, 직접 대조한 개념에 `verified`, 낡은 사본에서 `pnpm retrieve --now` 주의 표시, `evaluation.md` 8회차 소비자 정책 (계획 §6-2, v0.3 명세 §5.2~§5.5·§7) | 코드 완료 (에이전트 구현, 2026-11-18). 사용자가 `returns.md`에 `verified`(`human:`)를 적었다. 소비자 정책 메모는 남음. T4단계 1개는 진짜 번들의 `status: deprecated` 때문에 실패 |
| 심화 3 | [0009 같은 번들을 다른 방식으로 읽기](lessons/0009-read-bundle-differently.html) | `src/okf/graph.ts` 구현, `pnpm graph [--mermaid]`, 공식 뷰어와 비교, `evaluation.md` 9회차, §10 계산 검증 예제 읽기 (계획 §6-3, v0.3 명세 §6.4·§10) | 코드 완료 (에이전트 구현, 2026-11-19). 공식 뷰어 비교·사본 실험·§10 표는 남음 |

2026-11-19에 OKF v0.3 기준으로 코드·실습·레슨을 갱신했다. 0001~0009의 설명·퀴즈·모범 답안이 v0.3 명세와 지금 `src/okf` 코드를 따른다. 갱신 뒤 `pnpm test`는 174개 중 173개 통과다(남은 1개는 위 T4단계). v0.2에서 바뀐 점은 [docs/okf-v0.3-changes.md](../docs/okf-v0.3-changes.md)에 있다. `learning-records/`의 기존 기록은 v0.2 기준으로 남긴다.

기본 과정은 0006(6회차)까지이고, 심화까지 포함하면 0009가 마지막 레슨이다. 그 뒤의 웹 화면(Vite + React + TS + Claude SDK)은 사용자가 요청할 때 별도로 시작한다.

## 참고 문서

- [OKF v0.3 핵심 규칙과 용어집](reference/okf-v0.3-core.html)
- [OKF v0.3에서 바뀐 것](../docs/okf-v0.3-changes.md)
