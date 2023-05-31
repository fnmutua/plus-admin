const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sewer', {
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


    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    
 

    pipe_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pipe_size: {
      type: DataTypes.STRING,
      allowNull: true
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    provider_category: {
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


   
    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },


    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },
 
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true
    }, 
 
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'sewer',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "sewer_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: 'sewer_code',
        unique: true,
        fields: [{ name: 'code' }]
      }
    ]
  });
};
