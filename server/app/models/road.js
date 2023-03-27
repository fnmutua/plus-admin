const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('road', {
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
    rdNum: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rdClass: {
      type: DataTypes.STRING,
      allowNull: true
    },
    width: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },


    rdReserve: {
      type: DataTypes.STRING,
      allowNull: true
    },
    surfaceType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    surfaceCondition: {
      type: DataTypes.STRING,
      allowNull: true
    },
    traffic: {
      type: DataTypes.STRING,
      allowNull: true
    },

    direction: {
      type: DataTypes.STRING,
      allowNull: true
    },

    drainage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    drainageCondition: {
      type: DataTypes.STRING,
      allowNull: true
    },


    

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'road',
    schema: 'public',
    timestamps: true,
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
