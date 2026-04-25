'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const requestedCountyExists = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'data_request'
          AND column_name = 'requested_county'
      );
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!requestedCountyExists[0].exists) {
      await queryInterface.addColumn('data_request', 'requested_county', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
    }

    const requestedSubcountyExists = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'data_request'
          AND column_name = 'requested_subcounty'
      );
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!requestedSubcountyExists[0].exists) {
      await queryInterface.addColumn('data_request', 'requested_subcounty', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('data_request', 'requested_subcounty');
    } catch {
      /* ignore */
    }

    try {
      await queryInterface.removeColumn('data_request', 'requested_county');
    } catch {
      /* ignore */
    }
  }
};
