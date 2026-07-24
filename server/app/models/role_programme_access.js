module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'role_programme_access',
    {
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      programme_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'role_programme_access',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
