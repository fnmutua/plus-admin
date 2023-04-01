const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('road_asset', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
     road_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  
    asset_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
  
    asset_condition: {
      type: DataTypes.STRING,
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
    tableName: 'road_asset',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "road_asset_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
