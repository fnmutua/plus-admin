const Sequelize = require('sequelize')

// One record an import inserted or changed. "before" holds the values the
// import replaced (updates only); "after" holds what the import wrote, read
// back from the database so later comparisons see the same representation.
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'import_batch_item',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      record_id: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      // insert | update
      action: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      before: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      after: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      revertedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    },
    {
      sequelize,
      tableName: 'import_batch_item',
      schema: 'public',
      timestamps: true,
      updatedAt: false
    }
  )
}
