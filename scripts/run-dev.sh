#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
workdir="${TMPDIR:-/tmp}/webforms-links-generator-dev-$$"
backend_pid=
frontend_pid=
backend_log_pid=
frontend_log_pid=

cleanup() {
  trap - EXIT HUP INT TERM
  for pid in "$backend_pid" "$frontend_pid"; do
    [[ -z "$pid" ]] || kill -TERM -- "-$pid" 2>/dev/null || true
  done
  for pid in "$backend_pid" "$frontend_pid" "$backend_log_pid" "$frontend_log_pid"; do
    [[ -z "$pid" ]] || wait "$pid" 2>/dev/null || true
  done
  rm -rf "$workdir"
}

on_signal() {
  cleanup
  exit 130
}

mkdir "$workdir" && mkfifo "$workdir/backend" "$workdir/frontend"
trap cleanup EXIT
trap on_signal HUP INT TERM

setsid "$ROOT_DIR/scripts/run-backend.sh" >"$workdir/backend" 2>&1 & backend_pid=$!
setsid "$ROOT_DIR/scripts/run-frontend.sh" >"$workdir/frontend" 2>&1 & frontend_pid=$!
sed 's/^/[backend] /' <"$workdir/backend" & backend_log_pid=$!
sed 's/^/[frontend] /' <"$workdir/frontend" & frontend_log_pid=$!

set +e
wait "$backend_pid"
backend_status=$?
wait "$frontend_pid"
frontend_status=$?
wait "$backend_log_pid"
wait "$frontend_log_pid"
set -e

test "$backend_status" -eq 0 -a "$frontend_status" -eq 0
