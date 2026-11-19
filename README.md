# okf-playbook
Learn Open Knowledge Format (OKF) by building a knowledge bundle and answering questions with cited sources.

## Docs

학습·실습 계획과 회차별 노트는 [docs/](docs/README.md)에서 관리한다.

## 웹 화면 로컬 실행

저장소 루트에서 `pnpm install`로 웹과 서버 의존성을 설치한 뒤 [.env.example](.env.example)을 저장소 루트의 `.env`로 복사하고 `ANTHROPIC_API_KEY`를 설정한다. 기존 `.env`에 `VITE_ANTHROPIC_API_KEY`가 있다면 변수 이름을 바꾼다.

웹과 서버의 전용 의존성은 각각 `web/package.json`과 `server/package.json`에서 관리한다.

각각 다른 터미널에서 `pnpm dev:api`와 `pnpm dev`를 실행하고 Vite가 출력한 로컬 주소를 연다. Vite는 `/api` 요청을 `127.0.0.1:3001`의 Express로 전달한다. OKF 검색과 프롬프트 조립은 브라우저에서 실행한다. 키 없이 실행하면 디버깅 화면에서 프롬프트 조립을 확인할 수 있다.

`web/` 또는 `server/`에서 직접 실행할 때도 `pnpm dev`를 사용한다.
