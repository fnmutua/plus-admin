const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'indicator_category_report',

    {
       indicator_category_id: {
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

      ward_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      programme_implementation_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
 
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      period: {
        type: DataTypes.STRING,
        allowNull: true
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL,
        allowNull: false
      },  
      
      documentation: {
        type: DataTypes.STRING,
        allowNull: true
      },  
     
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }, 
      
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "New",   // Approved, Rejected 
      },
      reject_msg: {
        type: DataTypes.STRING,
        allowNull: true
      }, 

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
   
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true
      },  
      
    },
    {
      sequelize,
      tableName: 'indicator_category_report',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'indicator_category_report_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        }
       
      ]
    }
  )
}
