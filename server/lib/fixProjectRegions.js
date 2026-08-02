'use strict';

const {
  resolveCanonicalRegion,
  regionsEqual,
  buildRegionByCountyId,
} = require('./projectRegionMapping');

/**
 * Reassign project.region from dominant project_location county when the stored
 * region is missing, a legacy alias, or otherwise inconsistent.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ dryRun?: boolean, transaction?: import('sequelize').Transaction }} options
 */
async function fixMisassignedProjectRegions(sequelize, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const externalTx = options.transaction || null;

  const run = async (transaction) => {
    const [counties] = await sequelize.query('SELECT id, name FROM county', { transaction });
    const regionByCountyId = buildRegionByCountyId(counties);

    const [projects] = await sequelize.query(
      `
        SELECT id, title, project_code, region, implementation_scope
        FROM project
        ORDER BY id
      `,
      { transaction },
    );

    const stats = {
      dryRun,
      scanned: projects.length,
      updated: 0,
      normalizedAlias: 0,
      realignedFromCounty: 0,
      skippedNational: 0,
      skippedNoLocation: 0,
      skippedUnmappedCounty: 0,
      skippedAlreadyCorrect: 0,
      multiRegionConflicts: 0,
      changes: [],
    };

    for (const project of projects) {
      if (String(project.implementation_scope || '').toLowerCase() === 'national') {
        stats.skippedNational += 1;
        continue;
      }

      const currentCanonical = resolveCanonicalRegion(project.region);
      const rawRegion = String(project.region || '').trim();

      const [locationRows] = await sequelize.query(
        `
          SELECT
            pl.county_id,
            c.name AS county_name,
            COUNT(*)::int AS location_count
          FROM project_location pl
          LEFT JOIN county c ON c.id = pl.county_id
          WHERE pl.project_id = :projectId
            AND pl.county_id IS NOT NULL
          GROUP BY pl.county_id, c.name
          ORDER BY location_count DESC, MIN(pl.id) ASC
        `,
        { replacements: { projectId: project.id }, transaction },
      );

      if (!locationRows.length) {
        if (rawRegion && currentCanonical && rawRegion !== currentCanonical) {
          stats.changes.push({
            projectId: project.id,
            title: project.title,
            projectCode: project.project_code,
            from: rawRegion,
            to: currentCanonical,
            reason: 'normalize_alias_no_location',
          });
          if (!dryRun) {
            await sequelize.query(
              `
                UPDATE project
                SET region = :region, "updatedAt" = NOW()
                WHERE id = :projectId
              `,
              { replacements: { region: currentCanonical, projectId: project.id }, transaction },
            );
          }
          stats.updated += 1;
          stats.normalizedAlias += 1;
        } else {
          stats.skippedNoLocation += 1;
        }
        continue;
      }

      const dominant = locationRows[0];
      const expectedRegion = regionByCountyId.get(Number(dominant.county_id));

      if (!expectedRegion) {
        stats.skippedUnmappedCounty += 1;
        continue;
      }

      const distinctRegions = new Set(
        locationRows
          .map((row) => regionByCountyId.get(Number(row.county_id)))
          .filter(Boolean),
      );
      if (distinctRegions.size > 1) {
        stats.multiRegionConflicts += 1;
      }

      const needsCountyFix =
        !currentCanonical || !regionsEqual(currentCanonical, expectedRegion);
      const needsAliasFix = rawRegion && rawRegion !== expectedRegion && regionsEqual(rawRegion, expectedRegion);

      if (!needsCountyFix && !needsAliasFix) {
        stats.skippedAlreadyCorrect += 1;
        continue;
      }

      const change = {
        projectId: project.id,
        title: project.title,
        projectCode: project.project_code,
        from: rawRegion || null,
        to: expectedRegion,
        county: dominant.county_name,
        locationCount: dominant.location_count,
        reason: needsCountyFix ? 'county_mismatch' : 'normalize_alias',
      };
      stats.changes.push(change);

      if (!dryRun) {
        await sequelize.query(
          `
            UPDATE project
            SET region = :region, "updatedAt" = NOW()
            WHERE id = :projectId
          `,
          { replacements: { region: expectedRegion, projectId: project.id }, transaction },
        );
      }

      stats.updated += 1;
      if (needsCountyFix) stats.realignedFromCounty += 1;
      else stats.normalizedAlias += 1;
    }

    return stats;
  };

  if (externalTx) {
    return run(externalTx);
  }

  return sequelize.transaction(run);
}

module.exports = {
  fixMisassignedProjectRegions,
};
