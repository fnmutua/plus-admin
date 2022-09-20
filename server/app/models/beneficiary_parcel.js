const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('beneficiary_parcel', {
    beneficiary_id: {
       type: DataTypes.INTEGER,
      allowNull: false
    },
    parcel_id: {
       type: DataTypes.INTEGER,
      allowNull: false
    },
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'beneficiary_parcel',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "beneficiary_parcel_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
