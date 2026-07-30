/**
 * Re-sync KISIP project_activity rows from inferKisipProjectActivityCodes().
 * Usage:
 *   node server/scripts/fix-kisip-project-activities.js           # dry run
 *   node server/scripts/fix-kisip-project-activities.js --apply   # write DB
 *   node server/scripts/fix-kisip-project-activities.js --apply --ids=18,110,113
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });

const { Client } = require('pg');
const {
  inferKisipProjectActivityCodes,
  normalizeActivityCode,
  CODE_ALIASES,
} = require('./project-activity-matching');

const DB = {
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT || 5432),
  user: process.env.VUE_APP_USER || 'postgres',
  password: process.env.VUE_APP_PASSWORD || 'Admin@2011',
  database: process.env.VUE_APP_DB || 'kisip',
};

function resolveCanonical(code) {
  let current = normalizeActivityCode(code);
  const seen = new Set();
  while (CODE_ALIASES[current] && !seen.has(current)) {
    seen.add(current);
    current = CODE_ALIASES[current];
  }
  return current;
}

function parseArgs() {
  const apply = process.argv.includes('--apply');
  const idsArg = process.argv.find((arg) => arg.startsWith('--ids='));
  const ids = idsArg
    ? idsArg
        .slice('--ids='.length)
        .split(',')
        .map((v) => Number(v.trim()))
        .filter(Boolean)
    : null;
  return { apply, ids };
}

async function main() {
  const { apply, ids } = parseArgs();
  const client = new Client(DB);
  await client.connect();

  try {
    const { rows: activityRows } = await client.query(
      `SELECT id, code FROM activity WHERE code IS NOT NULL`,
    );
    const idByCode = new Map();
    for (const row of activityRows) {
      const canonical = resolveCanonical(row.code);
      if (!idByCode.has(canonical)) idByCode.set(canonical, row.id);
    }

    let projectQuery = `
      SELECT
        p.id,
        trim(regexp_replace(p.title, E'[\\n\\r]+', ' ', 'g')) AS title,
        pi.acronym AS programme_acronym,
        pi.title AS programme,
        c.acronym AS component_acronym,
        c.title AS component
      FROM project p
      JOIN programme_implementation pi ON pi.id = p.implementation_id
      LEFT JOIN component c ON c.id = p.component_id
      WHERE lower(COALESCE(pi.acronym, '')) LIKE '%kisip%'
         OR lower(COALESCE(pi.title, '')) LIKE '%kisip%'
      ORDER BY p.id
    `;
    const params = [];
    if (ids?.length) {
      projectQuery = `
        SELECT
          p.id,
          trim(regexp_replace(p.title, E'[\\n\\r]+', ' ', 'g')) AS title,
          pi.acronym AS programme_acronym,
          pi.title AS programme,
          c.acronym AS component_acronym,
          c.title AS component
        FROM project p
        JOIN programme_implementation pi ON pi.id = p.implementation_id
        LEFT JOIN component c ON c.id = p.component_id
        WHERE p.id = ANY($1::int[])
        ORDER BY p.id
      `;
      params.push(ids);
    }

    const { rows: projects } = await client.query(projectQuery, params);

    const { rows: currentRows } = await client.query(`
      SELECT pa.project_id, a.code
      FROM project_activity pa
      JOIN activity a ON a.id = pa.activity_id
    `);
    const currentByProject = new Map();
    for (const row of currentRows) {
      if (!currentByProject.has(row.project_id)) currentByProject.set(row.project_id, []);
      currentByProject.get(row.project_id).push(resolveCanonical(row.code));
    }

    const changes = [];
    const missingCodes = new Set();

    for (const project of projects) {
      const programmeKey = `${project.programme_acronym || ''} ${project.programme || ''} ${project.component_acronym || ''} ${project.component || ''}`;
      const targetCodes = inferKisipProjectActivityCodes(project.title, programmeKey).map(resolveCanonical);
      const currentCodes = [...new Set(currentByProject.get(project.id) || [])].sort();
      const nextCodes = [...new Set(targetCodes)].sort();

      const same =
        currentCodes.length === nextCodes.length &&
        currentCodes.every((code, idx) => code === nextCodes[idx]);

      if (same) continue;

      for (const code of nextCodes) {
        if (!idByCode.has(code)) missingCodes.add(code);
      }

      changes.push({
        id: project.id,
        title: project.title,
        from: currentCodes.join(', ') || '—',
        to: nextCodes.join(', ') || '—',
        targetIds: nextCodes.map((code) => idByCode.get(code)).filter(Boolean),
      });
    }

    console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
    console.log(`KISIP projects scanned: ${projects.length}`);
    console.log(`Projects to update: ${changes.length}`);

    if (missingCodes.size) {
      console.log(`\nMissing activity codes in DB: ${[...missingCodes].join(', ')}`);
    }

    for (const change of changes) {
      console.log(`\n#${change.id}`);
      console.log(`  ${change.title.slice(0, 100)}`);
      console.log(`  from: ${change.from}`);
      console.log(`  to:   ${change.to}`);
    }

    if (!apply) {
      console.log('\nDry run only. Re-run with --apply to update project_activity.');
      return;
    }

    if (missingCodes.size) {
      throw new Error('Cannot apply — add missing activity codes to the master list first.');
    }

    await client.query('BEGIN');
    for (const change of changes) {
      await client.query(`DELETE FROM project_activity WHERE project_id = $1`, [change.id]);
      for (const activityId of change.targetIds) {
        await client.query(
          `INSERT INTO project_activity (project_id, activity_id, "createdAt", "updatedAt")
           VALUES ($1, $2, NOW(), NOW())`,
          [change.id, activityId],
        );
      }
    }
    await client.query('COMMIT');
    console.log(`\nUpdated ${changes.length} project(s).`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
