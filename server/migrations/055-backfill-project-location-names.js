'use strict';

/** Backfill empty project_location.location_name from linked admin units. */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE project_location pl
      SET location_name = s.name
      FROM settlement s
      WHERE pl.settlement_id = s.id
        AND (pl.location_name IS NULL OR TRIM(pl.location_name) = '');
    `);

    await queryInterface.sequelize.query(`
      UPDATE project_location pl
      SET location_name = w.name
      FROM ward w
      WHERE pl.ward_id = w.id
        AND pl.settlement_id IS NULL
        AND (pl.location_name IS NULL OR TRIM(pl.location_name) = '');
    `);

    await queryInterface.sequelize.query(`
      UPDATE project_location pl
      SET location_name = sc.name
      FROM subcounty sc
      WHERE pl.subcounty_id = sc.id
        AND pl.ward_id IS NULL
        AND pl.settlement_id IS NULL
        AND (pl.location_name IS NULL OR TRIM(pl.location_name) = '');
    `);

    await queryInterface.sequelize.query(`
      UPDATE project_location pl
      SET location_name = c.name
      FROM county c
      WHERE pl.county_id = c.id
        AND (pl.location_name IS NULL OR TRIM(pl.location_name) = '');
    `);
  },

  down: async () => {
    // Non-destructive data backfill; no rollback.
  },
};
