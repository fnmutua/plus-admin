module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'document_link',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      document_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'document_link',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['document_id', 'entity_type', 'entity_id']
        },
        {
          fields: ['entity_type', 'entity_id']
        }
      ]
    }
  )
}
