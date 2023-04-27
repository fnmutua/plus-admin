'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.addColumn('settlement', 'parcel_no', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    queryInterface.addColumn('settlement', 'parcel_owner', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    queryInterface.addColumn('settlement', 'dist_town', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    queryInterface.addColumn('settlement', 'dist_trunk', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    queryInterface.addColumn('settlement', 'rim_no', {
      type: Sequelize.STRING,
      allowNull: true
    });
    

  },

  async down (queryInterface, Sequelize) {
    queryInterface.removeColumn('settlement', 'parcel_no');
    queryInterface.removeColumn('settlement', 'parcel_owner');
    queryInterface.removeColumn('settlement', 'dist_town');
    queryInterface.removeColumn('settlement', 'dist_trunk');
    queryInterface.removeColumn('settlement', 'rim_no');
    
  }
};
