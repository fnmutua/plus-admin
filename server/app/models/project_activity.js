const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_activity', {

   
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'project',
        key: 'id'
      }
    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'activity',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'project_activity',
    schema: 'public',
    indexes: [
      {
        name: "project_activity_pkey",
        unique: true,
        fields: [
          { name: "project_id" },
          { name: "activity_id" },
        ]
      },
    ]
  });
};
