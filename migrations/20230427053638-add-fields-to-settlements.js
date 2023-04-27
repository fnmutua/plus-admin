'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.addColumn('properties', 'parcel_no', {
      type: Sequelize.STRING,
      allowNull: false
    });
    
    queryInterface.addColumn('properties', 'parcel_owner', {
      type: Sequelize.STRING,
      allowNull: false
    });
    
    queryInterface.addColumn('properties', 'dist_town', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    queryInterface.addColumn('properties', 'dist_trunk', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    queryInterface.addColumn('properties', 'rim_no', {
      type: Sequelize.STRING,
      allowNull: true
    });
    

  },

  async down (queryInterface, Sequelize) {
    queryInterface.removeColumn('properties', 'parcel_no');
    queryInterface.removeColumn('properties', 'parcel_owner');
    queryInterface.removeColumn('properties', 'dist_town');
    queryInterface.removeColumn('properties', 'dist_trunk');
    queryInterface.removeColumn('properties', 'rim_no');
    
  }
};
