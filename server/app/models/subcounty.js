const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('subcounty', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    county_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'subcounty',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "subcounty_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
