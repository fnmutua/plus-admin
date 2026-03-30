const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'users',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique:true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true
      },

      county_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      organization_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'unspecified'
      },

      country_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isactive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      phone: {
        type: DataTypes.STRING
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        defaultValue: true
      },

      resetPasswordExpires: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
      },

      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      access_reason: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      data_use_description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      photo: {
        type: DataTypes.BLOB,
        allowNull: true
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      timestamps: true,

      tableName: 'users',
      schema: 'public',
      indexes: [
        {
          name: 'users_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
      ]
    }
  )
}
