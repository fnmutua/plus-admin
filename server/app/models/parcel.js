const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('parcel', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    area_ha: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    parcel_no: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lpdp_no: {
      type: DataTypes.STRING,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
 
    landuse_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    geom: {
      type: DataTypes.GEOMETRY('POLYGON', 4326),
      allowNull: true
    },

  }, {
    sequelize,
    tableName: 'parcel',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "parcel_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
