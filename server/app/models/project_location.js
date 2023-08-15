const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_location', {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
       references: {
        model: 'project',
        key: 'id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'county',
        key: 'id'
      }
    },
   
   
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'project_location',
    schema: 'public',
    indexes: [
      {
        name: "project_location_pkey",
        unique: true,
        fields: [
          { name: "project_id" },
          { name: "location_id" },
      
        ]
      },
    ]
  });
};
