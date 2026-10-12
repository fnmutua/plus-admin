const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('settlement_type', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    // The label, and the value stored in settlement.settlement_type. Renaming
    // a type therefore has to rewrite the settlements that use it — see
    // settlementType.controller.
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Stable identifier for code that needs to recognise a type regardless of
    // what it is currently called.
    code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Inactive types stay on existing settlements but are not offered in any picker.
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
