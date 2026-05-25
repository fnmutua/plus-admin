'use strict';

/**
 * Align settlement admin-unit columns with the Sequelize model so sync/index
 * creation succeeds on databases that were created without county_id.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = [
      {
        name: 'subcounty_id',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
      },
      {
        name: 'ward_id',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
      },
      {
        name: 'county_id',
        definition: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
      },
    ];

    for (const col of columns) {
      const colExists = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'settlement'
              AND column_name = '${col.name}'
          );
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!colExists[0].exists) {
        await queryInterface.addColumn('settlement', col.name, col.definition);
      }
    }

    // Backfill county_id from ward, then subcounty where still null.
    await queryInterface.sequelize.query(`
      UPDATE settlement s
      SET county_id = w.county_id
      FROM ward w
      WHERE s.ward_id = w.id
        AND s.county_id IS NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE settlement s
      SET county_id = sc.county_id
      FROM subcounty sc
      WHERE s.subcounty_id = sc.id
        AND s.county_id IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS settlement_name_subcounty_id_county_id
      ON settlement (name, subcounty_id, county_id);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS settlement_name_subcounty_id_county_id;
    `);

    for (const colName of ['county_id', 'ward_id', 'subcounty_id']) {
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
    }
  },
};
