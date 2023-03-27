const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('intervention_type', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
    
  }, {
    sequelize,
    tableName: 'intervention_type',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "intervention_type_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
