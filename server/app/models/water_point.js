const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('water_point', {
    
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
   
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    capacity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    depth: {
      type: DataTypes.INTEGER,
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
    catchment: {
      type: DataTypes.STRING,
      allowNull: true
    },
 
  price: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
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
 

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
 
 

    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },

  }, {
    sequelize,
    tableName: 'water_point',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "water_facility_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
