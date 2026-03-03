const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('powerline_asset', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    PA_Name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    PA_Identifier: {
      type: DataTypes.STRING,
      allowNull: true
    },

    PA_Type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    PA_Condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    PA_Rating: {
      type: DataTypes.STRING,
      allowNull: true
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true
    },

    isApproved: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Pending'
    },

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    geom: {
      type: DataTypes.GEOMETRY('LINESTRING', 4326),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'powerline_asset',
    schema: 'public',
    timestamps: true,
    underscored: false,
  });
};
