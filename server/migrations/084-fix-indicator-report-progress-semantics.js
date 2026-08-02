'use strict';

/**
 * Align indicator_category_report progress fields with cumAmount/target semantics.
 * - Unit indicators (93): cumProgress = delivery ratio, not physical build %
 * - Fix corrupt progress values (>100 when target is set)
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    const [unitFixed] = await sequelize.query(`
      UPDATE indicator_category_report icr
      SET progress = ROUND((icr."cumAmount" / icr.target) * 100, 2),
          "cumProgress" = ROUND((icr."cumAmount" / icr.target) * 100, 2),
          "updatedAt" = NOW()
      WHERE icr.indicator_category_id = 93
        AND icr.target IS NOT NULL
        AND icr.target > 0
        AND icr."cumAmount" IS NOT NULL
        AND (
          icr."cumProgress" IS NULL
          OR icr."cumProgress" > 100
          OR ABS(icr."cumProgress" - ROUND((icr."cumAmount" / icr.target) * 100, 2)) > 0.05
        )
      RETURNING icr.id
    `);

    const [physicalReset] = await sequelize.query(`
      UPDATE indicator_category_report icr
      SET "cumProgress" = pl.physical_progress_pct,
          progress = pl.physical_progress_pct,
          "updatedAt" = NOW()
      FROM project_location pl
      WHERE icr.project_location_id = pl.id
        AND icr.indicator_category_id = 47
        AND pl.physical_progress_pct IS NOT NULL
        AND COALESCE(LOWER(icr.status), '') <> 'rejected'
        AND (
          icr."cumProgress" IS NULL
          OR ABS(icr."cumProgress" - pl.physical_progress_pct) > 0.5
        )
      RETURNING icr.id
    `);

    console.log(
      `[084] Fixed ${unitFixed.length} housing unit progress row(s); ` +
        `synced ${physicalReset.length} implementation-status row(s) from location progress.`,
    );
  },

  down: async () => {
    console.warn('[084] down not implemented.');
  },
};
