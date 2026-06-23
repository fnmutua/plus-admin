#!/bin/bash
# Watchdog for population_service.py — checks health and restarts if down.
# Example crontab (check every 5 minutes):
#   */5 * * * * /bin/bash /path/to/Buildings/watchdog.sh >> /path/to/Buildings/watchdog.log 2>&1

SERVICE_DIR="$(cd "$(dirname "$0")" && pwd)"
# Run watchdog-managed instance on a dedicated port so it can
# coexist with other services (e.g. climate on 5050) and with
# a manually run population_service on 8000.
PORT=8001
PYTHON=$(which python3 || which python)
LOG="$SERVICE_DIR/overture_buildings_service.log"
PID_FILE="$SERVICE_DIR/overture_buildings_service.pid"

is_running() {
    curl -sf --max-time 5 "http://127.0.0.1:$PORT/health" > /dev/null 2>&1
}

start_service() {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting overture_buildings_service.py on port $PORT..."
    cd "$SERVICE_DIR"
    PORT=$PORT nohup $PYTHON overture_buildings_service.py >> "$LOG" 2>&1 &
    echo $! > "$PID_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Started with PID $!"
}

if is_running; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK — service is healthy on port $PORT."
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN — health check failed. Restarting..."
    # Kill any stale process
    if [ -f "$PID_FILE" ]; then
        kill "$(cat "$PID_FILE")" 2>/dev/null
        rm -f "$PID_FILE"
    fi
    # Also kill anything still holding the port
    kill -9 $(lsof -ti :$PORT) 2>/dev/null || true
    sleep 2
    start_service
fi
