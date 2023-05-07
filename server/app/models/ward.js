const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ward', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    county_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'ward',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "ward_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
