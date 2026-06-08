'use strict';

/**
 * Add male/female population counts to settlement (current-year demographic fields).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const colName of ['pop_male', 'pop_female']) {
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
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    for (const colName of ['pop_female', 'pop_male']) {
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
