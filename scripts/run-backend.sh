#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/apps/backend"
poetry run flask --app app.main run --port 3000
