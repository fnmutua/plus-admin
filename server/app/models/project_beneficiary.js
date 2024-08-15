const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('project_beneficiary', {
    project_location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_location',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced project is deleted
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project',
        key: 'id'
      },
      onDelete: 'CASCADE', // Cascade delete when the referenced ward is deleted
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
    location_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     
    actual_male_ben: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    target_male_ben: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    actual_female_ben: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    target_female_ben: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

  }, {
    sequelize,
    tableName: 'project_beneficiary',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['project_location_id', 'ward_id', 'settlement_id', 'subcounty_id', 'county_id', 'actual_male_ben','actual_female_ben'],
        name: '_unique_project_location' // Ensure the name matches the migration
      }
    ]
  });
};
