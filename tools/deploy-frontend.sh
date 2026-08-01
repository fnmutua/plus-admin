#!/usr/bin/env bash
# Build on a machine with enough RAM, then sync dist/ to production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE="${DEPLOY_REMOTE:-kesmis@kesmis.go.ke}"
REMOTE_DIR="${DEPLOY_DIR:-/data/plus-admin/dist}"

echo "Building frontend..."
npm run build

echo "Verifying dist asset integrity..."
node tools/verify-dist-assets.mjs

echo "Syncing dist/ -> ${REMOTE}:${REMOTE_DIR}/"
rsync -avz --delete "${ROOT}/dist/" "${REMOTE}:${REMOTE_DIR}/"

echo "Done. Restart production PM2 if needed: ./startStopServer.sh restart"
