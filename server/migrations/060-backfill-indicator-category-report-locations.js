'use strict';

/**
 * Backfill indicator_category_report location links for rows created before
 * project_location_id was consistently saved.
 *
 * 1. Set project_location_id from matching project_location (project + geo keys)
 * 2. Fill missing county/subcounty/ward/settlement ids from linked project_location
 */
module.exports = {
  up: async (queryInterface) => {
    const sequelize = queryInterface.sequelize;

    const [[{ missing_pl_before }]] = await sequelize.query(`
      SELECT COUNT(*)::int AS missing_pl_before
      FROM indicator_category_report
      WHERE project_location_id IS NULL
        AND project_id IS NOT NULL;
    `);

    console.log(`[060] Reports missing project_location_id before backfill: ${missing_pl_before}`);

    await sequelize.transaction(async (transaction) => {
      // project + settlement (most specific)
      await sequelize.query(
        `
          UPDATE indicator_category_report r
          SET project_location_id = pick.pl_id
          FROM (
            SELECT DISTINCT ON (r2.id)
              r2.id AS report_id,
              pl.id AS pl_id
            FROM indicator_category_report r2
            JOIN project_location pl
              ON pl.project_id = r2.project_id
             AND pl.settlement_id = r2.settlement_id
            WHERE r2.project_location_id IS NULL
              AND r2.project_id IS NOT NULL
              AND r2.settlement_id IS NOT NULL
            ORDER BY r2.id, pl.id
          ) pick
          WHERE r.id = pick.report_id;
        `,
        { transaction }
      );

      // project + ward (no settlement on report)
      await sequelize.query(
        `
          UPDATE indicator_category_report r
          SET project_location_id = pick.pl_id
          FROM (
            SELECT DISTINCT ON (r2.id)
              r2.id AS report_id,
              pl.id AS pl_id
            FROM indicator_category_report r2
            JOIN project_location pl
              ON pl.project_id = r2.project_id
             AND pl.ward_id = r2.ward_id
             AND pl.settlement_id IS NULL
            WHERE r2.project_location_id IS NULL
              AND r2.project_id IS NOT NULL
              AND r2.settlement_id IS NULL
              AND r2.ward_id IS NOT NULL
            ORDER BY r2.id, pl.id
          ) pick
          WHERE r.id = pick.report_id;
        `,
        { transaction }
      );

      // project + subcounty
      await sequelize.query(
        `
          UPDATE indicator_category_report r
          SET project_location_id = pick.pl_id
          FROM (
            SELECT DISTINCT ON (r2.id)
              r2.id AS report_id,
              pl.id AS pl_id
            FROM indicator_category_report r2
            JOIN project_location pl
              ON pl.project_id = r2.project_id
             AND pl.subcounty_id = r2.subcounty_id
             AND pl.ward_id IS NULL
             AND pl.settlement_id IS NULL
            WHERE r2.project_location_id IS NULL
              AND r2.project_id IS NOT NULL
              AND r2.settlement_id IS NULL
              AND r2.ward_id IS NULL
              AND r2.subcounty_id IS NOT NULL
            ORDER BY r2.id, pl.id
          ) pick
          WHERE r.id = pick.report_id;
        `,
        { transaction }
      );

      // project + county
      await sequelize.query(
        `
          UPDATE indicator_category_report r
          SET project_location_id = pick.pl_id
          FROM (
            SELECT DISTINCT ON (r2.id)
              r2.id AS report_id,
              pl.id AS pl_id
            FROM indicator_category_report r2
            JOIN project_location pl
              ON pl.project_id = r2.project_id
             AND pl.county_id = r2.county_id
             AND pl.subcounty_id IS NULL
             AND pl.ward_id IS NULL
             AND pl.settlement_id IS NULL
            WHERE r2.project_location_id IS NULL
              AND r2.project_id IS NOT NULL
              AND r2.settlement_id IS NULL
              AND r2.ward_id IS NULL
              AND r2.subcounty_id IS NULL
              AND r2.county_id IS NOT NULL
            ORDER BY r2.id, pl.id
          ) pick
          WHERE r.id = pick.report_id;
        `,
        { transaction }
      );

      // Fill missing geo ids from the linked project_location row
      await sequelize.query(
        `
          UPDATE indicator_category_report r
          SET
            county_id = COALESCE(r.county_id, pl.county_id),
            subcounty_id = COALESCE(r.subcounty_id, pl.subcounty_id),
            ward_id = COALESCE(r.ward_id, pl.ward_id),
            settlement_id = COALESCE(r.settlement_id, pl.settlement_id)
          FROM project_location pl
          WHERE r.project_location_id = pl.id
            AND (
              r.county_id IS NULL
              OR r.subcounty_id IS NULL
              OR r.ward_id IS NULL
              OR r.settlement_id IS NULL
            );
        `,
        { transaction }
      );
    });

    const [[{ missing_pl_after }]] = await sequelize.query(`
      SELECT COUNT(*)::int AS missing_pl_after
      FROM indicator_category_report
      WHERE project_location_id IS NULL
        AND project_id IS NOT NULL;
    `);

    console.log(`[060] Reports still missing project_location_id after backfill: ${missing_pl_after}`);
  },

  down: async () => {
    // Non-destructive data backfill; no rollback.
  },
};
