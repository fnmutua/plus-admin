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

---

## One-time Setup (new environment)

### 1. Add the DB columns

```sql
ALTER TABLE dashboard_section_chart
  ADD COLUMN IF NOT EXISTS x_axis      JSONB,
  ADD COLUMN IF NOT EXISTS y_axis      JSONB,
  ADD COLUMN IF NOT EXISTS series_field JSONB;
```

### 2. Run the migration script

Converts all existing charts from legacy fields to the new axis format:

```bash
node server/scripts/migrate-charts-to-axis.js
```

Output will show `[OK migrated]`, `[SKIP already migrated]`, or `[ERROR]` per chart.  
Re-running is safe — charts that already have `x_axis` or `y_axis` set are skipped.

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

This means one chart config drills down automatically when a county or sub-county is selected on the dashboard.

Requirements: the model table must have `county_id`, `subcounty_id`, and `ward_id` columns.

---

## Creating a New Chart (going forward)

1. In the chart settings UI, select model → chart type → fill in:
   - **X axis field** — pick from the field list (or `County / Sub-county / Ward (auto)`)
   - **Aggregation** — count / sum / avg / min / max
   - **Y axis field** — the numeric field to measure (hidden for pie/donut/treemap)
   - **Series field** — optional, for grouped/multiple bar
2. Add filters if the chart should always be scoped (e.g. only a specific programme)
3. Save — the chart is immediately live on the dashboard

No manual SQL or script runs are needed for new charts.

---

## Adding a New Chart Type (developer)

1. Add the type ID to `CHART_TYPE_CONFIG` in `src/views/settings/DashboardChart.vue` with the correct flags (`xAxis`, `yAxis`, `yAxisField`, `series`, labels).
2. Add a handler in `server/app/controllers/chart.controller.js` and register it in the `renderChart` dispatcher at the bottom of the file.
3. Add a `processXxx` function in `src/views/Dashboard/DynamicState.vue` and call it from `getCharts`.

---

## Key Files

| File | Purpose |
|---|---|
| `server/app/controllers/chart.controller.js` | Per-type SQL, `resolveVirtualField`, `buildWhere` |
| `server/app/models/dashboard_section_chart.js` | Sequelize model (x_axis, y_axis, series_field defined here) |
| `server/scripts/migrate-charts-to-axis.js` | One-time migration script |
| `server/migrations/033-add-axis-config-to-dashboard-section-chart.js` | Sequelize migration (run via CLI or manually) |
| `src/views/settings/DashboardChart.vue` | Chart config form — `CHART_TYPE_CONFIG` source of truth |
| `src/views/Dashboard/DynamicState.vue` | Dashboard renderer — `getAxisChartData`, `processMultiBarChart`, etc. |
