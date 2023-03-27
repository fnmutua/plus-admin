const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_menu', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    project_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
     code: {
      type: DataTypes.STRING,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'project_menu',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "project_menu_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
