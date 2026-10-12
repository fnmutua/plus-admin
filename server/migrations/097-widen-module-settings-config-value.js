'use strict';

/**
 * Widen module_settings.config_value from VARCHAR(255) to TEXT.
 *
 * AI provider API keys may now be set from the AI Settings page. They are
 * stored encrypted, and the ciphertext of a long key (OpenAI project keys run
 * past 160 characters) does not fit in 255.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      { tableName: 'module_settings', schema: 'public' },
      'config_value',
      { type: Sequelize.TEXT, allowNull: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Narrowing back would truncate stored credentials, so drop them first.
    await queryInterface.sequelize.query(
      `UPDATE module_settings SET config_value = NULL, enabled = false
        WHERE config_value LIKE 'enc.v1:%'`
    );
    await queryInterface.changeColumn(
      { tableName: 'module_settings', schema: 'public' },
      'config_value',
      { type: Sequelize.STRING(255), allowNull: true }
    );
  },
};
