'use strict';

/** SQL fragment: project belongs to the Kenya Slum Upgrading (SUD) programme portfolio. */
const SUD_PROJECT_WHERE = `
  (
    pr.project_code ILIKE '%SDHUD%'
    OR pr.project_code ILIKE '%/SUD/%'
    OR pr.project_code ILIKE 'SUD/%'
    OR EXISTS (
      SELECT 1
      FROM component c
      JOIN programmex p ON p.id = c.programme_id
      WHERE c.id = pr.component_id
        AND (
          p.acronym ILIKE '%SUD%'
          OR p.title ILIKE '%Slum Upgrading%'
        )
    )
  )
`;

/**
 * Promote ward-level SUD project locations to subcounty (constituency) granularity:
 * - set location_type = 'subcounty'
 * - backfill subcounty_id / county_id from ward + subcounty tables
 * - clear ward_id (and settlement_id on ward-scoped rows)
 * - set project.implementation_scope = 'subcounty' where it was 'ward'
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {{ dryRun?: boolean, transaction?: import('sequelize').Transaction }} options
 */
async function promoteSudWardLocationsToSubcounty(sequelize, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const externalTx = options.transaction || null;

  const run = async (transaction) => {
    const [candidates] = await sequelize.query(
      `
        SELECT
          pl.id,
          pl.project_id,
          pr.project_code,
          pr.implementation_scope,
          pl.location_type,
          pl.county_id,
          pl.subcounty_id,
          pl.ward_id,
          pl.settlement_id,
          COALESCE(pl.subcounty_id, w.subcounty_id) AS resolved_subcounty_id,
          COALESCE(pl.county_id, sc.county_id, w.county_id) AS resolved_county_id,
          sc.name AS subcounty_name,
          w.name AS ward_name
        FROM project_location pl
        JOIN project pr ON pr.id = pl.project_id
        LEFT JOIN ward w ON w.id = pl.ward_id
        LEFT JOIN subcounty sc ON sc.id = COALESCE(pl.subcounty_id, w.subcounty_id)
        WHERE ${SUD_PROJECT_WHERE}
          AND pl.location_type = 'ward'
        ORDER BY pl.id
      `,
      { transaction },
    );

    const stats = {
      dryRun,
      candidates: candidates.length,
      locationsUpdated: 0,
      projectsScopeUpdated: 0,
      skippedNoSubcounty: 0,
      duplicateConflicts: 0,
      changes: [],
    };

    const projectIdsForScope = new Set();

    for (const row of candidates) {
      const resolvedSubcountyId = row.resolved_subcounty_id != null ? Number(row.resolved_subcounty_id) : null;
      const resolvedCountyId = row.resolved_county_id != null ? Number(row.resolved_county_id) : null;

      if (!resolvedSubcountyId) {
        stats.skippedNoSubcounty += 1;
        stats.changes.push({
          locationId: row.id,
          projectId: row.project_id,
          projectCode: row.project_code,
          action: 'skipped',
          reason: 'no_subcounty_resolved',
        });
        continue;
      }

      const [existing] = await sequelize.query(
        `
          SELECT id
          FROM project_location
          WHERE project_id = :projectId
            AND id <> :locationId
            AND location_type = 'subcounty'
            AND COALESCE(ward_id, -1) = -1
            AND COALESCE(settlement_id, -1) = -1
            AND subcounty_id = :subcountyId
            AND COALESCE(county_id, -1) = COALESCE(:countyId, -1)
          LIMIT 1
        `,
        {
          replacements: {
            projectId: row.project_id,
            locationId: row.id,
            subcountyId: resolvedSubcountyId,
            countyId: resolvedCountyId,
          },
          transaction,
        },
      );

      if (existing.length) {
        stats.duplicateConflicts += 1;
        stats.changes.push({
          locationId: row.id,
          projectId: row.project_id,
          projectCode: row.project_code,
          action: 'skipped',
          reason: 'duplicate_subcounty_location',
          keeperId: existing[0].id,
        });
        continue;
      }

      stats.changes.push({
        locationId: row.id,
        projectId: row.project_id,
        projectCode: row.project_code,
        action: dryRun ? 'would_update' : 'updated',
        from: {
          location_type: row.location_type,
          county_id: row.county_id,
          subcounty_id: row.subcounty_id,
          ward_id: row.ward_id,
        },
        to: {
          location_type: 'subcounty',
          county_id: resolvedCountyId,
          subcounty_id: resolvedSubcountyId,
          ward_id: null,
        },
        subcountyName: row.subcounty_name,
        wardName: row.ward_name,
      });

      if (!dryRun) {
        await sequelize.query(
          `
            UPDATE project_location
            SET
              location_type = 'subcounty',
              subcounty_id = :subcountyId,
              county_id = :countyId,
              ward_id = NULL,
              settlement_id = NULL,
              "updatedAt" = NOW()
            WHERE id = :locationId
          `,
          {
            replacements: {
              locationId: row.id,
              subcountyId: resolvedSubcountyId,
              countyId: resolvedCountyId,
            },
            transaction,
          },
        );
      }

      stats.locationsUpdated += 1;
      if (String(row.implementation_scope || '').toLowerCase() === 'ward') {
        projectIdsForScope.add(Number(row.project_id));
      }
    }

    if (projectIdsForScope.size) {
      stats.projectsScopeUpdated = projectIdsForScope.size;
      if (!dryRun) {
        await sequelize.query(
          `
            UPDATE project
            SET implementation_scope = 'subcounty', "updatedAt" = NOW()
            WHERE id IN (:projectIds)
              AND LOWER(COALESCE(implementation_scope, '')) = 'ward'
          `,
          {
            replacements: { projectIds: [...projectIdsForScope] },
            transaction,
          },
        );
      }
    }

    return stats;
  };

  if (externalTx) {
    return run(externalTx);
  }

  return sequelize.transaction((transaction) => run(transaction));
}

module.exports = {
  SUD_PROJECT_WHERE,
  promoteSudWardLocationsToSubcounty,
};
