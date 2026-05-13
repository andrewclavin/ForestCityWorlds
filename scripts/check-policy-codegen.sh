#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
node packages/auth-policy/scripts/codegen.mjs
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  git diff --exit-code apps/api/forest_api/_policies.py || {
    echo "Drift: run pnpm codegen:policies and commit apps/api/forest_api/_policies.py"
    exit 1
  }
fi
