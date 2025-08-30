const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatMessageStatus = sequelize.define('ChatMessageStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    message_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chat_messages',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('delivered', 'read'),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'chat_message_status',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['message_id', 'user_id']
      }
    ]
  });

  return ChatMessageStatus;
};
