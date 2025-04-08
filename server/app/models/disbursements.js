const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('disbursement', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

   amount: {
      type: DataTypes.STRING,
      allowNull: false
    },

    disbursement_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    certificate: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.STRING,
      allowNull: false
    },

     code: {
      type: DataTypes.STRING,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'disbursement',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "disbursement_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
