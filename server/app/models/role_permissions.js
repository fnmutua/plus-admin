module.exports = (sequelize, DataTypes) => {
  return sequelize.define('role_permissions', {
    roleid: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    permissionid: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: false,
   });
}; 