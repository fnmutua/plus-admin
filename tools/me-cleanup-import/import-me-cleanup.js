/**
 * Import M&E cleanup master lists from projects-clean.xlsx into PostgreSQL.
 *
 * Run via run-import.js (recommended):
 *   node tools/me-cleanup-import/run-import.js [--apply] [workbook.xlsx]
 */

const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');
const {
  PROJECTS_CLEAN_PATH,
  REPO_ROOT,
  getDB,
  isUuidCode,
  normalizeActivityCodeForImport,
  cleanActivityTitle,
  cleanIndicatorName,
  loadWorkbook,
  loadActivityMergeMap,
} = require('./me-cleanup-shared');
const { inferActivityCodes, inferTenderType } = require(path.join(
  REPO_ROOT,
  'server/scripts/project-activity-matching.js'
));

const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;
const workbookPath = path.resolve(
  process.argv.find((arg) => !arg.startsWith('-') && arg.endsWith('.xlsx')) ||
    PROJECTS_CLEAN_PATH
);

const stats = {
  activities_updated: 0,
  activities_created: 0,
  activities_merged: 0,
  projects_updated: 0,
  project_links_added: 0,
  project_links_removed: 0,
  project_links_inferred: 0,
  project_links_unmapped: 0,
  indicators_updated: 0,
  indicators_created: 0,
  indicators_merged: 0,
  indicators_removed: 0,
  categories_updated: 0,
  categories_created: 0,
  categories_removed: 0,
  reports_updated: 0,
  reports_removed: 0,
};

function sheetRows(workbook, name) {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet);
}

function isYes(value) {
  return String(value || 'Y').trim().toUpperCase() === 'Y';
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function log(msg) {
  console.log(msg);
}

async function query(client, sql, params = []) {
  if (DRY_RUN) return { rows: [], rowCount: 0 };
  return client.query(sql, params);
}

async function findActivityId(client, code, title, activityIdByCode) {
  if (code) {
    const normalized = String(code).trim();
    const fromMap =
      activityIdByCode.byCode.get(normalized) ||
      activityIdByCode.byCode.get(normalized.toUpperCase());
    if (fromMap) return fromMap;
  }
  if (DRY_RUN) return null;

  if (code) {
    const { rows } = await client.query(
      `SELECT id FROM activity WHERE code = $1 LIMIT 1`,
      [String(code)]
    );
    if (rows.length) return rows[0].id;
  }
  if (title) {
    const { rows } = await client.query(
      `SELECT id FROM activity WHERE title = $1 LIMIT 1`,
      [title]
    );
    if (rows.length) return rows[0].id;
  }
  return null;
}

async function findIndicatorIdByCode(client, code, indicatorMaps) {
  if (code && indicatorMaps.byCode.has(String(code))) {
    return indicatorMaps.byCode.get(String(code));
  }
  if (DRY_RUN || !code) return null;
  const { rows } = await client.query(
    `SELECT id FROM indicator WHERE code = $1 LIMIT 1`,
    [String(code)]
  );
  return rows.length ? rows[0].id : null;
}

async function findCategoryId(client, indicatorId, categoryId, frequencyId, level) {
  if (DRY_RUN) return null;
  const { rows } = await client.query(
    `SELECT id FROM indicator_category
     WHERE indicator_id = $1 AND category_id = $2 AND frequency = $3 AND indicator_level = $4
     LIMIT 1`,
    [indicatorId, categoryId, frequencyId, level]
  );
  return rows.length ? rows[0].id : null;
}

async function mergeActivity(client, duplicateId, targetId, activityIdByCode) {
  if (!duplicateId || !targetId || duplicateId === targetId) return;

  if (!DRY_RUN) {
    const { rows } = await client.query(`SELECT id FROM activity WHERE id = $1`, [duplicateId]);
    if (!rows.length) {
      log(`  skip merge activity ${duplicateId} → ${targetId} (already merged)`);
      return;
    }
  }

  log(`  merge activity ${duplicateId} → ${targetId}`);

  await query(
    client,
    `DELETE FROM project_activity pa
     WHERE pa.activity_id = $1
       AND EXISTS (
         SELECT 1 FROM project_activity existing
         WHERE existing.project_id = pa.project_id AND existing.activity_id = $2
       )`,
    [duplicateId, targetId]
  );

  await query(
    client,
    `UPDATE project_activity SET activity_id = $2, "updatedAt" = NOW()
     WHERE activity_id = $1`,
    [duplicateId, targetId]
  );
  await query(
    client,
    `UPDATE indicator SET activity_id = $2, "updatedAt" = NOW()
     WHERE activity_id = $1`,
    [duplicateId, targetId]
  );
  await query(
    client,
    `UPDATE indicator_category SET activity_id = $2, "updatedAt" = NOW()
     WHERE activity_id = $1`,
    [duplicateId, targetId]
  );
  await query(
    client,
    `UPDATE indicator_category_report SET activity_id = $2, "updatedAt" = NOW()
     WHERE activity_id = $1`,
    [duplicateId, targetId]
  );

  const del = await query(client, `DELETE FROM activity WHERE id = $1`, [duplicateId]);
  if (!DRY_RUN && del.rowCount) {
    activityIdByCode.byId.delete(duplicateId);
    for (const [code, mappedId] of activityIdByCode.byCode.entries()) {
      if (mappedId === duplicateId) activityIdByCode.byCode.delete(code);
    }
  }
  stats.activities_merged += 1;
}

async function mergeIndicator(client, duplicateId, targetId) {
  if (!duplicateId || !targetId || duplicateId === targetId) return;

  if (!DRY_RUN) {
    const { rows } = await client.query(`SELECT id FROM indicator WHERE id = $1`, [duplicateId]);
    if (!rows.length) {
      log(`  skip merge indicator ${duplicateId} → ${targetId} (already merged)`);
      return;
    }
  }

  log(`  merge indicator ${duplicateId} → ${targetId}`);

  const dupCats = DRY_RUN
    ? []
    : (
        await client.query(
          `SELECT id, indicator_level, category_id, frequency
           FROM indicator_category WHERE indicator_id = $1`,
          [duplicateId]
        )
      ).rows;

  const tgtCats = DRY_RUN
    ? []
    : (
        await client.query(
          `SELECT id, indicator_level, category_id, frequency
           FROM indicator_category WHERE indicator_id = $1`,
          [targetId]
        )
      ).rows;

  const categoryKey = (row) =>
    `${row.indicator_level}:${row.category_id}:${row.frequency}`;
  const targetCategoryByKey = new Map(
    tgtCats.map((row) => [categoryKey(row), row.id])
  );

  for (const dupCat of dupCats) {
    const key = categoryKey(dupCat);
    const targetCategoryId = targetCategoryByKey.get(key);

    if (targetCategoryId) {
      await query(
        client,
        `DELETE FROM indicator_category_report r
         WHERE r.indicator_category_id = $1
           AND EXISTS (
             SELECT 1 FROM indicator_category_report existing
             WHERE existing.indicator_category_id = $2
               AND existing.programme_implementation_id = r.programme_implementation_id
               AND existing.settlement_id IS NOT DISTINCT FROM r.settlement_id
               AND existing.project_location_id IS NOT DISTINCT FROM r.project_location_id
               AND existing.amount IS NOT DISTINCT FROM r.amount
           )`,
        [dupCat.id, targetCategoryId]
      );
      await query(
        client,
        `UPDATE indicator_category_report
         SET indicator_category_id = $2, "updatedAt" = NOW()
         WHERE indicator_category_id = $1`,
        [dupCat.id, targetCategoryId]
      );
      await query(client, `DELETE FROM indicator_category WHERE id = $1`, [dupCat.id]);
    } else {
      await query(
        client,
        `UPDATE indicator_category
         SET indicator_id = $2, "updatedAt" = NOW()
         WHERE id = $1`,
        [dupCat.id, targetId]
      );
      targetCategoryByKey.set(key, dupCat.id);
    }
  }

  await query(client, `DELETE FROM indicator WHERE id = $1`, [duplicateId]);
  stats.indicators_merged += 1;
}

async function removeIndicator(client, indicatorId) {
  if (!indicatorId) return;

  if (!DRY_RUN) {
    const { rows } = await client.query(`SELECT id FROM indicator WHERE id = $1`, [indicatorId]);
    if (!rows.length) {
      log(`  skip remove indicator ${indicatorId} (already removed)`);
      return;
    }
  }

  log(`  remove indicator ${indicatorId}`);

  const cats = DRY_RUN
    ? []
    : (
        await client.query(
          `SELECT id FROM indicator_category WHERE indicator_id = $1`,
          [indicatorId]
        )
      ).rows;
  const catIds = cats.map((row) => row.id);

  if (catIds.length) {
    await query(
      client,
      `DELETE FROM indicator_category_report WHERE indicator_category_id = ANY($1::int[])`,
      [catIds]
    );
    await query(
      client,
      `DELETE FROM indicator_category WHERE id = ANY($1::int[])`,
      [catIds]
    );
  }

  await query(client, `DELETE FROM indicator WHERE id = $1`, [indicatorId]);
  stats.indicators_removed += 1;
}

async function buildActivityIdMap(client) {
  const { rows } = await client.query(
    `SELECT id, code FROM activity ORDER BY id`
  );
  const byId = new Map();
  const byCode = new Map();

  for (const row of rows) {
    byId.set(row.id, row);
    if (row.code) byCode.set(String(row.code), row.id);
    if (isUuidCode(row.code)) byCode.set(`AC${row.id}`, row.id);
    else if (/^AC\d+$/i.test(String(row.code))) byCode.set(String(row.code).toUpperCase(), row.id);
    else byCode.set(`AC${row.id}`, row.id);
  }

  return { byId, byCode };
}

function resolveActivityId(code, activityIdByCode, numericId) {
  if (numericId && activityIdByCode.byId.has(numericId)) return numericId;
  if (!code) return numericId || null;
  const normalized = String(code).trim();
  return (
    activityIdByCode.byCode.get(normalized) ||
    activityIdByCode.byCode.get(normalized.toUpperCase()) ||
    numericId ||
    null
  );
}

async function importActivities(client, workbook, activityIdByCode, mergeMap) {
  log('\n=== Activities ===');
  const rows = sheetRows(workbook, 'activities').filter((row) => isYes(row.keep));

  for (const row of rows) {
    const id = num(row.id);
    const action = String(row.action || 'keep');
    if (action === 'merge') continue;

    const code = normalizeActivityCodeForImport(
      row.activity_code || row.code,
      id
    );
    const title = cleanActivityTitle(row.title);
    const shortTitle = row.shortTitle || title;

    if (id && (action === 'keep' || action === 'realign')) {
      log(`  update activity ${id}: ${shortTitle}`);
      await query(
        client,
        `UPDATE activity
         SET title = $2, "shortTitle" = $3, code = $4, "updatedAt" = NOW()
         WHERE id = $1`,
        [id, title, shortTitle, code || `AC${id}`]
      );
      activityIdByCode.byCode.set(String(code || `AC${id}`), id);
      activityIdByCode.byId.set(id, { id, code: code || `AC${id}` });
      stats.activities_updated += 1;
      continue;
    }

    if (action === 'add_to_master' || action === 'anticipated' || action === 'add_new') {
      const existingId = await findActivityId(client, code, title, activityIdByCode);

      if (existingId) {
        log(`  update existing activity ${existingId} (${code}): ${shortTitle}`);
        await query(
          client,
          `UPDATE activity
           SET title = $2, "shortTitle" = $3, code = $4, "updatedAt" = NOW()
           WHERE id = $1`,
          [existingId, title, shortTitle, code]
        );
        activityIdByCode.byId.set(existingId, { id: existingId, code });
        activityIdByCode.byCode.set(String(code), existingId);
        stats.activities_updated += 1;
        continue;
      }

      log(`  create activity ${code}: ${shortTitle}`);
      if (DRY_RUN) {
        const fakeId = 900000 + stats.activities_created;
        activityIdByCode.byId.set(fakeId, { id: fakeId, code });
        if (code) activityIdByCode.byCode.set(String(code), fakeId);
        stats.activities_created += 1;
        continue;
      }
      const insert = await client.query(
        `INSERT INTO activity (title, "shortTitle", code, "createdBy", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 1, NOW(), NOW())
         RETURNING id`,
        [title, shortTitle, code]
      );
      const newId = insert.rows[0].id;
      activityIdByCode.byId.set(newId, { id: newId, code });
      activityIdByCode.byCode.set(String(code), newId);
      stats.activities_created += 1;
    }
  }

  const merges = sheetRows(workbook, 'activity_merges');
  for (const row of merges) {
    const duplicateId = num(row.duplicate_id);
    const targetId = num(row.merge_into_id);
    if (duplicateId && targetId) {
      await mergeActivity(client, duplicateId, targetId, activityIdByCode);
    }
  }

  for (const [duplicateId, targetId] of Object.entries(mergeMap)) {
    const dup = Number(duplicateId);
    const tgt = Number(targetId);
    if (activityIdByCode.byId.has(dup) && !sheetRows(workbook, 'activity_merges').some(
      (row) => Number(row.duplicate_id) === dup
    )) {
      await mergeActivity(client, dup, tgt, activityIdByCode);
    }
  }
}

async function importProjects(client, workbook) {
  log('\n=== Projects ===');
  const rows = sheetRows(workbook, 'projects').filter((row) => isYes(row.keep));

  for (const row of rows) {
    const id = num(row.id);
    if (!id) continue;

    const contractNo = String(row.contract_no || '').trim();
    const projectCode = String(row.project_code || contractNo || '').trim();
    if (!contractNo && !projectCode) continue;

    log(`  update project ${id}: contract_no=${contractNo || projectCode}`);
    await query(
      client,
      `UPDATE project
       SET project_code = $2, "updatedAt" = NOW()
       WHERE id = $1`,
      [id, contractNo || projectCode]
    );
    stats.projects_updated += 1;
  }
}

async function importProjectActivities(client, workbook, activityIdByCode) {
  log('\n=== Project activities ===');
  const rows = sheetRows(workbook, 'project_activities');

  for (const row of rows) {
    const projectId = num(row.project_id);
    if (!projectId) continue;

    const suggested = String(row.suggested_activity_codes || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);
    const missing = String(row.missing_activities || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);
    const extra = String(row.extra_activities || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean);

    // Authoritative target = all suggested links for this project (union missing as fallback).
    const targetCodes = [...new Set([...suggested, ...missing])];
    if (!targetCodes.length) continue;

    const targetActivityIds = [];
    const unresolvedCodes = [];
    for (const code of targetCodes) {
      const activityId = resolveActivityId(code, activityIdByCode, null);
      if (!activityId) {
        unresolvedCodes.push(code);
        continue;
      }
      targetActivityIds.push(activityId);
    }

    for (const code of unresolvedCodes) {
      log(`  skip link ${projectId} → ${code} (activity not found)`);
    }

    if (!targetActivityIds.length) continue;

    const uniqueTargetIds = [...new Set(targetActivityIds)];

    // Full sync: drop links not in the workbook target set, then ensure all targets exist.
    if (!DRY_RUN) {
      const prune = await client.query(
        `DELETE FROM project_activity
         WHERE project_id = $1
           AND NOT (activity_id = ANY($2::int[]))`,
        [projectId, uniqueTargetIds]
      );
      if (prune.rowCount) {
        stats.project_links_removed += prune.rowCount;
        log(`  prune project ${projectId}: removed ${prune.rowCount} extra link(s)`);
      }
    } else if (extra.length) {
      stats.project_links_removed += extra.length;
    }

    for (const activityId of uniqueTargetIds) {
      const code =
        [...activityIdByCode.byCode.entries()].find(([, id]) => id === activityId)?.[0] ||
        `AC${activityId}`;
      log(`  link project ${projectId} → activity ${activityId} (${code})`);
      if (DRY_RUN) {
        stats.project_links_added += 1;
        continue;
      }
      const result = await client.query(
        `INSERT INTO project_activity (project_id, activity_id, "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (project_id, activity_id) DO NOTHING`,
        [projectId, activityId]
      );
      if (result.rowCount) stats.project_links_added += 1;
    }

    // Explicit extras from sheet (covers codes that could not be resolved during export).
    for (const code of extra) {
      const activityId = resolveActivityId(code, activityIdByCode, null);
      if (!activityId) continue;
      log(`  unlink project ${projectId} ✕ activity ${activityId} (${code})`);
      await query(
        client,
        `DELETE FROM project_activity WHERE project_id = $1 AND activity_id = $2`,
        [projectId, activityId]
      );
      stats.project_links_removed += 1;
    }
  }
}

async function allocateUnlinkedProjectActivities(client, activityIdByCode) {
  log('\n=== Unlinked projects (best-match allocation) ===');
  const { rows } = await client.query(`
    SELECT p.id, p.title
    FROM project p
    WHERE NOT EXISTS (
      SELECT 1 FROM project_activity pa WHERE pa.project_id = p.id
    )
    ORDER BY p.id
  `);

  if (!rows.length) {
    log('  none');
    return;
  }

  for (const row of rows) {
    const projectId = row.id;
    const title = String(row.title || '').trim();
    const codes = inferActivityCodes(title);
    const tenderType = inferTenderType(title);
    const preview = title.length > 60 ? `${title.slice(0, 60)}…` : title;

    if (!codes.length) {
      log(`  skip project ${projectId}: no activity match — ${preview}`);
      stats.project_links_unmapped += 1;
      continue;
    }

    log(`  project ${projectId} (${tenderType}): ${codes.join('; ')} — ${preview}`);

    for (const code of codes) {
      const activityId = resolveActivityId(code, activityIdByCode, null);
      if (!activityId) {
        log(`    skip ${code} (activity not found)`);
        continue;
      }
      log(`    link → ${code} (${activityId})`);
      if (DRY_RUN) {
        stats.project_links_inferred += 1;
        continue;
      }
      const result = await client.query(
        `INSERT INTO project_activity (project_id, activity_id, "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (project_id, activity_id) DO NOTHING`,
        [projectId, activityId]
      );
      if (result.rowCount) stats.project_links_inferred += 1;
    }
  }
}

async function buildIndicatorIdMap(client) {
  const { rows } = await client.query(`SELECT id, code FROM indicator ORDER BY id`);
  const byId = new Map();
  const byCode = new Map();
  for (const row of rows) {
    byId.set(row.id, row);
    if (row.code) byCode.set(String(row.code), row.id);
    byCode.set(`IND${row.id}`, row.id);
  }
  return { byId, byCode };
}

function resolveIndicatorId(row, indicatorMaps) {
  const id = num(row.indicator_id);
  if (id && indicatorMaps.byId.has(id)) return id;
  const code = row.indicator_code || row.code;
  if (code && indicatorMaps.byCode.has(String(code))) {
    return indicatorMaps.byCode.get(String(code));
  }
  return id;
}

async function syncIndicatorCategoryNames(client, indicatorId, indicatorName) {
  await query(
    client,
    `UPDATE indicator_category
     SET indicator_name = $2, "updatedAt" = NOW()
     WHERE indicator_id = $1`,
    [indicatorId, indicatorName]
  );
}

async function importIndicators(client, workbook, activityIdByCode, indicatorMaps) {
  log('\n=== Indicators ===');
  const rows = sheetRows(workbook, 'indicators').filter(
    (row) => isYes(row.keep) && isYes(row.master_list)
  );

  for (const row of rows) {
    const id = num(row.id);
    const action = String(row.action || 'keep');
    if (action === 'merge') continue;

    const activityId = resolveActivityId(
      row.activity_code,
      activityIdByCode,
      num(row.activity_id)
    );

    const indicatorName = cleanIndicatorName(row.name);

    if (id && ['keep', 'realign', 'project_level'].includes(action)) {
      log(`  update indicator ${id}: ${indicatorName}`);
      await query(
        client,
        `UPDATE indicator
         SET name = $2, type = $3, format = $4, unit = $5, level = $6,
             activity_id = $7, code = COALESCE(NULLIF($8, ''), code), "updatedAt" = NOW()
         WHERE id = $1`,
        [
          id,
          indicatorName,
          row.type || 'output',
          row.format || 'number',
          row.unit || 'No.',
          row.level || 'activity',
          activityId,
          row.indicator_code || row.code,
        ]
      );
      await syncIndicatorCategoryNames(client, id, indicatorName);
      stats.indicators_updated += 1;
      continue;
    }

    if (action === 'add_new' || action === 'add_with_activity') {
      const indicatorCode = row.indicator_code || row.code;
      const existingId = await findIndicatorIdByCode(client, indicatorCode, indicatorMaps);

      if (existingId) {
        log(`  update existing indicator ${existingId} (${indicatorCode}): ${indicatorName}`);
        await query(
          client,
          `UPDATE indicator
           SET name = $2, type = $3, format = $4, unit = $5, level = $6,
               activity_id = $7, code = COALESCE(NULLIF($8, ''), code), "updatedAt" = NOW()
           WHERE id = $1`,
          [
            existingId,
            indicatorName,
            row.type || 'output',
            row.format || 'number',
            row.unit || 'No.',
            row.level || 'activity',
            activityId,
            indicatorCode,
          ]
        );
        await syncIndicatorCategoryNames(client, existingId, indicatorName);
        indicatorMaps.byId.set(existingId, { id: existingId, code: indicatorCode });
        if (indicatorCode) indicatorMaps.byCode.set(String(indicatorCode), existingId);
        stats.indicators_updated += 1;
        continue;
      }

      log(`  create indicator ${indicatorCode}: ${indicatorName}`);
      if (DRY_RUN) {
        const fakeId = 900000 + stats.indicators_created;
        indicatorMaps.byId.set(fakeId, { id: fakeId, code: row.indicator_code });
        if (row.indicator_code) {
          indicatorMaps.byCode.set(String(row.indicator_code), fakeId);
        }
        stats.indicators_created += 1;
        continue;
      }
      const insert = await client.query(
        `INSERT INTO indicator (name, type, format, unit, level, activity_id, code, "createdBy", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW())
         RETURNING id`,
        [
          indicatorName,
          row.type || 'output',
          row.format || 'number',
          row.unit || 'No.',
          row.level || 'activity',
          activityId,
          row.indicator_code || row.code,
        ]
      );
      indicatorMaps.byId.set(insert.rows[0].id, insert.rows[0]);
      if (row.indicator_code) {
        indicatorMaps.byCode.set(String(row.indicator_code), insert.rows[0].id);
      }
      stats.indicators_created += 1;
    }
  }

  const merges = sheetRows(workbook, 'indicator_merges');
  for (const row of merges) {
    if (row.action === 'remove_on_import') {
      await removeIndicator(client, num(row.duplicate_id));
      continue;
    }
    await mergeIndicator(client, num(row.duplicate_id), num(row.merge_into_id));
  }
}

async function buildCategoryIdMap(client) {
  const { rows } = await client.query(
    `SELECT id, indicator_id, category_title FROM indicator_category ORDER BY id`
  );
  const byId = new Map();
  const byIndicatorTitle = new Map();
  for (const row of rows) {
    byId.set(row.id, row);
    byIndicatorTitle.set(`${row.indicator_id}:${row.category_title}`, row.id);
  }
  return { byId, byIndicatorTitle };
}

async function importIndicatorCategories(
  client,
  workbook,
  activityIdByCode,
  indicatorMaps,
  categoryMaps
) {
  log('\n=== Indicator categories ===');

  const removals = sheetRows(workbook, 'indicator_category_removals');
  for (const row of removals) {
    const id = num(row.id);
    if (!id) continue;

    if (!DRY_RUN) {
      const { rows } = await client.query(
        `SELECT id FROM indicator_category WHERE id = $1`,
        [id]
      );
      if (!rows.length) {
        log(`  skip remove category config ${id} (already removed)`);
        continue;
      }
    }

    log(`  remove category config ${id} (IND${row.indicator_id} ${row.category_title})`);
    await query(
      client,
      `DELETE FROM indicator_category_report WHERE indicator_category_id = $1`,
      [id]
    );
    await query(client, `DELETE FROM indicator_category WHERE id = $1`, [id]);
    stats.categories_removed += 1;
  }

  const rows = sheetRows(workbook, 'indicator_categories').filter(
    (row) => isYes(row.keep) && isYes(row.master_list)
  );

  for (const row of rows) {
    const id = num(row.id);
    const action = String(row.action || 'keep');
    const indicatorId = resolveIndicatorId(row, indicatorMaps);
    const indicatorName = cleanIndicatorName(row.indicator_name || row.name);
    const activityId = resolveActivityId(
      row.activity_code,
      activityIdByCode,
      num(row.activity_id)
    );
    const categoryId = num(row.category_id);
    const frequencyId = num(row.frequency_id) || 3;

    if (!indicatorId && action !== 'add_new') continue;
    if (!categoryId) {
      log(`  skip category row — missing category_id for ${row.indicator_name} / ${row.category_title}`);
      continue;
    }

    if (id && ['keep', 'realign'].includes(action)) {
      log(`  update category ${id}: IND${indicatorId} ${row.category_title}`);
      await query(
        client,
        `UPDATE indicator_category
         SET indicator_id = $2, indicator_name = $3, indicator_level = $4,
             activity_id = $5, category_id = $6, category_title = $7,
             frequency = $8, "updatedAt" = NOW()
         WHERE id = $1`,
        [
          id,
          indicatorId,
          indicatorName,
          row.indicator_level || 'activity',
          activityId,
          categoryId,
          row.category_title,
          frequencyId,
        ]
      );
      categoryMaps.byId.set(id, row);
      categoryMaps.byIndicatorTitle.set(`${indicatorId}:${row.category_title}`, id);
      stats.categories_updated += 1;
      continue;
    }

    if (action === 'add_new' || action === 'add_with_activity') {
      if (!indicatorId) {
        log(`  skip new category — indicator not created yet: ${row.indicator_code}`);
        continue;
      }

      const level = row.indicator_level || 'activity';
      const existingCategoryId = await findCategoryId(
        client,
        indicatorId,
        categoryId,
        frequencyId,
        level
      );

      if (existingCategoryId) {
        log(`  update existing category ${existingCategoryId}: IND${indicatorId} ${row.category_title}`);
        await query(
          client,
          `UPDATE indicator_category
           SET indicator_name = $2, activity_id = $3, category_title = $4, "updatedAt" = NOW()
           WHERE id = $1`,
          [existingCategoryId, indicatorName, activityId, row.category_title]
        );
        categoryMaps.byId.set(existingCategoryId, row);
        categoryMaps.byIndicatorTitle.set(`${indicatorId}:${row.category_title}`, existingCategoryId);
        stats.categories_updated += 1;
        continue;
      }

      log(`  create category IND${indicatorId} ${row.category_title}`);
      if (DRY_RUN) {
        stats.categories_created += 1;
        continue;
      }
      const insert = await client.query(
        `INSERT INTO indicator_category
          (indicator_level, indicator_id, indicator_name, category_id, activity_id,
           category_title, frequency, "createdBy", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW())
         RETURNING id`,
        [
          row.indicator_level || 'activity',
          indicatorId,
          indicatorName,
          categoryId,
          activityId,
          row.category_title,
          frequencyId,
        ]
      );
      const newId = insert.rows[0].id;
      categoryMaps.byId.set(newId, row);
      categoryMaps.byIndicatorTitle.set(`${indicatorId}:${row.category_title}`, newId);
      stats.categories_created += 1;
    }
  }
}

async function importIndicatorReports(client, workbook, activityIdByCode, categoryMaps) {
  log('\n=== Indicator reports ===');

  const removals = sheetRows(workbook, 'indicator_report_removals');
  for (const row of removals) {
    const id = num(row.id);
    if (!id) continue;

    if (!DRY_RUN) {
      const { rows } = await client.query(
        `SELECT id FROM indicator_category_report WHERE id = $1`,
        [id]
      );
      if (!rows.length) {
        log(`  skip remove report ${id} (already removed)`);
        continue;
      }
    }

    log(`  remove report ${id} (IND${row.indicator_id} ${row.category_title})`);
    await query(client, `DELETE FROM indicator_category_report WHERE id = $1`, [id]);
    stats.reports_removed += 1;
  }

  const rows = sheetRows(workbook, 'indicator_reports').filter((row) => isYes(row.keep));

  for (const row of rows) {
    const id = num(row.id);
    const action = String(row.action || 'keep');
    if (!id || action === 'remove') continue;

    const targetCategoryId =
      num(row.target_indicator_category_id) || num(row.indicator_category_id);
    const targetActivityId = resolveActivityId(
      row.activity_code,
      activityIdByCode,
      num(row.target_activity_id) || num(row.activity_id)
    );

    if (action === 'realign' || action === 'keep') {
      const sets = [];
      const params = [id];
      let idx = 2;

      if (targetCategoryId) {
        sets.push(`indicator_category_id = $${idx++}`);
        params.push(targetCategoryId);
      }
      if (targetActivityId) {
        sets.push(`activity_id = $${idx++}`);
        params.push(targetActivityId);
      }

      if (!sets.length) continue;

      log(`  update report ${id} (${action})`);
      sets.push(`"updatedAt" = NOW()`);
      await query(
        client,
        `UPDATE indicator_category_report SET ${sets.join(', ')} WHERE id = $1`,
        params
      );
      stats.reports_updated += 1;
    }
  }
}

async function refreshIndicatorIdMap(client, indicatorMaps) {
  if (DRY_RUN) return;
  const refreshed = await buildIndicatorIdMap(client);
  indicatorMaps.byId = refreshed.byId;
  indicatorMaps.byCode = refreshed.byCode;
}

async function main(envPath) {
  const DB = getDB();

  log(`Env:      ${envPath}`);
  log(`Database: ${DB.user}@${DB.host}:${DB.port}/${DB.database}`);
  log(`Reading:  ${workbookPath}`);
  log(DRY_RUN ? 'Mode:     DRY RUN — pass --apply to write changes\n' : 'Mode:     APPLY — writing to database\n');

  const workbook = loadWorkbook(workbookPath);
  const mergeMap = loadActivityMergeMap(workbook);

  const client = new Client(DB);
  await client.connect();

  try {
    if (!DRY_RUN) await client.query('BEGIN');

    const activityIdByCode = await buildActivityIdMap(client);
    await importActivities(client, workbook, activityIdByCode, mergeMap);

    if (!DRY_RUN) {
      const refreshed = await buildActivityIdMap(client);
      activityIdByCode.byId = refreshed.byId;
      activityIdByCode.byCode = refreshed.byCode;
    }

    await importProjects(client, workbook);
    await importProjectActivities(client, workbook, activityIdByCode);
    await allocateUnlinkedProjectActivities(client, activityIdByCode);

    const indicatorMaps = await buildIndicatorIdMap(client);
    await importIndicators(client, workbook, activityIdByCode, indicatorMaps);
    await refreshIndicatorIdMap(client, indicatorMaps);

    const categoryMaps = DRY_RUN
      ? { byId: new Map(), byIndicatorTitle: new Map() }
      : await buildCategoryIdMap(client);
    await importIndicatorCategories(
      client,
      workbook,
      activityIdByCode,
      indicatorMaps,
      categoryMaps
    );

    if (!DRY_RUN) {
      const refreshedCats = await buildCategoryIdMap(client);
      categoryMaps.byId = refreshedCats.byId;
      categoryMaps.byIndicatorTitle = refreshedCats.byIndicatorTitle;
    }

    await importIndicatorReports(client, workbook, activityIdByCode, categoryMaps);

    if (!DRY_RUN) {
      await client.query('COMMIT');
      log('\nCommitted.');
    }

    log('\n=== Summary ===');
    for (const [key, value] of Object.entries(stats)) {
      if (value) log(`  ${key}: ${value}`);
    }
    if (DRY_RUN) {
      log('\nDry run complete. Re-run with --apply to execute.');
    }
  } catch (err) {
    if (!DRY_RUN) {
      await client.query('ROLLBACK');
      log('Rolled back.');
    }
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = { main };
