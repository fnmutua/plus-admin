const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('powerline', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    PL_Name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    PL_Phases: {
      type: DataTypes.STRING,
      allowNull: true
    },

    PL_Type_of_Supply: {
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
      type: DataTypes.GEOMETRY('GEOMETRY', 4326),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'powerline',
    schema: 'public',
    timestamps: true,
    underscored: false,
     
  });
};
