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

Copy and enable the site config:

```bash
sudo cp deploy/nginx/kesmis.conf /etc/nginx/sites-available/kesmis
sudo ln -sf /etc/nginx/sites-available/kesmis /etc/nginx/sites-enabled/kesmis
sudo nginx -t && sudo systemctl reload nginx
```

This adds gzip at the edge and reinforces immutable caching for hashed `/assets/` files.

Verify gzip:

```bash
curl -sI -H "Accept-Encoding: gzip" https://kesmis.go.ke/assets/$(curl -s https://kesmis.go.ke/landing.html | grep -o '/assets/vue-vendor[^"]*' | head -1 | cut -c2-)
# Expect: Content-Encoding: gzip
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
