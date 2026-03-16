'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add county_id column only if it does not already exist
    const colExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'climate_assessment' 
          AND column_name = 'county_id'
      );
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!colExists[0].exists) {
      await queryInterface.addColumn(
        'climate_assessment',
        'county_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'county', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }
      );
    }

    // Backfill county_id from the linked settlement
    await queryInterface.sequelize.query(`
      UPDATE climate_assessment ca
      SET county_id = s.county_id
      FROM settlement s
      WHERE ca.settlement_id = s.id
        AND ca.county_id IS NULL
    `);

    // Add index only if it does not already exist
    const indexExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'climate_assessment_county_id_idx'
          AND n.nspname = 'public'
      );
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!indexExists[0].exists) {
      await queryInterface.addIndex('climate_assessment', ['county_id'], {
        name: 'climate_assessment_county_id_idx',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('climate_assessment', 'climate_assessment_county_id_idx');
    await queryInterface.removeColumn('climate_assessment', 'county_id');
  },
};
