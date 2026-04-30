'use strict';

/**
 * Add density-based slum typology field to the settlement table.
 *
 * Per the National Slum Upgrading and Prevention Strategy 2024-2034.
 * Single categorical value chosen by the user, informed by the built-up
 * ratio (built-up area / total settlement area):
 *   LOW DENSITY    : built-up ratio  < 60%
 *   MEDIUM DENSITY : built-up ratio  60% - 80%
 *   HIGH DENSITY   : built-up ratio  > 80%
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colName = 'density_typology';
    const colExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'settlement'
            AND column_name = '${colName}'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!colExists[0].exists) {
      await queryInterface.addColumn('settlement', colName, {
        type: Sequelize.STRING(32),
        allowNull: true,
      });

      await queryInterface.sequelize.query(
        `COMMENT ON COLUMN settlement.${colName} IS 'Density-based slum typology: LOW DENSITY, MEDIUM DENSITY, HIGH DENSITY';`
      );
    }

    // Index for fast filter / group-by queries.
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS settlement_density_typology_idx
      ON settlement (density_typology);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS settlement_density_typology_idx;`
    );

    const colName = 'density_typology';
    const colExists = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'settlement'
            AND column_name = '${colName}'
        );
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (colExists[0].exists) {
      await queryInterface.removeColumn('settlement', colName);
    }
  },
};
