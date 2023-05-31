const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('piped_water', {
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

    ownership_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },


    length: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },

    number_connections: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },


    ward_id: {
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
 
    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },
 
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
    },

    
  }, {
    sequelize,
    tableName: 'piped_water',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "piped_water_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: 'piped_code',
        unique: true,
        fields: [{ name: 'code' }]
      }
    ]
  });
};
