const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('settlement_uploads', {

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
      allowNull: false
    },

    file_path: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true

    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    group: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    
  }, {
    sequelize,
    tableName: 'settlement_uploads',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "settlement_uploads_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
