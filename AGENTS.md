# AGENTS.md

OKF(Open Knowledge Format) v0.2를 학습하고, 반품·환불 지식 번들로 근거를 붙인 질의응답을 실습하는 저장소.

## 디렉터리 구조

```
okf-playbook/
├── AGENTS.md                  # 에이전트용 안내 (이 파일)
├── CLAUDE.md                  # AGENTS.md를 불러옴
├── README.md                  # 저장소 소개
├── GLOSSARY.md                # 용어집 (개념·메타 필드·인용 등 정한 말과 피할 말)
├── docs/                      # 학습 계획과 기록
│   ├── README.md
│   ├── agents/                # 에이전트 스킬 설정 (이슈 트래커, 라벨, 도메인 문서 규칙)
│   ├── okf-learning-plan.md   # 전체 학습·실습 계획 (기준 문서)
│   ├── team-rules.md          # OKF 명세 위에 정한 팀 규칙 (validate.ts가 team/* 경고로 검사)
│   └── sessions/              # 회차별 학습 노트
├── learn/                     # /teach 학습 공간 (절차: learn/README.md)
│   ├── MISSION.md · RESOURCES.md · NOTES.md
│   ├── lessons/               # 레슨 HTML (0001-*.html)
│   ├── reference/             # 요약본·용어집 HTML
│   ├── assets/                # 공용 CSS·퀴즈·OKF 검사기·경로 연습·bigram 실습
│   └── learning-records/      # 익힌 것 기록 (0001-*.md)
├── .scratch/                  # 로컬 Markdown 이슈·스펙 (필요할 때 생성)
├── source/                    # OKF로 변환하기 전 데이터
│   └── sample-faq.json       # FAQ 테스트 샘플
├── knowledge/                 # OKF 번들 루트
│   ├── index.md               # okf_version: "0.2" 선언, 목차
│   ├── references/
│   │   └── returns-faq.md     # 원문 개념 (type: Reference), returns.md의 출처
│   ├── policies/
│   │   ├── returns.md
│   │   └── return-exceptions.md
│   └── processes/
│       └── refunds.md
├── src/okf/                   # 검증·검색 로직 (파일 시스템과 분리, 웹 UI에서 재사용)
│   ├── types.ts               # Bundle = Map<경로, 내용>, Issue
│   ├── load.ts                # 디렉터리 → Bundle
│   ├── concept.ts             # 개념 읽기: 파일을 한 번 나누고 파싱 (frontmatter 상태, 링크, Concept). 다른 모듈은 이 결과를 읽는다
│   ├── args.ts                # CLI 인자 → 검색 설정 검증 (retrieve·prompt·check-answer·compare 공용)
│   ├── ask.ts                 # 질의응답: 검색 → 신뢰·주의 판정 → 프롬프트 (CLI·웹 UI 공용)
│   ├── validate.ts            # Bundle → Issue[] (3회차 실습)
│   ├── retrieve.ts            # Bundle + 질문 → 고른 개념과 이유 (4회차 실습)
│   ├── answer.ts              # 프롬프트 만들기, 답변 인용 검사 (5회차 실습)
│   ├── compare.ts             # 검색 설정 비교, 판정과 표 (6회차 실습)
│   ├── provenance.ts          # sources·각주 검사, 출처 따라가기 (7회차 실습)
│   ├── trust.ts               # verified 신뢰 등급, status·stale_after 주의 (8회차 실습)
│   └── graph.ts               # 링크·출처 그래프, 역링크, Mermaid (9회차 실습)
├── tests/                     # node:test (pnpm test)
├── validate.ts                # 번들 검증 CLI (pnpm validate [dir])
├── retrieve.ts                # 질문별 개념 검색 CLI, 고른 개념마다 신뢰·주의 표시 (pnpm retrieve "질문" [--fields --no-links --max --min --now])
├── prompt.ts                  # 모델에 붙여 넣을 프롬프트 출력 (pnpm prompt "질문")
├── check-answer.ts            # 저장한 답변의 인용 검사 (pnpm check-answer "질문" answers/qN.txt [--prompt answers/qN.prompt.txt])
├── compare.ts                 # 질문 목록 × 세 설정 비교표 출력 (pnpm compare [--max --min])
├── trace.ts                   # 개념의 출처를 원문까지 따라가기 (pnpm trace policies/returns.md)
├── graph.ts                   # 번들 그래프 출력 (pnpm graph [--mermaid])
├── answers/                   # 질문별 모델 답변 (q1.txt ~ q6.txt)
├── evaluation.md              # 질문별 검색·답변 평가표 (4~9회차에 채움)
├── package.json · tsconfig.json  # Node 22.18+ TS 직접 실행, yaml 패키지
│
│  # 아래는 실습하면서 만들 예정 (docs/okf-learning-plan.md §4)
├── source/returns-faq.md      # 실습용 원본 FAQ (선택)
└── (5회차 이후) 답변 생성, 웹 UI
```

디렉터리를 추가하거나 옮기면 이 구조도를 함께 갱신한다.

## 실습 코드 주의

`src/okf/` 실습 함수(0003 `validate.ts`, 0004 `retrieve.ts`, 0005 `answer.ts`)는 사용자 요청으로 구현을 마쳤다(2026-11-18). 0006 `compare.ts`의 `judge`·`compare`도 사용자 요청으로 채웠다. 0007 `provenance.ts`의 `checkAttribution`·`trace`와 `knowledge/references/returns-faq.md`·`returns.md` 출처도 사용자 요청으로 채웠다. 0008 `trust.ts`의 `normalizeVerified`·`trustTier`·`assess`도 사용자 요청으로 채웠다. 0009 `graph.ts`의 `buildGraph`·`backlinks`도 사용자 요청으로 채웠다(2026-11-19). 공식 저장소(뷰어)는 이 저장소 밖(`/tmp/okf-official` 등)에 받는다. `verified`의 `human:` 기록은 사용자가 직접 대조한 뒤 사용자가 적는다. 에이전트가 대신 `human:`을 적지 않는다. 새 레슨에서 TODO 실습을 만들면 사용자가 요청하기 전에는 채우지 않는다. 사용자가 요청하지 않으면 채우지 않는다. 테스트 실패가 `Error: TODO …`라면 버그가 아니라 남은 실습이다. 모범 답안은 각 레슨 HTML 안에 접혀 있다.

## Agent skills

### Issue tracker

이슈와 스펙은 `.scratch/<feature-slug>/` 아래 로컬 Markdown 파일로 관리한다. See `docs/agents/issue-tracker.md`.

### Triage labels

기본 라벨 5개(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)를 그대로 쓴다. See `docs/agents/triage-labels.md`.

### Domain docs

single-context: 루트 `GLOSSARY.md`와 `docs/adr/`. See `docs/agents/domain.md`.
