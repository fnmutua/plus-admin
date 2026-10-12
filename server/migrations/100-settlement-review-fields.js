'use strict';

/**
 * Record who reviewed a settlement, when, and why it was rejected.
 *
 * The review dialog has always asked for a rejection reason and sent it as
 * reject_msg, but no such column existed, so Sequelize dropped it and the
 * submitter was never told what to fix. settlement_history records that the
 * status changed, not the reason.
 *
 * All three columns are nullable: existing rows keep whatever decision they
 * already carry, with no reviewer recorded.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = { tableName: 'settlement', schema: 'public' };
    const columns = await queryInterface.describeTable(table);

    if (!columns.reject_msg) {
      await queryInterface.addColumn(table, 'reject_msg', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Why the settlement was rejected, shown to the submitter',
      });
    }
    if (!columns.reviewerId) {
      await queryInterface.addColumn(table, 'reviewerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User who approved or rejected the settlement',
      });
    }
    if (!columns.reviewedAt) {
      await queryInterface.addColumn(table, 'reviewedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the approve/reject decision was made',
      });
    }
  },

  down: async (queryInterface) => {
    const table = { tableName: 'settlement', schema: 'public' };
    for (const column of ['reject_msg', 'reviewerId', 'reviewedAt']) {
      await queryInterface.removeColumn(table, column).catch(() => {});
    }
  },
};
