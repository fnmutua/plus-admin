'use strict';

/** Per-site physical progress for multi-location contracts (IPC consent memos). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('project_location', 'physical_progress_pct', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('project_location', 'commencement_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('project_location', 'revised_completion_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('project_location', 'revised_completion_date');
    await queryInterface.removeColumn('project_location', 'commencement_date');
    await queryInterface.removeColumn('project_location', 'physical_progress_pct');
  },
};
