const Sequelize = require('sequelize')
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'settlement',
    {
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
      county_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      subcounty_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      ward_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      settlement_type: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      geom: {
        type: DataTypes.GEOMETRY('Geometry', 4326),
        allowNull: true
      },
      area: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      population: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique:true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      pop_density: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },

        parcel_no: {
        type: DataTypes.STRING,
        allowNull: true

       },   
       parcel_owner: {
        type: DataTypes.STRING,
        allowNull: true
      },  
       
      surveyed: {
        type: DataTypes.STRING,
        allowNull: true
      },   
      
      landuse: {
        type: DataTypes.STRING,
        allowNull: true
      },  

      near_river: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue:false
      },   
      on_wayleave: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue:false
      },   
      on_road_reserve: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue:false
      },   
  
      avg_dist_between: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },   
      
      encumbrance: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue:false
      }, 
      
   
      development: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
       }, 
      

 
       structure_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },  
       
       typical_building_materials: {
         type: DataTypes.ARRAY(DataTypes.STRING),
         allowNull: true,
        }, 




       dist_town: {
        type: DataTypes.INTEGER,
        allowNull: true
       },
       dist_trunk: {
        type: DataTypes.INTEGER,
        allowNull: true
       },

       rim_no: {
        type: DataTypes.STRING,
        allowNull: true
       },

      isApproved: {
        type: DataTypes.STRING,
        defaultValue: 'Pending'
      },

      isActive: {
        type: DataTypes.STRING,
        defaultValue: 'true'
      },

      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
  
    },
    {
      sequelize,
      tableName: 'settlement',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'settlement_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          unique: true,
          fields: ['name', 'ward_id','subcounty_id', 'county_id']
        },
  
      ]
    }
  )
}
