/**
 * Export projects, activities, indicators, and related configs to one Excel workbook.
 * Usage: node server/scripts/export-me-entities.js [output-path]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');

const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

const SHEETS = [
  {
    name: 'projects',
    query: `
      SELECT
        p.id, p.title, p.project_code, p.code, p.status, p.description,
        p.start_date, p.end_date, p.cost, p."sourceFunding", p.implementation_scope,
        p.component_id, c.title AS component_title,
        p.implementation_id, pi.title AS implementation_title,
        p.contractor_id, p."createdBy",
        p."createdAt", p."updatedAt"
      FROM project p
      LEFT JOIN component c ON c.id = p.component_id
      LEFT JOIN programme_implementation pi ON pi.id = p.implementation_id
      ORDER BY p.id
    `,
  },
  {
    name: 'project_locations',
    query: `
      SELECT
        pl.id, pl.project_id, p.title AS project_title, p.code AS project_code,
        pl.location_name, pl.location_type, pl.physical_progress_pct,
        pl.commencement_date, pl.revised_completion_date, pl.implementer,
        pl.county_id, pl.subcounty_id, pl.ward_id, pl.settlement_id,
        pl."createdAt", pl."updatedAt"
      FROM project_location pl
      LEFT JOIN project p ON p.id = pl.project_id
      ORDER BY pl.project_id, pl.id
    `,
  },
  {
    name: 'project_activities',
    query: `
      SELECT
        pa.project_id, p.title AS project_title, p.code AS project_code,
        pa.activity_id, a.title AS activity_title, a.code AS activity_code
      FROM project_activity pa
      LEFT JOIN project p ON p.id = pa.project_id
      LEFT JOIN activity a ON a.id = pa.activity_id
      ORDER BY pa.project_id, pa.activity_id
    `,
  },
  {
    name: 'activities',
    query: `
      SELECT id, title, "shortTitle", code, "createdBy", "createdAt", "updatedAt"
      FROM activity
      ORDER BY id
    `,
  },
  {
    name: 'indicators',
    query: `
      SELECT
        i.id, i.name, i.type, i.format, i.unit, i.level, i.code,
        i.activity_id, a.title AS activity_title, a.code AS activity_code,
        i."createdBy", i."createdAt", i."updatedAt"
      FROM indicator i
      LEFT JOIN activity a ON a.id = i.activity_id
      ORDER BY i.activity_id NULLS LAST, i.id
    `,
  },
  {
    name: 'indicator_categories',
    query: `
      SELECT
        ic.id, ic.indicator_level, ic.indicator_id, ic.indicator_name,
        ic.category_id, cat.category AS category_name, cat.code AS category_code,
        ic.activity_id, a.title AS activity_title,
        ic.project_id, p.title AS project_title,
        ic.project_location_id,
        ic.category_title, ic.frequency, f.frequency AS frequency_name,
        ic.code, ic."createdBy", ic."createdAt", ic."updatedAt"
      FROM indicator_category ic
      LEFT JOIN category cat ON cat.id = ic.category_id
      LEFT JOIN activity a ON a.id = ic.activity_id
      LEFT JOIN project p ON p.id = ic.project_id
      LEFT JOIN frequency f ON f.id = ic.frequency
      ORDER BY ic.id
    `,
  },
  {
    name: 'indicator_reports',
    query: `
      SELECT
        icr.id, icr.indicator_category_id,
        ic.indicator_name, ic.code AS indicator_category_code,
        icr.project_id, p.title AS project_title,
        icr.activity_id, a.title AS activity_title,
        icr.programme_implementation_id,
        icr.project_location_id,
        icr.county_id, icr.subcounty_id, icr.ward_id, icr.settlement_id,
        icr.period, icr.date, icr.amount, icr.qualitative, icr.target,
        icr.progress, icr.status, icr.comments, icr.documentation,
        icr."userId", icr.reject_msg, icr.code,
        icr."cumProgress", icr."cumAmount",
        icr."createdAt", icr."updatedAt"
      FROM indicator_category_report icr
      LEFT JOIN indicator_category ic ON ic.id = icr.indicator_category_id
      LEFT JOIN project p ON p.id = icr.project_id
      LEFT JOIN activity a ON a.id = icr.activity_id
      ORDER BY icr.id
    `,
  },
  {
    name: 'categories',
    query: `SELECT id, category, code FROM category ORDER BY id`,
  },
  {
    name: 'frequencies',
    query: `SELECT id, frequency, code FROM frequency ORDER BY id`,
  },
  {
    name: 'components',
    query: `
      SELECT c.id, c.title, c.code, c.acronym, c.icon,
             c.programme_id, c.domain_id, c."createdBy",
             c."createdAt", c."updatedAt"
      FROM component c
      ORDER BY c.id
    `,
  },
  {
    name: 'implementations',
    query: `
      SELECT id, title, code, description, acronym, icon, "createdBy",
             "createdAt", "updatedAt"
      FROM programme_implementation
      ORDER BY id
    `,
  },
  {
    name: 'module_settings',
    query: `
      SELECT id, module, enabled, description, config_value,
             created_by, updated_by, "createdAt", "updatedAt"
      FROM module_settings
      ORDER BY id
    `,
  },
  {
    name: 'chart_indicators',
    query: `
      SELECT
        ci.indicator_id, i.name AS indicator_name, i.code AS indicator_code,
        ci.dashboard_section_chart_id
      FROM chart_indicator ci
      LEFT JOIN indicator i ON i.id = ci.indicator_id
      ORDER BY ci.dashboard_section_chart_id, ci.indicator_id
    `,
  },
];

function serializeValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function rowsToSheet(rows) {
  if (!rows.length) {
    return XLSX.utils.aoa_to_sheet([['(no rows)']]);
  }

  const headers = Object.keys(rows[0]);
  const data = [
    headers,
    ...rows.map((row) => headers.map((key) => serializeValue(row[key]))),
  ];
  return XLSX.utils.aoa_to_sheet(data);
}

async function main() {
  const timestamp = new Date().toISOString().slice(0, 10);
  const defaultOut = path.join(
    process.cwd(),
    'data',
    'exports',
    `me-entities-cleanup-${timestamp}.xlsx`
  );
  const outputPath = path.resolve(process.argv[2] || defaultOut);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const client = new Client(DB);
  await client.connect();

  const workbook = XLSX.utils.book_new();
  const summary = [['Sheet', 'Row count', 'Exported at']];
  const exportedAt = new Date().toISOString();

  try {
    for (const sheet of SHEETS) {
      process.stdout.write(`Exporting ${sheet.name}... `);
      const result = await client.query(sheet.query);
      const ws = rowsToSheet(result.rows);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31));
      summary.push([sheet.name, String(result.rows.length), exportedAt]);
      process.stdout.write(`${result.rows.length} rows\n`);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '_summary');
    XLSX.writeFile(workbook, outputPath);

    console.log(`\nDone. Wrote ${outputPath}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
