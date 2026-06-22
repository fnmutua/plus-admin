'use strict';

/** Optional string config on module_settings (e.g. auth_max_devices = "5"). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [row] = await queryInterface.sequelize.query(
      `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'module_settings'
            AND column_name = 'config_value'
        ) AS exists;
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!row?.exists) {
      await queryInterface.addColumn('module_settings', 'config_value', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: 'Optional config payload (e.g. numeric limits as string)'
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('module_settings', 'config_value').catch(() => {});
  }
};
