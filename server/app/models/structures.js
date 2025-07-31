const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('structures', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    description: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    struct_use: {
      type: DataTypes.STRING,
      allowNull: false
    },
    struct_typology: {
      type: DataTypes.STRING,
      allowNull: false
    },

    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    struct_ownership: {
      type: DataTypes.STRING,
      allowNull: false
    },


    geom: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  }, {
    sequelize,
    tableName: 'structures',
    schema: 'public',
    timestamps: true,
   
  });
};
