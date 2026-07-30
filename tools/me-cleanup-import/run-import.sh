#!/usr/bin/env bash
# Import M&E cleanup master lists from projects-clean.xlsx into PostgreSQL.
#
# Usage:
#   ./tools/me-cleanup-import/run-import.sh              # dry-run (no writes)
#   ./tools/me-cleanup-import/run-import.sh --apply      # commit to database
#   ./tools/me-cleanup-import/run-import.sh --apply /path/to/other.xlsx
#
# Database connection via environment variables (set before running, or in repo .env):
#   VUE_APP_DB_HOST   (default: localhost)
#   VUE_APP_DB_PORT   (default: 5432)
#   VUE_APP_USER      (default: postgres)
#   VUE_APP_PASSWORD
#   VUE_APP_DB        (default: kisip)
#
# Example for live server:
#   export VUE_APP_DB_HOST=localhost
#   export VUE_APP_DB_PORT=5432
#   export VUE_APP_USER=postgres
#   export VUE_APP_PASSWORD='your-password'
#   export VUE_APP_DB=kisip
#   ./tools/me-cleanup-import/run-import.sh              # review first
#   ./tools/me-cleanup-import/run-import.sh --apply      # then apply

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

cd "$REPO_ROOT"

if [[ ! -d "$REPO_ROOT/node_modules/pg" ]]; then
  echo "Missing dependencies. Run 'npm install' in $REPO_ROOT first." >&2
  exit 1
fi

if [[ ! -f "$SCRIPT_DIR/projects-clean.xlsx" ]]; then
  echo "Workbook not found: $SCRIPT_DIR/projects-clean.xlsx" >&2
  exit 1
fi

echo "Repo:     $REPO_ROOT"
echo "Workbook: $SCRIPT_DIR/projects-clean.xlsx"
echo "Database: ${VUE_APP_USER:-postgres}@${VUE_APP_DB_HOST:-localhost}:${VUE_APP_DB_PORT:-5432}/${VUE_APP_DB:-kisip}"
echo

node "$SCRIPT_DIR/import-me-cleanup.js" "$@"
