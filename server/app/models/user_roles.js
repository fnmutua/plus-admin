const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_roles', {

    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    roleid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // primaryKey: false,
      // references: {
      //   model: 'roles',
      //   key: 'id'
      // }
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // primaryKey: false,
      // references: {
      //   model: 'users',
      //   key: 'id'
      // }
    },
    location_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }

  }, {
    sequelize,
    tableName: 'user_roles',
    schema: 'public',
    // indexes: [
    //   {
    //     name: "user_roles_pkey",
    //     unique: true,
    //     fields: [
    //       { name: "roleid" },
    //       { name: "userid" },
    //       { name: "location_level" },
    //       { name: "location_id" },
    //     ]
    //   },
    // ]
  });
};
