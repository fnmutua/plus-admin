'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const colExists = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_roles'
          AND column_name = 'expires_at'
      );
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!colExists[0].exists) {
      await queryInterface.addColumn('user_roles', 'expires_at', {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When set, this role assignment no longer grants access after this instant (UTC).',
      });
    }

    const indexExists = await queryInterface.sequelize.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_roles_expires_at_idx'
          AND n.nspname = 'public'
      );
    `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!indexExists[0].exists) {
      await queryInterface.addIndex('user_roles', ['expires_at'], {
        name: 'user_roles_expires_at_idx',
      });
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeIndex('user_roles', 'user_roles_expires_at_idx');
    } catch {
      /* ignore */
    }
    await queryInterface.removeColumn('user_roles', 'expires_at');
  },
};
