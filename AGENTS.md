# AGENTS.md

OKF(Open Knowledge Format) v0.3을 학습하고, 반품·환불 지식 번들로 근거를 붙인 질의응답을 실습하는 저장소.

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
│   ├── okf-modules.md         # src/okf 모듈별 역할과 CLI별 흐름 (구조를 바꾸면 함께 갱신)
│   ├── okf-v0.3-changes.md    # v0.2 → v0.3 변경 안내 (깨지는 변경, 절 번호 대응, 이 저장소의 결정)
│   ├── okf-skills-comparison.md # 공식·외부 OKF 스킬 비교
│   ├── team-rules.md          # OKF 명세 위에 정한 팀 규칙 (validate.ts가 team/* 경고로 검사)
│   └── sessions/              # 회차별 학습 노트
├── learn/                     # /teach 학습 공간 (절차: learn/README.md)
│   ├── MISSION.md · RESOURCES.md · NOTES.md
│   ├── lessons/               # 레슨 HTML (0001-*.html)
│   ├── reference/             # 요약본·용어집 HTML
│   ├── assets/                # 공용 CSS·퀴즈·OKF 검사기·경로 연습·bigram 실습
│   └── learning-records/      # 익힌 것 기록 (0001-*.md)
├── .agents/skills/            # Codex용 공식 OKF 스킬 (okf-generate·okf-consume, 손대지 않음)
├── .claude/skills/            # Claude Code용 같은 스킬 사본 (출처 커밋은 sync 스크립트의 COMMIT)
├── scripts/
│   └── sync-okf-skills.sh     # 공식 스킬을 고정 커밋에서 받아 위 두 위치에 복사 (pnpm okf:sync-skills [커밋])
├── .scratch/                  # 로컬 Markdown 이슈·스펙 (필요할 때 생성)
│   ├── okf-v0.3-migration/    # v0.3 마이그레이션 스펙 (spec.md: 결정 사항과 하지 않을 일)
│   └── okf-web-ui/            # 웹 화면(상담·디버깅·그래프) 스펙
├── source/                    # OKF로 변환하기 전 데이터
│   └── sample-faq.json       # FAQ 테스트 샘플
├── sample_mart_faq/           # 테스트용 FAQ의 OKF v0.3 번들
│   ├── index.md · log.md      # 번들 목차와 변경 기록
│   ├── faqs/                  # 카테고리별 목차와 질문별 Markdown
│   └── references/            # 원본 JSON 사본과 자료 목차
├── knowledge/                 # OKF 번들 루트
│   ├── index.md               # 번들 메타데이터(okf_version: "0.3", title, description), 목차
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
│   ├── validate.ts            # Bundle → Issue[] (3회차 실습, 공식 검증기 규칙 이식. 검증 기준)
│   ├── retrieve.ts            # Bundle + 질문 → 고른 개념과 이유 (4회차 실습)
│   ├── answer.ts              # 프롬프트 만들기, 답변 인용 검사 (5회차 실습)
│   ├── request.ts             # 웹 화면의 모델 요청 조립: system(지시문+말투 설정)·user(날짜+문서+질문)와 요청 조립 기록
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
├── .env.example               # 웹 화면용 VITE_ANTHROPIC_API_KEY 예시 (.env로 복사, 로컬 시연 전용)
├── web/                       # 웹 화면 (Vite 7 + React 19 + Astryx + StyleX, pnpm dev / pnpm build:web)
│   ├── vite.config.ts · tsconfig.json · index.html
│   └── src/
│       ├── app/               # 앱 틀: 테마·라우터·좌측 메뉴(AppShell + SideNav)
│       ├── config/            # 번들 목록(bundles.ts)·모델·라우트 설정
│       ├── lib/               # 서버로 옮길 경계: bundles/loadBundles.ts, claude/generate.ts
│       ├── features/          # 화면별 기능: bundles·qa(공용 처리)·chat(상담)·debug(디버깅)·graph(준비 중)
│       ├── shared/            # 화면 공용 UI·유틸
│       └── styles/            # 전역 CSS (Astryx 레이어 순서)
│
│  # 아래는 실습하면서 만들 예정 (docs/okf-learning-plan.md §4)
├── source/returns-faq.md      # 실습용 원본 FAQ (선택)
└── (다음) 그래프 화면(sigma.js), 배포용 서버
```

디렉터리를 추가하거나 옮기면 이 구조도를 함께 갱신한다.

## 실습 코드 주의

`src/okf/` 실습 함수(0003 `validate.ts`, 0004 `retrieve.ts`, 0005 `answer.ts`)는 사용자 요청으로 구현을 마쳤다(2026-11-18). 0006 `compare.ts`의 `judge`·`compare`도 사용자 요청으로 채웠다. 0007 `provenance.ts`의 `checkAttribution`·`trace`와 `knowledge/references/returns-faq.md`·`returns.md` 출처도 사용자 요청으로 채웠다. 0008 `trust.ts`의 `normalizeVerified`·`trustTier`·`assess`도 사용자 요청으로 채웠다. 0009 `graph.ts`의 `buildGraph`·`backlinks`도 사용자 요청으로 채웠다(2026-11-19). 2026-11-19 사용자 요청으로 v0.3 마이그레이션(코드·실습·learn)을 에이전트가 진행했다. 공식 저장소는 `open-knowledge-format/open-knowledge-format`(v0.3, 뷰어·공식 스킬 포함)이고 옛 `GoogleCloudPlatform/open-knowledge-format`(v0.2)은 deprecated다. 받을 때는 이 저장소 밖(`/tmp/okf-official` 등)에 받는다. `verified`의 `human:` 기록은 사용자가 직접 대조한 뒤 사용자가 적는다. 에이전트가 대신 `human:`을 적지 않는다. 새 레슨에서 TODO 실습을 만들면 사용자가 요청하기 전에는 채우지 않는다. 사용자가 요청하지 않으면 채우지 않는다. 테스트 실패가 `Error: TODO …`라면 버그가 아니라 남은 실습이다. 모범 답안은 각 레슨 HTML 안에 접혀 있다.

## Agent skills

### 공식 OKF 스킬

`okf-generate`(번들 작성·수정·이전·검증)와 `okf-consume`(번들에서 답하기, 읽기 전용)는 공식 저장소 `open-knowledge-format/open-knowledge-format`의 스킬을 그대로 넣은 것이다. Codex는 `.agents/skills/`, Claude Code는 `.claude/skills/`에서 읽는다. 두 사본은 같아야 하므로 직접 고치지 않고 `pnpm okf:sync-skills [커밋]`으로만 갱신한다. 이 저장소에 맞춘 규칙은 스킬 파일이 아니라 이 문서와 `docs/team-rules.md`에 둔다.

**검증은 TS 검증기(`pnpm validate`)가 기준이다.** `okf-generate` 8단계의 `python3 scripts/validate.py <bundle-root>`는 이 저장소에서 `pnpm validate <bundle-root>`로 바꿔 실행한다. 공식 검증기 규칙은 `src/okf/validate.ts`로 옮겨 두었고(규칙 이름과 공식 코드 W103 등의 대응은 `src/okf/types.ts`의 `Rule` 주석), Attested Computation 규칙(§10)만 아직 없다. 새 검증 규칙은 Python이 아니라 `validate.ts`와 `tests/validate.test.ts`에 추가한다. 공식 검증기는 판정을 대조할 때만 쓴다: `pnpm okf:validate knowledge`(Python과 PyYAML이 필요하고 `uv`가 PyYAML을 임시로 받는다). 두 결과가 다르면 명세를 읽고 어느 쪽이 맞는지 확인한 뒤 TS를 고친다. `okf-consume`의 `scripts/scan.py`는 `pnpm okf:scan knowledge [--current --stale --deprecated --unverified --grep 텍스트]`로 돌린다. `okf-generate`의 `verified` 규칙(이번 실행에서 만든 내용에 검토 기록 금지, `human:` id는 본인이 알려 줄 때만)은 이 문서의 `human:` 규칙과 같은 뜻이다.

### Issue tracker

이슈와 스펙은 `.scratch/<feature-slug>/` 아래 로컬 Markdown 파일로 관리한다. See `docs/agents/issue-tracker.md`.

### Triage labels

기본 라벨 5개(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)를 그대로 쓴다. See `docs/agents/triage-labels.md`.

### Domain docs

single-context: 루트 `GLOSSARY.md`와 `docs/adr/`. See `docs/agents/domain.md`.
