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
