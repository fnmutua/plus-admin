const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('road', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    width: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    geom: {
      type: DataTypes.GEOMETRY('POLYGON', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'road',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "road_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
