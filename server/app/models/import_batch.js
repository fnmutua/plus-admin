const Sequelize = require('sequelize')

// One bulk import. Kept off db.models on purpose: the generic data endpoints
// and the QGIS entity list must not be able to read or edit the ledger.
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'import_batch',
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      source: {
        type: DataTypes.STRING(60),
        allowNull: true
      },
      label: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      // active | partially_reverted | reverted
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'active'
      },
      insertedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      updatedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      failedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdByName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      revertedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      revertedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      revertedByName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    },
    {
      sequelize,
      tableName: 'import_batch',
      schema: 'public',
      timestamps: true
    }
  )
}
