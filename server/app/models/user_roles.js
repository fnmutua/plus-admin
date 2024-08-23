const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_roles', {
    roleid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    location_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    location_id: {
      type: DataTypes.STRING,
      allowNull: true,
    }

  }, {
    sequelize,
    tableName: 'user_roles',
    schema: 'public',
    indexes: [
      {
        name: "user_roles_pkey",
        unique: true,
        fields: [
          { name: "roleid" },
          { name: "userid" },
        ]
      },
    ]
  });
};
