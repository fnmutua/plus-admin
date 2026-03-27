# KeSMIS Security Audit Report
**Date:** 2026-03-27
**System:** Kenya Settlement Monitoring Information System (KeSMIS)
**Stack:** Vue 3 / Node.js / Express / PostgreSQL / PostGIS
**Last Updated:** 2026-03-27

---

## CRITICAL (Fix Today)

| # | Gap | Location | Impact | Status |
|---|-----|----------|--------|--------|
| 1 | All `.env` files with real DB/API credentials committed to git | `.env`, `.env.base`, `.env.kisip` | Full DB + API compromise | ✅ Fixed — files untracked; git history purged via git-filter-repo (2515 commits rewritten, force-pushed 2026-03-27) |
| 2 | SMS API key hardcoded in controller code (not just .env) | `auth.controller.js`, `grievance.controller.js`, `incident.controller.js`, `user.controller.js` | Unauthorized SMS billing | ✅ Fixed — replaced with `process.env.SMS_API_KEY` / `SMS_PARTNER_ID` in all files |
| 3 | JWT secret is a trivially guessable hardcoded string | `server/app/config/auth.config.js` | Session forgery / account takeover | ✅ Fixed — reads from `JWT_SECRET` env var; throws on missing |
| 4 | AES encryption key is too short and weak | `.env` files | Encrypted data compromised | ❌ Open |
| 5 | CORS has wildcard `'*'` in allowed origins list | `server.js:13-16` | CSRF attacks from any domain | ✅ Fixed — explicit domain allowlist in `server.js` and `production.js` |
| 6 | No rate limiting on `/signin`, `/signup`, `/reset`, `/verify` despite `express-rate-limit` being installed | `server/app/routes/auth.routes.js` | Brute force / OTP enumeration | ✅ Fixed — `authLimiter` (20/15min) and `otpLimiter` (10/10min) applied |
| 7 | File uploads: no type check, original filename kept, 10GB size limit, no MIME validation | `server/app/controllers/tables.controller.js:4960-4992` | Malicious file upload / RCE | ❌ Open |

---

## HIGH (Fix This Week)

| # | Gap | Location | Impact | Status |
|---|-----|----------|--------|--------|
| 8 | `helmet`, `hpp`, `xss-clean` installed but never activated | `server.js` | No HTTP security headers, XSS exposure | ❌ Open |
| 9 | Full `err.message` sent to client in 500 responses | Throughout controllers | Attacker reconnaissance | ❌ Open |
| 10 | No token revocation/blacklist — logout does not invalidate tokens | `server/app/middleware/authJwt.js` | Stolen tokens remain valid for 24h | ✅ Fixed — `lastLogoutAt` stamped on logout; `verifyToken` rejects tokens issued before logout |
| 11 | Password reset tokens stored plaintext in database | `server/app/models/user.js` | Token theft leads to account takeover | ✅ Fixed — SHA-256 hash stored in DB; submitted token hashed before lookup |
| 12 | Dynamic model selection from `req.body.model` without whitelist | `server/app/controllers/tables.controller.js:984` | Unauthorized table access | ❌ Open (fix attempted but reverted — needs careful re-implementation) |
| 13 | No HTTPS enforcement on backend (port 3002 runs plain HTTP) | `server.js` | Credential interception (MITM) | ❌ Open |

---

## MEDIUM (Fix This Month)

| # | Gap | Location | Impact | Status |
|---|-----|----------|--------|--------|
| 14 | bcrypt salt rounds set to 8 (recommended: 12) | `auth.controller.js` | Faster offline password cracking | ✅ Fixed — bumped to 12 rounds in all 5 occurrences |
| 15 | No password complexity enforcement on signup | `auth.controller.js` | Weak passwords accepted | ✅ Fixed — complexity regex enforced on all 4 signup endpoints; name, email, username, phone, org validated |
| 16 | WebSocket connections lack origin validation | `server/websocket-chat.js`, `server/websocket-video.js` | Unauthorized message injection | ❌ Open |
| 17 | `super_admin`/`root_admin` roles bypass all permission checks | `server/app/middleware/permission.js` | Admin compromise = full system compromise | ❌ Open |
| 18 | Audit log excludes `user_roles` table | `server/app/utils/auditTrail.js` | Privilege escalation not logged | ✅ Fixed — `user_roles` removed from `excludedModels`; privilege changes now audited |
| 19 | `bodyParser` allows 200MB request bodies | `server.js` | DoS via oversized payloads | ✅ Fixed — limit reduced to 50MB in `production.js` |

---

## Credentials Inventory (All Must Be Rotated)

| Secret | Location | Status |
|--------|----------|--------|
| PostgreSQL password | `.env`, `.env.base`, `.env.kisip` | ⚠️ Files untracked — **rotate + purge git history** |
| JWT secret | `server/app/config/auth.config.js` | ⚠️ New secret in `.env.kisip` — **purge old from git history** |
| AES key | `.env` files | **ROTATE NOW** |
| SMS API key (QuickSMS) | Controllers + `.env` | ⚠️ Removed from code — **rotate key + purge git history** |
| OpenAI API key | `.env` files | ⚠️ File untracked — **rotate + purge git history** |
| XAI (Grok) API key | `.env` files | ⚠️ File untracked — **rotate + purge git history** |
| YouTube API key | `.env` files | ⚠️ File untracked — **rotate + purge git history** |
| Mapbox token | `.env.base` | **ROTATE NOW** |
| GeoServer admin password | Code default + `.env` | **ROTATE NOW** |
| Production DB password (`collect.casconsultants.co.ke`) | `db.config-live.js` (was git-tracked) | ⚠️ File untracked — **rotate immediately + purge git history** |

---

## Fix Plan

### Phase 1 — Immediate (Today / Tomorrow)
1. [x] Remove hardcoded SMS API key from all controller files — use env var only
2. [x] Fix JWT secret — use strong env var, throw on missing
3. [x] Fix CORS to explicit domain allowlist only (remove wildcard `'*'`)
4. [x] Add `express-rate-limit` to all auth routes (`/signin`, `/signup`, `/reset`, `/verify`)
5. [x] Untrack `.env*` and `db.config-*.js` from git
6. [x] Purge credential history from git with git-filter-repo (2026-03-27)
7. [ ] Rotate ALL credentials listed above — treat all as compromised

### Phase 2 — This Week
8. [ ] Enable `helmet()` middleware in `server.js`
9. [ ] Enable `xss-clean` and `hpp` middleware in `server.js`
10. [x] Hash password reset tokens before storing in DB
11. [x] Implement token revocation on logout (`lastLogoutAt`)
12. [x] bcrypt rounds increased to 12
13. [x] Password complexity + field validation enforced on all signup endpoints
14. [x] Privilege changes (user_roles) now audit-logged
15. [ ] Add file upload type/MIME validation, randomize filenames, reduce size limit to ~50MB
16. [ ] Sanitize error responses — generic messages to client, full errors to server log only
17. [ ] Re-implement dynamic model whitelist (tables.controller.js)

### Phase 3 — This Month
18. [ ] Enforce HTTPS + add HSTS header
19. [ ] Enforce password complexity on password *change* endpoint
20. [ ] Add origin validation to WebSocket handshake
21. [ ] Fix AES key length/strength

### Phase 4 — Long Term
22. [ ] Move secrets to a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager)
23. [ ] Add WAF (Web Application Firewall) in front of API
24. [ ] Implement TOTP-based MFA (not just SMS)
25. [ ] Add per-user API rate limiting
26. [ ] Regular penetration testing schedule
27. [ ] SIEM integration for security monitoring

---

## Security Packages Status

| Package | Installed | In Use |
|---------|-----------|--------|
| `helmet` | YES | **NO** |
| `hpp` | YES | **NO** |
| `xss-clean` | YES | **NO** |
| `express-rate-limit` | YES | **YES** ✅ |
| `bcryptjs` | YES | YES (rounds=12) ✅ |
| `jsonwebtoken` | YES | YES (strong env secret) ✅ |

---

## DB Migrations Applied (2026-03-27)

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "lastLogoutAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS access_reason VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS data_use_description TEXT;
```

---

*Report generated by security audit — 2026-03-27 | Last updated 2026-03-27*
