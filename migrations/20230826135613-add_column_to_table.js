'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
 

    await queryInterface.addColumn('settlement', 'surveyed', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('settlement', 'landuse', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('settlement', 'near_river', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    await queryInterface.addColumn('settlement', 'on_wayleave', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    await queryInterface.addColumn('settlement', 'on_road_reserve', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });

    await queryInterface.addColumn('settlement', 'development', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('settlement', 'structure_types', {
      type: Sequelize.DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    });

    await queryInterface.addColumn('settlement', 'typical_building_materials', {
      type: Sequelize.DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    });

    await queryInterface.addColumn('settlement', 'avg_dist_between', {
      type: Sequelize.DataTypes.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('settlement', 'encumbrance', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      defaultValue: false,
    });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('settlement', 'surveyed');
    await queryInterface.removeColumn('settlement', 'landuse');
    await queryInterface.removeColumn('settlement', 'near_river');
    await queryInterface.removeColumn('settlement', 'on_wayleave');
    await queryInterface.removeColumn('settlement', 'on_road_reserve');
    await queryInterface.removeColumn('settlement', 'development');
    await queryInterface.removeColumn('settlement', 'structure_types');
    await queryInterface.removeColumn('settlement', 'typical_building_materials');
    await queryInterface.removeColumn('settlement', 'avg_dist_between');
    await queryInterface.removeColumn('settlement', 'encumbrance');
  }
};
