const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('module_settings', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Module name (e.g., sms_grievance_county, sms_grievance_national, sms_incident_county, sms_incident_national, sms_auth, sms_user, sms_feedback, etc.)'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the module feature is enabled'
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Description of what this setting controls'
    },
    config_value: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Optional config payload (e.g. numeric limits as string)'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User who created this setting'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User who last updated this setting'
    }
  }, {
    sequelize,
    tableName: 'module_settings',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "module_settings_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "module_settings_module_unique",
        unique: true,
        fields: [
          { name: "module" },
        ]
      },
    ]
  });
};

