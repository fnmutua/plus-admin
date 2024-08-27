const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (sequelize) {
  return sequelize.define(
    'grievance_resolution_level',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
 
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      }
    },
    {
      sequelize,
      tableName: 'grievance_resolution_level',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'grievance_resolution_level_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
         
      ]
    }
  );
};
