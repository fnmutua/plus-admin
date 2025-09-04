'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('logs', 'loginTime', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Time when user logged in (for session duration calculation)'
    });

    await queryInterface.addColumn('logs', 'logoutTime', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Time when user logged out'
    });

    await queryInterface.addColumn('logs', 'sessionDuration', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Session duration in seconds'
    });

    await queryInterface.addColumn('logs', 'sessionDurationFormatted', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Session duration in human readable format (e.g., "2h 30m 15s")'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('logs', 'loginTime');
    await queryInterface.removeColumn('logs', 'logoutTime');
    await queryInterface.removeColumn('logs', 'sessionDuration');
    await queryInterface.removeColumn('logs', 'sessionDurationFormatted');
  }
};
