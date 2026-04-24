module.exports = function (sequelize, DataTypes) {
  return sequelize.define('data_request_document', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    data_request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'data_request', key: 'id' }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    format: {
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // true = auto-generated PDF by backend on submission; false = admin upload
    auto_generated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'data_request_document',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'data_request_document_pkey', unique: true, fields: ['id'] },
      { name: 'data_request_document_req_idx', fields: ['data_request_id'] }
    ]
  })
}
