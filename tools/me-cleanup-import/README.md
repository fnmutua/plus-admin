# M&E Cleanup Import

Import master lists from `projects-clean.xlsx` into the KeSMIS PostgreSQL database.

## Contents

| File | Purpose |
|------|---------|
| `projects-clean.xlsx` | Master workbook (projects, activities, indicators, categories, reports) |
| `import-me-cleanup.js` | Import script |
| `me-cleanup-shared.js` | DB config and workbook helpers |
| `run-import.sh` | Shell wrapper (recommended) |

## Prerequisites

- Node.js 18+
- `npm install` run in the repo root (needs `pg` and `xlsx`)
- PostgreSQL access to the target `kisip` database

## Quick start (on the live server)

```bash
cd /path/to/plus-admin

export VUE_APP_DB_HOST=localhost      # or kesmis.go.ke if DB is local to server
export VUE_APP_DB_PORT=5432
export VUE_APP_USER=postgres
export VUE_APP_PASSWORD='your-password'
export VUE_APP_DB=kisip

# 1. Dry-run first — review the summary, no writes
./tools/me-cleanup-import/run-import.sh

# 2. Apply when satisfied
./tools/me-cleanup-import/run-import.sh --apply
```

## What it updates

1. **Activities** — titles, new activities, merges
2. **Projects** — contract numbers (`project_code`)
3. **Project–activity links** — add/remove links per workbook
4. **Indicators** — update/create/merge/remove (IND70 removed)
5. **Indicator categories** — report configuration
6. **Indicator reports** — relink to correct categories

All writes run in a single transaction; rolls back on error.

## Custom workbook

```bash
./tools/me-cleanup-import/run-import.sh --apply /path/to/custom.xlsx
```

## Copy folder only

If deploying just this folder to a server that already has the repo:

```bash
scp -r tools/me-cleanup-import user@kesmis.go.ke:/path/to/plus-admin/tools/
```

Then SSH in and run from the repo root as above.
