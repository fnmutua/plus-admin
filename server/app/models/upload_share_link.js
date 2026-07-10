const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('upload_share_link', {
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
    entity_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    },
    maxUploads: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 20
    },
    uploadCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true
    },
    defaultCategory: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    expectedUploaderName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'upload_share_link',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'upload_share_link_pkey', unique: true, fields: ['id'] },
      { name: 'upload_share_link_token_key', unique: true, fields: ['token'] },
      { name: 'upload_share_link_entity_idx', fields: ['entity_type', 'entity_id'] }
    ]
  });
};
