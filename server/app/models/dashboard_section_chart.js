const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('dashboard_section_chart', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    dashboard_section_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
   
    description: {
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

    categorized: {
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
    tableName: 'dashboard_section_chart',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "dashboard_section_chart_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        unique: true,
        fields: ['title', 'dashboard_section_id',  'description' ]
      },
    ]
  });
};
