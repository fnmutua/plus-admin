const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_location', {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'project',
        key: 'id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allowing null as `location_id` can be optional
    },
    location_type: {
      type: DataTypes.STRING,
      allowNull: true, // Allowing null as this can be optional
      validate: {
        isIn: [['county', 'subcounty','ward', 'settlement']] // Validating that it can only be one of the predefined types
      }
    }
  }, {
    sequelize,
    tableName: 'project_location',
    schema: 'public',
    indexes: [
      {
        name: "project_location_pkey",
        unique: true,
        fields: [
          { name: "project_id" },
          { name: "location_id" },
          { name: "location_type" },
        ]
      },
    ]
  });
};
