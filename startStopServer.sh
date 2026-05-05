#!/usr/bin/env bash
# Restart Node services with PM2. Run from anywhere: uses this script's directory as repo root.
#
# Backend (.env next to production.js): picked up on each PM2 start — edit .env, re-run this script.
# Frontend (VITE_* e.g. VITE_GOOGLE_MAPS_API_KEY): baked in at "npm run build" time — after changing
#   those, run:  npm ci && npm run build   (with .env or env vars set), deploy dist/, then re-run this script.

set -e
cd "$(dirname "$0")"

sudo pm2 stop production || true
sudo pm2 delete production || true
sudo pm2 start production.js

sudo pm2 stop server/websocket-chat.js || true
sudo pm2 delete server/websocket-chat.js || true
sudo pm2 start server/websocket-chat.js

sudo pm2 stop server/websocket-video.js || true
sudo pm2 delete server/websocket-video.js || true
sudo pm2 start server/websocket-video.js

sudo pm2 stop /home/kesmis/streamer/server.js || true
sudo pm2 delete /home/kesmis/streamer/server.js || true
sudo pm2 start /home/kesmis/streamer/server.js
