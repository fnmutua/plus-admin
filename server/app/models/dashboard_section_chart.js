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

    category: {
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

    card_model: {
      type: DataTypes.STRING,
      allowNull: true
    },

    time_field: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: 'createdAt',
      comment: 'Field used as time axis for line charts (default createdAt)',
    },

    metric_fields: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Numeric fields for multi-variable line chart (type 12)',
    },

    filtered: {
      type: DataTypes.BOOLEAN,
      defaultValue:false
    },

    ignore_empty: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
 
 
    filters: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      allowNull: true
    },

    x_axis: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    y_axis: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    series_field: {
      type: DataTypes.JSONB,
      allowNull: true,
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
