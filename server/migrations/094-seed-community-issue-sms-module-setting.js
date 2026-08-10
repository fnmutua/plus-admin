'use strict';

/** Default SMS toggle for community issue notifications (reporter + admin alerts). */
module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM module_settings WHERE module = 'sms_community_issue' LIMIT 1`
    );
    if (existing.length) {
      return;
    }

    await queryInterface.bulkInsert('module_settings', [
      {
        module: 'sms_community_issue',
        enabled: true,
        description:
          'Enable/disable SMS notifications for community issue reports (reporter confirmation, status updates, admin alerts)',
        config_value: null,
        created_by: null,
        updated_by: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('module_settings', { module: 'sms_community_issue' });
  },
};
