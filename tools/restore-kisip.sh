#!/usr/bin/env bash
# Restore a KeSMIS Postgres backup (.sql.tar / pg_dump archive) into the target database.
#
# Usage:
#   ./tools/restore-kisip.sh
#   ./tools/restore-kisip.sh /path/to/01072026.kesmis.sql.tar
#   ./tools/restore-kisip.sh --yes /path/to/backup.tar
#
# Reads DB settings from .env in the repo root when present.
# Target database defaults to VUE_APP_DB (kesmis in this project).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_FILE="${REPO_ROOT}/01072026.kesmis.sql.tar"
AUTO_YES=false

# Postgres.app CLI (optional)
if [[ -d "/Applications/Postgres.app/Contents/Versions/latest/bin" ]]; then
  export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y)
      AUTO_YES=true
      shift
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

if [[ -f "$REPO_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

DB_HOST="${VUE_APP_DB_HOST:-localhost}"
DB_PORT="${VUE_APP_DB_PORT:-5432}"
DB_USER="${VUE_APP_USER:-postgres}"
DB_NAME="${VUE_APP_DB:-kesmis}"
export PGPASSWORD="${VUE_APP_PASSWORD:-${DB_PASSWORD:-${PGPASSWORD:-}}}"

PSQL=(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -v ON_ERROR_STOP=1)
PG_RESTORE=(pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --no-owner --no-privileges --verbose)

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Error: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql not found. Install Postgres.app and add it to PATH." >&2
  exit 1
fi

echo "Backup:   $BACKUP_FILE"
echo "Target:   $DB_NAME @ $DB_HOST:$DB_PORT (user: $DB_USER)"
echo
echo "WARNING: This will drop and recreate database '$DB_NAME'. All existing data in it will be lost."
if [[ "$AUTO_YES" != true ]]; then
  read -r -p "Continue? [y/N] " reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

WORK_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

detect_dump_source() {
  if command -v pg_restore >/dev/null 2>&1 && pg_restore -l "$BACKUP_FILE" >/dev/null 2>&1; then
    echo "$BACKUP_FILE"
    return
  fi

  echo "Extracting archive..."
  tar -xf "$BACKUP_FILE" -C "$WORK_DIR"

  if [[ -f "$WORK_DIR/toc.dat" ]]; then
    echo "$WORK_DIR"
    return
  fi

  local dump_dir
  dump_dir="$(find "$WORK_DIR" -name toc.dat -print -quit)"
  if [[ -n "$dump_dir" ]]; then
    echo "$(dirname "$dump_dir")"
    return
  fi

  local custom_dump
  custom_dump="$(find "$WORK_DIR" -type f ! -name 'restore.sql' ! -name '._*' -print0 | xargs -0 file | grep 'PostgreSQL custom database dump' | head -n 1 | cut -d: -f1 || true)"
  if [[ -n "$custom_dump" ]]; then
    echo "$custom_dump"
    return
  fi

  local sql_file
  sql_file="$(find "$WORK_DIR" -type f \( -name '*.sql' -o -name '*.SQL' \) ! -name 'restore.sql' | head -n 1)"
  if [[ -z "$sql_file" ]]; then
    sql_file="$(find "$WORK_DIR" -type f -name '*.sql' | head -n 1)"
  fi
  if [[ -n "$sql_file" && -f "$sql_file" ]]; then
  if ! head -c 5 "$sql_file" | grep -q 'PGDMP'; then
      echo "sql:$sql_file"
      return
    fi
  fi

  echo "Error: unsupported backup format. Expected pg_dump archive (.tar / directory / custom) or plain .sql." >&2
  exit 1
}

echo "Recreating database '$DB_NAME'..."
"${PSQL[@]}" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" || true
"${PSQL[@]}" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
"${PSQL[@]}" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

DUMP_SOURCE="$(detect_dump_source)"
echo "Dump source: $DUMP_SOURCE"

if [[ "$DUMP_SOURCE" == sql:* ]]; then
  SQL_FILE="${DUMP_SOURCE#sql:}"
  echo "Restoring plain SQL into '$DB_NAME'..."
  "${PSQL[@]}" -d "$DB_NAME" -f "$SQL_FILE"
else
  if ! command -v pg_restore >/dev/null 2>&1; then
    echo "Error: pg_restore not found. This backup is a pg_dump archive, not plain SQL." >&2
    exit 1
  fi

  echo "Restoring pg_dump archive into '$DB_NAME'..."
  # Do not use restore.sql from directory dumps; pg_restore reads the archive directly.
  "${PG_RESTORE[@]}" -d "$DB_NAME" --clean --if-exists "$DUMP_SOURCE"
fi

echo
echo "Restore complete: $DB_NAME"
