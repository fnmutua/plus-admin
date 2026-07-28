const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'ipc_document',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      disbursement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'disbursement',
          key: 'id',
        },
      },
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'project',
          key: 'id',
        },
      },
      format: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      protected_file: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'ipc_document',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'ipc_document_pkey',
          unique: true,
          fields: [{ name: 'id' }],
        },
        {
          name: 'ipc_document_name_disbursement_id',
          unique: true,
          fields: ['name', 'disbursement_id'],
        },
      ],
    },
  );
};
