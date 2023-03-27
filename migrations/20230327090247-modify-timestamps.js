module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();

    console.log(tables)
    const modifyTables = tables.map(async (table) => {
      await queryInterface.addColumn(table, 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
      await queryInterface.addColumn(table, 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    });

    await Promise.all(modifyTables);
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();

    const modifyTables = tables.map(async (table) => {
      await queryInterface.changeColumn(table, 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
      });
      await queryInterface.changeColumn(table, 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
      });
    });

    await Promise.all(modifyTables);
  },
};
