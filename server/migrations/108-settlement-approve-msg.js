'use strict';

/**
 * Store an optional note when a settlement is approved.
 *
 * Rejection already has reject_msg. Approval previously wrote no comment, so
 * reviewers could not leave a reason for the record. approve_msg is nullable:
 * existing approved rows stay without a note.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { tableName: 'settlement', schema: 'public' };
    const columns = await queryInterface.describeTable(table);

    if (!columns.approve_msg) {
      await queryInterface.addColumn(table, 'approve_msg', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional note left when the settlement was approved',
      });
    }
  },

  down: async (queryInterface) => {
    const table = { tableName: 'settlement', schema: 'public' };
    await queryInterface.removeColumn(table, 'approve_msg').catch(() => {});
  },
};
