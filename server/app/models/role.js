const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('roles', {
    name: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    subordinates: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
    },
    isactive: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },
  }, {
    // Add a custom name for the model
    // You can use "Role" or any other desired name
    modelName: 'Role',
    // Add timestamps
    timestamps: true,
  
  });
};
