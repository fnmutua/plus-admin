const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sewer', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    condition: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ownership: {
      type: DataTypes.STRING,
      allowNull: true
    },

    pipe_type: {
      type: DataTypes.STRING,
      allowNull: true
    },

    pipe_size: {
      type: DataTypes.STRING,
      allowNull: true
    },

    provider: {
      type: DataTypes.STRING,
      allowNull: true
    },

    provider_category: {
      type: DataTypes.STRING,
      allowNull: true
    },

    length: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },

    number_of_connections: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    number_of_persons_served: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    photo: {
      type: DataTypes.STRING,
      allowNull: true
    },

    settlement_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    settlement_code: {
      type: DataTypes.STRING,
      allowNull: true
    },

    county_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    county_name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    ward_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    subcounty_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    isApproved: {
      type: DataTypes.STRING,
      defaultValue: 'Pending'
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    geom: {
      type: DataTypes.GEOMETRY('MultiLineString', 4326),
      allowNull: true
    },

  }, {
    sequelize,
    tableName: 'sewer',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "sewer_pkey",
        unique: true,
        fields: [{ name: "id" }]
      },
      {
        name: 'sewer_code',
        unique: true,
        fields: [{ name: 'code' }]
      }
    ]
  });
};
