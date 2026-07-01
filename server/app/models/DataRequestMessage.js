module.exports = function (sequelize, DataTypes) {
  return sequelize.define('data_request_message', {
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
    author_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    author_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    author_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'data_request_message',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'data_request_message_pkey', unique: true, fields: ['id'] },
      { name: 'data_request_message_req_idx', fields: ['data_request_id'] }
    ]
  })
}
