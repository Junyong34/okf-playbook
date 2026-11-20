#!/usr/bin/env bash
# 공식 OKF 스킬(okf-generate, okf-consume)을 고정 커밋에서 받아 저장소에 복사한다.
#   Codex:       .agents/skills/<name>/
#   Claude Code: .claude/skills/<name>/
# 두 위치는 같은 내용이다. 스킬 파일은 직접 고치지 않고 이 스크립트로만 갱신한다.
#
# 사용법: scripts/sync-okf-skills.sh [커밋]   (기본값: 아래 COMMIT)
set -euo pipefail

REPO_URL="https://github.com/open-knowledge-format/open-knowledge-format.git"
COMMIT="${1:-527e81aff55992be21507e97004286789126f88c}"
SKILLS=(okf-generate okf-consume)
TARGETS=(.agents/skills .claude/skills)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git -C "$TMP" init -q
git -C "$TMP" remote add origin "$REPO_URL"
git -C "$TMP" fetch -q --depth 1 origin "$COMMIT"
git -C "$TMP" checkout -q FETCH_HEAD

for target in "${TARGETS[@]}"; do
  mkdir -p "$ROOT/$target"
  for skill in "${SKILLS[@]}"; do
    rm -rf "${ROOT:?}/$target/$skill"
    cp -R "$TMP/skills/$skill" "$ROOT/$target/$skill"
    cp "$TMP/LICENSE.md" "$ROOT/$target/$skill/LICENSE.md"
    find "$ROOT/$target/$skill" \( -name '__pycache__' -o -name '*.pyc' \) -prune -exec rm -rf {} +
  done
done

echo "동기화 완료: ${SKILLS[*]} @ ${COMMIT:0:7} → ${TARGETS[*]}"
