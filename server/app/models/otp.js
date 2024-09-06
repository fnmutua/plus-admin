const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('otp', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
  
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  
    otp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    expires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Valid"
    }
    
  }, {
    sequelize,
    tableName: 'otp',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "otp_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
