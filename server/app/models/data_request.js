const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('data_request', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    // Requester details
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false
    },
    work_area: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mailing_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Data request details
    data_description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    intended_use: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data_classification: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    },
    geographic_scope: {
      type: DataTypes.STRING,
      allowNull: true
    },
    how_data_used: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_shared: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    sharing_details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dissemination_plan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_made_public: {
      type: DataTypes.STRING,
      allowNull: true
    },
    heard_about: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Declaration
    declaration_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    declaration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // Review
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending'
    },
    reviewed_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    review_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'data_request',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: 'data_request_pkey',
        unique: true,
        fields: [{ name: 'id' }]
      },
      {
        name: 'data_request_code_unique',
        unique: true,
        fields: ['code']
      }
    ]
  })
}
