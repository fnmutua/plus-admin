'use strict';

/** IPC disbursement tracking: payment type, status, advance, location snapshot, document link. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('disbursement', 'payment_type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'ipc',
    });
    await queryInterface.addColumn('disbursement', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'submitted',
    });
    await queryInterface.addColumn('disbursement', 'advance_amount', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('disbursement', 'advance_recovered', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('disbursement', 'location_progress_snapshot', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('disbursement', 'document_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'document', key: 'id' },
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('disbursement', 'document_id');
    await queryInterface.removeColumn('disbursement', 'location_progress_snapshot');
    await queryInterface.removeColumn('disbursement', 'advance_recovered');
    await queryInterface.removeColumn('disbursement', 'advance_amount');
    await queryInterface.removeColumn('disbursement', 'status');
    await queryInterface.removeColumn('disbursement', 'payment_type');
  },
};
