# AGENTS.md

OKF(Open Knowledge Format) v0.2를 학습하고, 반품·환불 지식 번들로 근거를 붙인 질의응답을 실습하는 저장소.

## 디렉터리 구조

```
okf-playbook/
├── AGENTS.md                  # 에이전트용 안내 (이 파일)
├── CLAUDE.md                  # AGENTS.md를 불러옴
├── README.md                  # 저장소 소개
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
├── knowledge/                 # OKF 번들 루트
│   ├── index.md               # okf_version: "0.2" 선언, 목차
│   ├── policies/
│   │   ├── returns.md
│   │   └── return-exceptions.md
│   └── processes/
│       └── refunds.md
├── src/okf/                   # 검증·검색 로직 (파일 시스템과 분리, 웹 UI에서 재사용)
│   ├── types.ts               # Bundle = Map<경로, 내용>, Issue
│   ├── load.ts                # 디렉터리 → Bundle
│   ├── validate.ts            # Bundle → Issue[] (3회차 실습)
│   ├── retrieve.ts            # Bundle + 질문 → 고른 개념과 이유 (4회차 실습)
│   └── answer.ts              # 프롬프트 만들기, 답변 인용 검사 (5회차 실습)
├── tests/                     # node:test (pnpm test)
├── validate.ts                # 번들 검증 CLI (pnpm validate [dir])
├── retrieve.ts                # 질문별 개념 검색 CLI (pnpm retrieve "질문" [--fields --no-links --max --min])
├── prompt.ts                  # 모델에 붙여 넣을 프롬프트 출력 (pnpm prompt "질문")
├── check-answer.ts            # 저장한 답변의 인용 검사 (pnpm check-answer "질문" answers/qN.txt)
├── answers/                   # 질문별 모델 답변 (q1.txt ~ q6.txt)
├── evaluation.md              # 질문 6개의 검색·답변 평가표 (4~6회차에 채움)
├── package.json · tsconfig.json  # Node 22.18+ TS 직접 실행, yaml 패키지
│
│  # 아래는 실습하면서 만들 예정 (docs/okf-learning-plan.md §4)
├── source/
│   └── returns-faq.md         # 실습용 원본 FAQ (선택)
└── (5회차 이후) 답변 생성, 웹 UI
```

디렉터리를 추가하거나 옮기면 이 구조도를 함께 갱신한다.

## 실습 코드 주의

`src/okf/` 실습 함수(0003 `validate.ts`, 0004 `retrieve.ts`, 0005 `answer.ts`)는 사용자 요청으로 구현을 마쳤다(2026-11-18). 새 레슨에서 TODO 실습을 만들면 사용자가 요청하기 전에는 채우지 않는다. 사용자가 요청하지 않으면 채우지 않는다. 테스트 실패가 `Error: TODO …`라면 버그가 아니라 남은 실습이다. 모범 답안은 각 레슨 HTML 안에 접혀 있다.

## Agent skills

### Issue tracker

이슈와 스펙은 `.scratch/<feature-slug>/` 아래 로컬 Markdown 파일로 관리한다. See `docs/agents/issue-tracker.md`.

### Triage labels

기본 라벨 5개(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)를 그대로 쓴다. See `docs/agents/triage-labels.md`.

### Domain docs

single-context: 루트 `GLOSSARY.md`와 `docs/adr/`. See `docs/agents/domain.md`.
