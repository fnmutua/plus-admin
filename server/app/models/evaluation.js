const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('evaluation', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },

    evaluation_title: {
      type: DataTypes.STRING,
      allowNull: false
    },
 
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },

    evaluators: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false
    },

    reviewer: {
      type: DataTypes.STRING,
      allowNull: true
    },



        // A.	Relevance
        dev_objective_rating: {
          type: DataTypes.DECIMAL,
          allowNull: true
        },

        dev_objective_assessment: {
          type: DataTypes.STRING,
          allowNull: true
        },

        dev_design_rating: {
          type: DataTypes.DECIMAL,
          allowNull: true
        },

        dev_design_assessment: {
          type: DataTypes.STRING,
          allowNull: true
        },

        lessons_relevance: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true
       },
        
       //B.	Effectiveness
       //1. Progress towards the project’s development objective (project purpose) Comments
       progress_project_purpose: {
        type: DataTypes.STRING,
        allowNull: true
        },
          
        output_rating: {
          type: DataTypes.DECIMAL,
          allowNull: true
          }, 
              
              output_evaluation: {
                type: DataTypes.STRING,
                allowNull: true
          },
              
  
            outcome_rating: {
              type: DataTypes.DECIMAL,
              allowNull: true
        }, 
            
          outcome_evaluation: {
            type: DataTypes.STRING,
            allowNull: true
            },
              

       
          do_rating: {
            type: DataTypes.DECIMAL,
            allowNull: true
        },
          
          
          // /5.	Beneficiaries (add rows as needed)
          planned_beneficiairies: {
            type: DataTypes.INTEGER,
            allowNull: true
              },
              actual_beneficiairies: {
                type: DataTypes.INTEGER,
                allowNull: true
            }, 
              
            prop_women_beneficiaries: {
                type: DataTypes.DECIMAL,
                allowNull: true
          }, 
            
            beneficiary_categories: {
              type: DataTypes.ARRAY(DataTypes.STRING),
              allowNull: true
          },
        
            equality_performance: {
              type: DataTypes.STRING,
              allowNull: true
            }, 
            lessons_effectiveness: {
              type: DataTypes.ARRAY(DataTypes.STRING),
              allowNull: true
           },
            additional_outcomes: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true
    },
           
           
          // C. Efficiency
        //   1.	Timeliness
           
        planned_duration: {
          type: DataTypes.INTEGER,
          allowNull: true
        }, 
        actual_duration: {
          type: DataTypes.INTEGER,
          allowNull: true
        }, 
        timeliness_rating: {
          type: DataTypes.DECIMAL,
          allowNull: true
        }, 
        timeliness_assessment: {
          type: DataTypes.STRING,
          allowNull: true
        },
       // 3.	Implementation Progress (IP)
        ip_rating: {
          type: DataTypes.DECIMAL,
          allowNull: true
        }, 
        lessons_efficiency: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true
       },
    
        
    //   D. Sustainability
    //   1.	Financial sustainability
    fs_rating: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }, 
    fs_rating_comment: {
      type: DataTypes.STRING,
      allowNull: true
      },   
        
      //2.	Institutional sustainability and strengthening of capacities.
      inst_sustainability_rating: {
        type: DataTypes.DECIMAL,
        allowNull: true
      }, 
      inst_sustainability_comment: {
        type: DataTypes.STRING,
        allowNull: true
    },  
      
    //    3.	Ownership and sustainability of partnerships
        ownership_sustainability_rating: {
          type: DataTypes.DECIMAL,
          allowNull: true
        }, 
        ownership_sustainability_comment: {
          type: DataTypes.STRING,
          allowNull: true
          },  
      

      //4.	Environmental and social sustainability
      environmental_rating: {
        type: DataTypes.DECIMAL,
        allowNull: true
      }, 
      environmental_rating_comment: {
        type: DataTypes.STRING,
        allowNull: true
        },  
    
      //  5.	Lessons learned related to sustainability.
      lessons_sustainability: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
     },
  

    // Impact
    // 6.	Progress towards achievement of project impact
     
    progress_impact_rating: {
      type: DataTypes.DECIMAL,
      allowNull: true
    }, 
    progress_impact_comment: {
      type: DataTypes.STRING,
      allowNull: true
      },  
  
      lessons_impact: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
     },
  
     overall_rating: {
      type: DataTypes.DECIMAL,
      allowNull: true
      },  
     


    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
 
  }, {
    sequelize,
    tableName: 'evaluation',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "evaluation_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
