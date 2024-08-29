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
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced project is deleted

    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'activity',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced project is deleted

    }
  }, {
    sequelize,
    tableName: 'project_activity',
    schema: 'public',
    timestamps: true,

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
