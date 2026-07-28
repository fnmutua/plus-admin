# Production performance deploy notes

After building the frontend (`npm run build`), restart the Node process:

```bash
pm2 restart production
# or: pm2 restart server
```

## What changed

1. **gzip** — Express `compression` middleware compresses JS/CSS/HTML responses.
2. **`landing.html` at `/`** — Public visitors get the lean SPA shell; `main.ts` picks public vs admin bootstrap from the hash route.
3. **Long-cache hashed assets** — Files under `/assets/*.{hash}.js|css` get `Cache-Control: public, max-age=31536000, immutable`.

## nginx (recommended on the server)

**Gzip only** — copy one file:

```bash
sudo cp deploy/nginx/gzip.conf /etc/nginx/conf.d/kesmis-gzip.conf
sudo nginx -t && sudo systemctl reload nginx
```

Ubuntu loads `/etc/nginx/conf.d/*.conf` inside `http { }` automatically. Do **not** also add gzip to `sites-available/default`.

Verify:

```bash
curl -sI -H "Accept-Encoding: gzip" "https://kesmis.go.ke/assets/$(curl -s https://kesmis.go.ke/ | grep -o 'vue-vendor[^"]*' | head -1 | sed 's|^|/assets/|')" | grep -i content-encoding
# Expect: Content-Encoding: gzip
```

**Full site config** (optional — proxy, SSL, asset cache): `deploy/nginx/kesmis.conf`

```bash
sudo cp deploy/nginx/kesmis.conf /etc/nginx/sites-available/kesmis
sudo ln -sf /etc/nginx/sites-available/kesmis /etc/nginx/sites-enabled/kesmis
sudo nginx -t && sudo systemctl reload nginx
```

Verify landing shell at root:

```bash
curl -s https://kesmis.go.ke/ | grep -o 'landing.html\|bootstrap-public\|/assets/index'
```

Verify cache headers:

```bash
curl -sI "https://kesmis.go.ke/assets/$(curl -s https://kesmis.go.ke/landing.html | grep -o 'vue-vendor[^"]*' | head -1)"
# Expect: Cache-Control: public, max-age=31536000, immutable
```

## Local audit + load test

From your machine (no SSH needed):

```bash
# Full audit + 100 concurrent load test
npm run test:live

# Audit only (gzip, landing at /, cache headers, no Mapbox in shell)
npm run test:live-audit

# Custom URL and concurrency
node tools/check-live-performance.mjs https://kesmis.go.ke 50
node tools/check-live-performance.mjs https://kesmis.go.ke 100 --audit-only
node tools/check-live-performance.mjs https://kesmis.go.ke 100 --load-only
node tools/check-live-performance.mjs https://kesmis.go.ke 100 --json   # CI-friendly exit code + JSON

# Simulate 1 Mbps connection (single user — how long until page is usable)
npm run test:live-slow
node tools/check-live-performance.mjs https://kesmis.go.ke --throttle 1mbps --load-only
node tools/check-live-performance.mjs https://kesmis.go.ke --throttle 512kbps --load-only
```

Checks: site up, `landing.html` at `/`, gzip on hashed assets, `Cache-Control: immutable`, lean shell (no `inject.js`), no Mapbox in initial load, load timings (p50/p95).

## National dashboard bundle (Redis)

One HTTP call loads all KPI cards + chart data for the National dashboard (national filter only).

- **GET** `/api/v1/dashboard/national/bundle` — returns cached payload (`fromCache: true` when served from Redis)
- Redis key: `dashboard:bundle:national`, TTL **10 minutes**
- Background refresh: cron `*/10 * * * *` on server start + every 10 min
- County/subcounty filters still use the legacy per-chart API path

Deploy: ensure Redis is running (`redis-cli ping` → `PONG`). Optional env:

```bash
REDIS_URL=redis://localhost:6379
DASHBOARD_BUNDLE_TTL_SECONDS=600
NATIONAL_DASHBOARD_CRON='*/10 * * * *'
```

Force rebuild (admin): `POST /api/v1/dashboard/national/bundle/refresh`
