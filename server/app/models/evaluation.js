const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('evaluation', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    findings: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'evaluation',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "evaluation_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
