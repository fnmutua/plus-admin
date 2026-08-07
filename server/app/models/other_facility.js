const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('other_facility', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
   
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
  
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ownership_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },

    settlement_id: {
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

    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },
    
     code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'other_facility',
    schema: 'public',
    timestamps: true,
    
  });
};
