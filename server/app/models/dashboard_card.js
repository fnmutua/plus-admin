const { truncateSync } = require('fs');
const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('dashboard_card', {

    dashboard_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    iconColor: {
      type: DataTypes.STRING,
      allowNull: false
    },
    aggregation: {
      type: DataTypes.STRING,
      allowNull: false
    },

    card_model: {
      type: DataTypes.STRING,
      allowNull: true
    },

    card_model_field: {
      type: DataTypes.STRING,
      allowNull: true
    },

    filter_value: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    
    filter_function: {
      type: DataTypes.STRING,
      allowNull: true
    },
    computation: {
      type: DataTypes.STRING,
      allowNull: true
    },

    unique: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
  
  },
    
    {
    sequelize,
    tableName: 'dashboard_card',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "dashboard_card_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
