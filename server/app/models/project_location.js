const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_location', {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced project is deleted
    },
    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'ward',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced ward is deleted
    },
    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'settlement',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced settlement is deleted
    },
    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'subcounty',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced subcounty is deleted
    },
    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'county',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced county is deleted
    },
    location_type: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['county', 'subcounty', 'ward', 'settlement']] // Validating that it can only be one of the predefined types
      }
    },
    geom: {
      type: DataTypes.GEOMETRY('Geometry', 4326),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'project_location',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'ward_id', 'settlement_id', 'subcounty_id', 'county_id', 'location_type'],
        name: 'unique_project_location' // Ensure the name matches the migration
      }
    ]
  });
};
