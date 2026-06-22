'use strict';

/** Invalidate JWT sessions issued before force_logout_at (admin force logout). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [row] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'force_logout_at'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!row?.exists) {
      await queryInterface.addColumn('users', 'force_logout_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'force_logout_at').catch(() => {});
  }
};
