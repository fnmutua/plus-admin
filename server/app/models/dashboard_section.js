const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('dashboard_section', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
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
    tableName: 'dashboard_section',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "dashboard_section_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        unique: true,
        fields: ['title', 'dashboard_id','description' ]
      },
    ]
  });
};
