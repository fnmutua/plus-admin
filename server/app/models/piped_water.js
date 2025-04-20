const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('piped_water', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    ownership_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },

    name_of_provider: {
      type: DataTypes.STRING,
      allowNull: true
    },

    length: {
      type: DataTypes.FLOAT,
      allowNull: true
    },

    number_connections: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_persons_served: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    isApproved: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Pending'
    },

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    

    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    geom: {
      type: DataTypes.GEOMETRY('MULTILINESTRING', 4326),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'piped_water',
    schema: 'public',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        name: "piped_water_pkey",
        unique: true,
        fields: [{ name: "id" }]
      },
      {
        name: 'piped_code',
        unique: true,
        fields: [{ name: 'code' }]
      }
    ]
  });
};
