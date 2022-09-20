const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('county', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
      type: DataTypes.GEOMETRY('POLYGON', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'county',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "county_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
