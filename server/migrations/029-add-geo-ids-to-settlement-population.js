'use strict';

/**
 * Denormalize county / subcounty / ward onto settlement_population so dashboard
 * chart filters (county_id, subcounty_id, ward_id) work without joining settlement.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columnExists = async (columnName) => {
      const [row] = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'settlement_population'
              AND column_name = '${columnName}'
          ) AS exists;
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Boolean(row?.exists);
    };

    if (!(await columnExists('county_id'))) {
      await queryInterface.addColumn('settlement_population', 'county_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'county', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    if (!(await columnExists('subcounty_id'))) {
      await queryInterface.addColumn('settlement_population', 'subcounty_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'subcounty', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    if (!(await columnExists('ward_id'))) {
      await queryInterface.addColumn('settlement_population', 'ward_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'ward', key: 'id' },
        onDelete: 'SET NULL',
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE settlement_population sp
      SET county_id = s.county_id,
          subcounty_id = s.subcounty_id,
          ward_id = s.ward_id
      FROM settlement s
      WHERE s.id = sp.settlement_id
        AND (
          sp.county_id IS DISTINCT FROM s.county_id
          OR sp.subcounty_id IS DISTINCT FROM s.subcounty_id
          OR sp.ward_id IS DISTINCT FROM s.ward_id
        )
    `);

    const indexExists = async (indexName) => {
      const [row] = await queryInterface.sequelize.query(
        `
          SELECT EXISTS (
            SELECT FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = 'settlement_population'
              AND indexname = '${indexName}'
          ) AS exists;
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );
      return Boolean(row?.exists);
    };

    if (!(await indexExists('settlement_population_county_id_idx'))) {
      await queryInterface.addIndex('settlement_population', ['county_id'], {
        name: 'settlement_population_county_id_idx',
      });
    }
    if (!(await indexExists('settlement_population_subcounty_id_idx'))) {
      await queryInterface.addIndex('settlement_population', ['subcounty_id'], {
        name: 'settlement_population_subcounty_id_idx',
      });
    }
    if (!(await indexExists('settlement_population_ward_id_idx'))) {
      await queryInterface.addIndex('settlement_population', ['ward_id'], {
        name: 'settlement_population_ward_id_idx',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('settlement_population', 'settlement_population_ward_id_idx').catch(() => {});
    await queryInterface.removeIndex('settlement_population', 'settlement_population_subcounty_id_idx').catch(() => {});
    await queryInterface.removeIndex('settlement_population', 'settlement_population_county_id_idx').catch(() => {});
    await queryInterface.removeColumn('settlement_population', 'ward_id').catch(() => {});
    await queryInterface.removeColumn('settlement_population', 'subcounty_id').catch(() => {});
    await queryInterface.removeColumn('settlement_population', 'county_id').catch(() => {});
  },
};
