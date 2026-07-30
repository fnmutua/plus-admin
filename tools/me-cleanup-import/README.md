# M&E Cleanup Import

Import master lists from `projects-clean.xlsx` into the KeSMIS PostgreSQL database.

## Contents

| File | Purpose |
|------|---------|
| `run-import.js` | Entry point — run this |
| `import-me-cleanup.js` | Import logic |
| `me-cleanup-shared.js` | .env loading, DB config, workbook helpers |
| `projects-clean.xlsx` | Master workbook |

## Prerequisites

- Node.js 18+
- `npm install` in repo root (needs `pg`, `xlsx`, `dotenv`)
- Repo root `.env` with DB credentials

## Quick start

```bash
cd /data/plus-admin/tools/me-cleanup-import

node run-import.js              # dry-run
node run-import.js --apply      # commit
```

Or from repo root:

```bash
node tools/me-cleanup-import/run-import.js --apply
```

Required in repo root `.env`:

```
VUE_APP_DB_HOST=localhost
VUE_APP_DB_PORT=5432
VUE_APP_USER=postgres
VUE_APP_PASSWORD=...
VUE_APP_DB=kisip
```

## What it updates

1. **Activities** — titles, new activities, merges
2. **Projects** — contract numbers (`project_code`)
3. **Project–activity links** — full sync from `project_activities` sheet (adds suggested links, removes extras)
4. **Indicators** — update/create/merge/remove (IND70 removed)
5. **Indicator categories** — report configuration
6. **Indicator reports** — relink to correct categories

All writes run in a single transaction; rolls back on error.

## Custom workbook

```bash
node run-import.js --apply /path/to/custom.xlsx
```
