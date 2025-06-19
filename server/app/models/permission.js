module.exports = (sequelize, DataTypes) => {
  return sequelize.define('permissions', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    modelName: 'Permission'
  });
}; 