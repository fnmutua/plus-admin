const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_subcounty', {

    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'project',
        key: 'id'
      }
    },
    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'subcounty',
        key: 'id'
      }
    },
       
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'project_subcounty',
    schema: 'public',
    indexes: [
      {
        name: "project_subcounty_ppkey",
        unique: true,
        fields: [
          { name: "project_id" },
          { name: "subcounty_id" },
        ]
      },
    ]
  });
};
