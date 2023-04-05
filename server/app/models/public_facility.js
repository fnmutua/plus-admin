const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('public_facility', {
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
    facility_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

   
    county_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },


    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },



    geom: {
      type: DataTypes.STRING,
      allowNull: false
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
    ownership: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
    },
  }, {
    sequelize,
    tableName: 'public_facility',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "public_facility_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
