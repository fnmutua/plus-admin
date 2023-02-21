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

    ownership_type: {
      type: DataTypes.STRING,
      allowNull: false
    },

    owner: {
      type: DataTypes.STRING,
      allowNull: false
    },


    length: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    number_connections: {
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
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'sewer',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "sewer_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
