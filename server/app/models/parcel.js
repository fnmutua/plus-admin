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
      allowNull: false
    },
    parcel_no: {
      type: DataTypes.STRING,
      allowNull: false
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
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },

  }, {
    sequelize,
    tableName: 'parcel',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "parcel_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },

      {
        unique: true,
        fields: ['parcel_no', 'area_ha', 'settlement_id']
      },


    ]
  });
};
