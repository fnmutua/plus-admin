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
        allowNull: true
      },

      
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
    
      activity_id: {
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

      project_location_id: {
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
      
      target: {
        type: DataTypes.DECIMAL,
        allowNull: true
      },
      progress: {
        type: DataTypes.DECIMAL,
        allowNull: false
      }, 
 
     
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "New",   // Approved, Rejected 
      },


      comments: {
        type: DataTypes.STRING,
        allowNull: true
      }, 

         
      documentation: {
        type: DataTypes.STRING,
        allowNull: true
      },  
     
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
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
      
    
      cumProgress: {
        type: DataTypes.DECIMAL,
        allowNull: true
      },
      cumAmount: {
        type: DataTypes.DECIMAL,
        allowNull: true
      },

      geom: {
        type: DataTypes.GEOMETRY('Geometry', 4326),
        allowNull: true
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
        },
        {
          name: 'indicator_category_report_composite_key',
          unique: true,
          fields: [
            { name: 'indicator_category_id' },
            { name: 'programme_implementation_id' },
            { name: 'settlement_id' },
            { name: 'project_location_id' },
            { name: 'amount' },
            { name: 'project_location_id' },
           ],
        },
       
      ]

      
    }
  )
}
