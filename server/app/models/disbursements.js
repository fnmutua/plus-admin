const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('disbursement', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

   amount: {
      type: DataTypes.STRING,
      allowNull: false
    },

    disbursement_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    certificate: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.STRING,
      allowNull: false
    },

    payment_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ipc',
      validate: {
        isIn: [['ipc', 'advance', 'final', 'retention']]
      }
    },

    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'submitted',
      validate: {
        isIn: [['draft', 'submitted', 'approved', 'paid']]
      }
    },

    advance_amount: {
      type: DataTypes.BIGINT,
      allowNull: true
    },

    advance_recovered: {
      type: DataTypes.BIGINT,
      allowNull: true
    },

    location_progress_snapshot: {
      type: DataTypes.JSONB,
      allowNull: true
    },

    document_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'document',
        key: 'id'
      }
    },

     code: {
      type: DataTypes.STRING,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'disbursement',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "disbursement_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
