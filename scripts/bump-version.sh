#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

backend_version="$(cd apps/backend && poetry version -s)"
frontend_version="$(node -p "JSON.parse(require('node:fs').readFileSync('apps/frontend/package.json', 'utf8')).version")"
printf 'Current versions: backend=%s, frontend=%s\n' "$backend_version" "$frontend_version"
printf 'New shared version: '
IFS= read -r new_version
test -n "$new_version" || { printf 'Version is required.\n' >&2; exit 1; }
if git show-ref --verify --quiet "refs/tags/v$new_version"; then
  printf 'Tag %s already exists.\n' "$new_version" >&2
  exit 1
else
  status=$?
  test "$status" -eq 1 || { printf 'Unable to check existing Git tags.\n' >&2; exit 1; }
fi
(cd apps/backend && poetry version "$new_version") && \
  npm --prefix apps/frontend version "$new_version" --no-git-tag-version && \
  git add apps/backend/pyproject.toml apps/frontend/package.json apps/frontend/package-lock.json && \
  git commit -m "🔖 bump to $new_version" -- apps/backend/pyproject.toml apps/frontend/package.json apps/frontend/package-lock.json && \
  git tag "$new_version"
