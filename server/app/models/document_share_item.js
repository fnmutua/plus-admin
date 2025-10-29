const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('document_share_item', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    share_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    document_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'document_share_item',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'document_share_item_pkey', unique: true, fields: ['id'] },
      { name: 'document_share_item_share_idx', fields: ['share_id'] },
      { name: 'document_share_item_doc_idx', fields: ['document_id'] }
    ]
  });
};

