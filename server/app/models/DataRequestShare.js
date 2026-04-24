module.exports = function (sequelize, DataTypes) {
  return sequelize.define('data_request_share', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    data_request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'data_request', key: 'id' }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'data_request_share',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'data_request_share_pkey', unique: true, fields: ['id'] },
      { name: 'data_request_share_token_key', unique: true, fields: ['token'] },
      { name: 'data_request_share_req_idx', fields: ['data_request_id'] }
    ]
  })
}
