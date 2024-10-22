const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (sequelize) {
  return sequelize.define(
    'grievance',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
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
      settlement_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      // Complainant details
      name: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      age: {
        type: DataTypes.STRING,
        allowNull: true
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true
      },
      national_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      // Grievance details
      nature: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isgbv: {
        type: DataTypes.BOOLEAN, // Assuming this is a string; use BOOLEAN if it's a true/false field
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
     
 
      current_level: {
        type: DataTypes.STRING,
        allowNull: false,
       
      }, 


      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      plea: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      witness: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      self_reported: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // Use 'true' as a string if this is meant to be a string.
      },

      reporter_name: {
        type: DataTypes.STRING,
        allowNull: true
      },

      reporter_phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
            
      witness_statement: {
        type: DataTypes.STRING,
        allowNull: true
      },
      witness_phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      date_reported: {
        type: DataTypes.DATE,
        allowNull: true
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      pcode: {
        type: DataTypes.STRING,
        allowNull: true,
         
      }

    },
    {
      sequelize,
      tableName: 'grievance',
      schema: 'public',
      timestamps: true,
      indexes: [
        {
          name: 'grievance_pkey',
          unique: true,
          fields: [{ name: 'id' }]
        },
        {
          unique: true,
          fields: ['description', 'settlement_id', 'age', 'gender','phone']
        }
      ]
    }
  );
};
