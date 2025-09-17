const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('incident_document', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    incident_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'incident',
        key: 'id'
      }
    },
    action_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    format: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    protected_file: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'incident_document',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: 'incident_document_pkey',
        unique: true,
        fields: [ { name: 'id' } ]
      },
      {
        unique: true,
        fields: ['name', 'incident_id']
      }
    ]
  });
};


