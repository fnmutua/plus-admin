const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('stream', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    width: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    geom: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'stream',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "stream_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
