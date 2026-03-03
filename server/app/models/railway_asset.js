const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('railway_asset', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    railway_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    railway_name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    RA_Name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    RA_Type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    RA_Condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    geom: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'railway_asset',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "railway_asset_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
