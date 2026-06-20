# Dashboard Charts — Axis Model Migration Guide

Date: 2026-06-20

## What Changed

Charts moved from legacy flat fields (`card_model_field`, `aggregation`, `categorized`) to three structured JSONB columns:

| Column | Type | Purpose |
|---|---|---|
| `x_axis` | JSONB | Group-by field — what goes on the X axis / pie slices |
| `y_axis` | JSONB | Measure field — what to count/sum/avg |
| `series_field` | JSONB | Optional split — creates multiple series (grouped bar) |

Example values:
```json
x_axis       = { "field": "county.name", "label": "County" }
y_axis       = { "field": "id", "aggregation": "count", "label": "count" }
series_field = { "field": "gender", "label": "Gender" }
```

Legacy columns **removed** from `dashboard_section_chart`:
- `aggregation`, `card_model_field`, `categorized`
- `filter_field`, `filter_function`, `filter_value`, `filter_option`

Use `filters` (JSONB array) and `filtered` (boolean) for chart scoping.

---

## One-time Setup (new environment)

### 1. Add the DB columns (if not already present)

```bash
# Sequelize migration
npx sequelize-cli db:migrate --to 033-add-axis-config-to-dashboard-section-chart.js
```

Or manually:
```sql
ALTER TABLE dashboard_section_chart
  ADD COLUMN IF NOT EXISTS x_axis      JSONB,
  ADD COLUMN IF NOT EXISTS y_axis      JSONB,
  ADD COLUMN IF NOT EXISTS series_field JSONB;
```

### 2. Run the migration script

Converts existing charts and drops legacy columns:

```bash
node server/scripts/migrate-charts-to-axis.js
```

Options:
- `--force` — re-derive axis config from legacy fields (before columns are dropped)
- `--dry-run` — preview changes without writing

Output shows `[OK migrated]`, `[FIX bad axis]`, `[SKIP]`, or `[ERROR]` per chart.

### 3. Drop legacy columns (if script not run)

```bash
npx sequelize-cli db:migrate --to 034-drop-legacy-dashboard-section-chart-columns.js
```

---

## Recovery: legacy columns already dropped

If legacy columns were removed before charts were migrated, restore an **older SQL backup** into a **temp database** and export chart config to CSV.

### 1. Restore backup to temp DB (on server)

```bash
cd /data/backup
tar -xf 19062026.kesmis.sql.tar

sudo -u postgres psql -c "DROP DATABASE IF EXISTS kesmis_tmp;"
sudo -u postgres psql -c "CREATE DATABASE kesmis_tmp OWNER kesmis;"
sudo -u postgres psql -d kesmis_tmp -v ON_ERROR_STOP=1 -f 19062026.kesmis.sql
```

### 2. Export legacy chart CSV

```bash
sudo -u postgres psql -d kesmis_tmp -c "\copy (
  SELECT id, title, type, category, card_model, card_model_field,
         aggregation, categorized, time_field, metric_fields
  FROM dashboard_section_chart ORDER BY id
) TO '/tmp/dashboard_section_chart_legacy.csv' WITH CSV HEADER"
```

### 3. Apply to live DB

```bash
cd /data/plus-admin
node server/scripts/repair-charts-from-csv.js /tmp/dashboard_section_chart_legacy.csv --dry-run
node server/scripts/repair-charts-from-csv.js /tmp/dashboard_section_chart_legacy.csv
node server/scripts/audit-charts-axis.js
```

---

## Migration semantics (legacy → axis)

| Legacy pattern | New axis config |
|---|---|
| Pie/donut/treemap: `card_model_field` | `x_axis.field` = slice/tile field; `y_axis` = count/sum of `id` |
| Bar `categorized=true` | `x_axis` = group field; `y_axis` = aggregation of `id` |
| Bar `categorized=false` | `x_axis` = `county.name`; `y_axis.field` = measure field |
| Line (5) | `x_axis` null; `y_axis.field` = measure; uses `time_field` |
| Map (7) | `x_axis` null; `y_axis` = measure + aggregation |
| Multi-line (12) | `metric_fields` + `time_field` only |
| Pyramid (8) | no axis config |
| Intervention charts | axis cleared — indicator path unchanged |

---

## How New Charts Work

### Data endpoint

`POST /api/v1/chart/render`

Accepts:
```json
{
  "chart_type": 1,
  "model": "households",
  "x_axis":       { "field": "county.name" },
  "y_axis":       { "field": "id", "aggregation": "count" },
  "series_field": { "field": "gender" },
  "filters": [
    { "field": "county_id", "operation": "in", "value": [1, 2] }
  ],
  "ignore_empty": true
}
```

Returns:
```json
{
  "categories": ["Nairobi", "Mombasa"],
  "series": [
    { "name": "Male",   "data": [1200, 800] },
    { "name": "Female", "data": [1100, 750] }
  ]
}
```

### Chart type routing

| Type | Name | X axis | Y axis | Series |
|---|---|---|---|---|
| 1 | Simple Bar | ✓ | ✓ | optional |
| 2 | Multiple Bar | ✓ | ✓ | required |
| 3 | Pie | slice field | aggregation only | — |
| 4 | Stacked Bar | ✓ | ✓ | optional |
| 5 | Line (time) | time_field | ✓ | optional |
| 7 | Map | auto (county) | ✓ | — |
| 9 | Bar (alt) | ✓ | ✓ | optional |
| 10 | Donut | slice field | aggregation only | — |
| 11 | Treemap | tile field | aggregation only | — |
| 12 | Multi-line | — | metric_fields | — |

---

## Virtual Field: `county.name`

When `x_axis.field = "county.name"` the backend auto-detects the admin level from active filters:

| Active filter | X axis resolves to |
|---|---|
| none (national) | `JOIN county` → county names |
| `county_id` filter | `JOIN subcounty` → sub-county names |
| `subcounty_id` filter | `JOIN ward` → ward names |

---

## Creating a New Chart (going forward)

1. In the chart settings UI, select model → chart type → fill in X axis, Y axis, series (if needed).
2. Add filters via the `filters` table if the chart should always be scoped.
3. Save — chart config is stored only in `x_axis` / `y_axis` / `series_field`.

No legacy fields are written.

---

## Key Files

| File | Purpose |
|---|---|
| `server/app/controllers/chart.controller.js` | Per-type SQL, `resolveVirtualField`, `buildWhere` |
| `server/app/models/dashboard_section_chart.js` | Sequelize model (axis columns only) |
| `server/scripts/migrate-charts-to-axis.js` | One-time migration + column drop |
| `server/scripts/repair-charts-from-csv.js` | Repair axis from legacy CSV export |
| `server/scripts/audit-charts-axis.js` | Find charts with missing/bad axis |
| `server/migrations/033-*.js` | Add axis columns |
| `server/migrations/034-*.js` | Drop legacy columns |
| `src/views/settings/DashboardChart.vue` | Chart config form |
| `src/views/Dashboard/DynamicState.vue` | Dashboard renderer |
| `src/views/Dashboard/National.vue` | National dashboard renderer |
