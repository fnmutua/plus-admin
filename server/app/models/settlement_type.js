const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('settlement_type', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'settlement_type',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "settlement_type_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
