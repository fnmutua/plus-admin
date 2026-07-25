#!/usr/bin/env bash
# Manage KeSMIS PM2 services and optional health watchdog (for cron).
#
# Backend (.env next to production.js): picked up on each PM2 start — edit .env, re-run start/restart.
# Frontend (VITE_* e.g. VITE_GOOGLE_MAPS_API_KEY): baked in at "npm run build" time — after changing
#   those, run:  npm ci && npm run build   (with .env or env vars set), deploy dist/, then re-run start.
#
# Usage:
#   ./startStopServer.sh [start|stop|restart|status|healthcheck]
#   start       — (default) stop + start all services
#   healthcheck — verify PM2 + HTTP; restart anything unhealthy (for cron)
#
# Crontab — check every 5 minutes:
#   */5 * * * * /bin/bash /path/to/plus-admin/startStopServer.sh healthcheck >> /path/to/plus-admin/healthcheck.log 2>&1

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

PM2="${PM2_CMD:-sudo pm2}"
LOG_FILE="${HEALTHCHECK_LOG:-$REPO_ROOT/healthcheck.log}"
MAIN_PORT="${MAIN_HTTPS_PORT:-8443}"
CHAT_PORT="${CHAT_PORT:-3001}"
VIDEO_PORT="${VIDEO_STREAM_PORT:-3002}"

# name|start target (relative to REPO_ROOT or absolute)
SERVICES=(
  "production|production.js"
  "websocket-chat|server/websocket-chat.js"
  "websocket-video|server/websocket-video.js"
  "streamer|/home/kesmis/streamer/server.js"
)

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

pm2_online() {
  local name="$1"
  local status
  status="$($PM2 jlist 2>/dev/null | node -e "
    const name = process.argv[1];
    let data = '';
    process.stdin.on('data', c => data += c);
    process.stdin.on('end', () => {
      try {
        const list = JSON.parse(data || '[]');
        const proc = list.find(p => p.name === name);
        process.stdout.write(proc?.pm2_env?.status || 'missing');
      } catch {
        process.stdout.write('missing');
      }
    });
  " "$name" 2>/dev/null || echo "missing")"
  [[ "$status" == "online" ]]
}

http_ok() {
  local url="$1"
  curl -sfk --max-time "${HEALTHCHECK_TIMEOUT:-10}" "$url" > /dev/null 2>&1
}

tcp_open() {
  local host="${1:-127.0.0.1}"
  local port="$2"
  (echo > "/dev/tcp/$host/$port") >/dev/null 2>&1
}

start_one() {
  local name="$1"
  local target="$2"
  $PM2 stop "$name" 2>/dev/null || true
  $PM2 delete "$name" 2>/dev/null || true
  if [[ "$target" == /* ]]; then
    $PM2 start "$target" --name "$name"
  else
    $PM2 start "$target" --name "$name"
  fi
}

stop_one() {
  local name="$1"
  $PM2 stop "$name" 2>/dev/null || true
  $PM2 delete "$name" 2>/dev/null || true
}

start_all() {
  log "Starting all PM2 services..."
  local entry name target
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name target <<< "$entry"
    start_one "$name" "$target"
  done
  $PM2 save 2>/dev/null || true
  log "All services started."
}

stop_all() {
  log "Stopping all PM2 services..."
  local entry name target
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name target <<< "$entry"
    stop_one "$name"
  done
  log "All services stopped."
}

status_all() {
  $PM2 list
}

check_main_http() {
  http_ok "https://127.0.0.1:${MAIN_PORT}/"
}

service_health_ok() {
  local name="$1"
  if ! pm2_online "$name"; then
    return 1
  fi
  case "$name" in
    production)
      check_main_http
      ;;
    websocket-chat)
      tcp_open 127.0.0.1 "$CHAT_PORT"
      ;;
    websocket-video)
      tcp_open 127.0.0.1 "$VIDEO_PORT"
      ;;
    streamer)
      pm2_online "$name"
      ;;
    *)
      pm2_online "$name"
      ;;
  esac
}

restart_one() {
  local name="$1"
  local target="$2"
  log "Restarting $name..."
  start_one "$name" "$target"
}

healthcheck() {
  local failed=0
  local entry name target
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r name target <<< "$entry"
    if service_health_ok "$name"; then
      log "OK — $name is healthy."
    else
      log "WARN — $name failed health check. Restarting..."
      restart_one "$name" "$target"
      failed=$((failed + 1))
    fi
  done
  $PM2 save 2>/dev/null || true
  if (( failed > 0 )); then
    log "Health check complete — restarted $failed service(s)."
    return 1
  fi
  log "Health check complete — all services healthy."
  return 0
}

CMD="${1:-start}"

case "$CMD" in
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    start_all
    ;;
  status)
    status_all
    ;;
  healthcheck)
    healthcheck
    ;;
  *)
    echo "Usage: $0 [start|stop|restart|status|healthcheck]" >&2
    exit 1
    ;;
esac
