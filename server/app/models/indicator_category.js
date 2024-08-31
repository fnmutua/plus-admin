const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator_category',
    {

      indicator_level: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      indicator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      indicator_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
     
      activity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
   
      category_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      frequency: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      
     
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'indicator_category',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'indicator_category_pkey',
          unique: true,
          fields: [{ name: 'id' }],
        },
        {
          name: 'unique_indicator_project_category',
          unique: true,
          fields: [
            { name: 'indicator_level' },
            { name: 'indicator_id' },
            { name: 'category_id' },
            { name: 'frequency' },
           ],
        },
      ],
    }
  );
};
