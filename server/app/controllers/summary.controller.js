const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
const { QueryTypes } = require('sequelize')
const op = Sequelize.Op
const Op = Sequelize.Op
const { authJwt } = require("../middleware");

const redis = require("redis");


const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  operatorsAliases: false,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle
  }
})
 
//First, you define the redisClient variable with the value set to undefined. After that,
 //you define an anonymous self - invoked asynchronous function, which is a function that runs immediately after defining it. 

let redisClient;

(async () => {
 // redisClient = redis.createClient();
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = redis.createClient({url});
  redisClient.on("error", (error) => console.error(`Error : ${error}`));
  await redisClient.connect();
})();


// Cache these two fucntions 
//SimpleSumModelByColumn
//sumModelByColumnAssociated
 

exports.SimpleSumModelByColumn= async (req, res) => {
  var reg_model = req.body.model

 
  
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
 
  console.log('Summarizing:', reg_model, ' by ', summaryField)
  
  var queryFields = {}

  // here filter if the value to filter in that column is provided 
  if (req.body.summaryFieldValue) {
    queryFields[req.body.summaryField] =req.body.summaryFieldValue
    var qry = {
      attributes: [[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      raw: true
    }
    qry.where = queryFields

  } else {
    var qry = {
      attributes: [[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      raw: true
    }
  }


  if (req.body.cache_key && req.body.cache_key != '') {
    
    let result;
    let isCached = false;
  
    try {
      const cacheResults = await redisClient.get(req.body.cache_key );
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
      }
      else {
          await db.models[reg_model].findAll(qry).then(async (response) => {
          await redisClient.set(req.body.cache_key, JSON.stringify(response), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result=(response)
         })
       
      }
      res.status(200).send({
        fromCache: isCached,
        cache_key:req.body.cache_key ,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      console.log('Summary Error Failed ---->:',error)
      res.status(500).send({
        message: 'Fetching ----> data failed' +req.body.cache_key
      });
    }
    
   }

  else {
    console.log("Summary Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")

    db.models[reg_model].findAll(qry).then((list) => {
      res.status(200).send({
        Total: list,
        fromCache: false,
          code: '0000'
      })
    })

}









  
}

exports.nestedSumModelByColumn= async (req, res) => {
  var reg_model = req.body.model
 
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
  var assoc_model = db.models[req.body.assoc_model[0]]
  var groupField = req.body.groupField[0]
  var nestedModels = { model: assoc_model,attributes: [] }
  var qry = {
       attributes: [groupField, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
       include: nestedModels,
       group:[groupField],
      raw: true
  }
 
  
  

  if (req.body.cache_key && req.body.cache_key != '') {
    
    let result;
    let isCached = false;
  
    try {
      const cacheResults = await redisClient.get(req.body.cache_key );
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
      }
      else {
          await db.models[reg_model].findAll(qry).then(async (response) => {
          await redisClient.set(req.body.cache_key, JSON.stringify(response), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result=(response)
         })
       
      }
      res.status(200).send({
        fromCache: isCached,
        cache_key:req.body.cache_key ,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      console.log('Summary Error Failed ---->:',error)
      res.status(500).send({
        message: 'Fetching ----> data failed' +req.body.cache_key
      });
    }
    
   }

  else {
    console.log("Summary Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")

    db.models[reg_model].findAll(qry).then((list) => {
      res.status(200).send({
        Total: list,
        fromCache: false,
          code: '0000'
      })
    })

}

  
}

 



// exports.sumModelByColumn= async (req, res) => {
//   var reg_model = req.body.model
 
//   var summaryField = req.body.summaryField
//   var summaryFunction = req.body.summaryFunction
//  // var groupField = req.body.groupField[0]


//   console.log('Summarizing Model by Column:', reg_model, ' by ', summaryField)
 
//    let groupfields  = []
//   if (req.body.groupField.length > 0) {
    
//     for (let i = 0; i < req.body.groupField.length; i++) {
//       let field = req.body.groupField[i]
//       groupfields.push(field)
//     }
    
//     console.log("groupfields, ",groupfields)

//     var qry = {
//       attributes: [...groupfields, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
//       group: [...groupfields],
//       raw: true
//     }
//   } else {
//     var qry = {
//       attributes: [[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
//       raw: true
//     }

//   }

 
  
 
//   if (req.body.cache_key && req.body.cache_key != '') {
    
//     let result;
//     let isCached = false;
  
//     try {
//       const cacheResults = await redisClient.get(req.body.cache_key );
//       if (cacheResults) {
//         isCached = true;
//         result = JSON.parse(cacheResults);
//       }
//       else {
//         await db.models[reg_model].findAll(qry).then(async (response) => {
//           await redisClient.set(req.body.cache_key, JSON.stringify(response), {
//             EX: 3600,  // 1hour 
//             NX: true,
//           });
//           result = (response)
//         })
       
//       }
//       res.status(200).send({
//         fromCache: isCached,
//         cache_key: req.body.cache_key,
//         Total: result,
//         code: '0000'
//       });
//     } catch (error) {
//       console.log('Summary Error Failed ---->:', error)
//       res.status(500).send({
//         message: 'Fetching ----> data failed' + req.body.cache_key
//       });
//     }
    
//   }

//   else {
//     console.log("Summary Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")

//     db.models[reg_model].findAll(qry).then((list) => {
//       res.status(200).send({
//         Total: list,
//         fromCache: false,
//         code: '0000'
//       })
//     })
//   }
  



// }
exports.sumModelByColumn = async (req, res) => {
  const reg_model = req.body.model;
  const summaryField = req.body.summaryField;
  const summaryFunction = req.body.summaryFunction;
  const groupField = req.body.groupField;
  const filterColumn = req.body.filterColumn;
  const filterValue = req.body.filterValue;

  console.log('Summarizing Model by Column:', reg_model, ' by ', summaryField);

  let qry = {
    attributes: [[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
    raw: true
  };

  if (groupField && groupField.length > 0) {
    qry.attributes = [...groupField, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]];
    qry.group = [...groupField];
  }

  if (filterColumn && filterValue) {
    qry.where = {
      [filterColumn]: filterValue
    };
  }

  if (req.body.cache_key && req.body.cache_key !== '') {
    let result;
    let isCached = false;

    try {
      const cacheResults = await redisClient.get(req.body.cache_key);
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
      } else {
        result = await db.models[reg_model].findAll(qry);
        await redisClient.set(req.body.cache_key, JSON.stringify(result), {
          EX: 3600, // 1 hour
          NX: true
        });
      }

      res.status(200).send({
        fromCache: isCached,
        cache_key: req.body.cache_key,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      console.log('Summary Error Failed ---->:', error);
      res.status(500).send({
        message: 'Fetching data failed' + req.body.cache_key
      });
    }
  } else {
    console.log("Summary Caching...");

    db.models[reg_model].findAll(qry)
      .then((list) => {
        res.status(200).send({
          Total: list,
          fromCache: false,
          code: '0000'
        });
      })
      .catch((error) => {
        console.log('Summary Error Failed ---->:', error);
        res.status(500).send({
          message: 'Fetching data failed'
        });
      });
  }
}



exports.sumModelByColumnAssociated = async (req, res) => {
  var reg_model = req.body.model
 
  var assoc_model1 = db.models[req.body.assoc_model[0]]
  var groupField = req.body.groupField[0]
  var childGroupField = req.body.childGroupField
  //var childGroupField2 = req.body.childGroupField2

  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction

  console.log('Summarizing:',reg_model, ' by ', summaryField)

 

  if (req.body.cache_key && req.body.cache_key != '') {
    
    let result;
    let isCached = false;
  
    try {
      const cacheResults = await redisClient.get(req.body.cache_key );
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
      }
      else {
          await db.models[reg_model].findAll(qry).then(async (response) => {
          await redisClient.set(req.body.cache_key, JSON.stringify(response), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result=(response)
         })
       
      }
      res.status(200).send({
        fromCache: isCached,
        cache_key:req.body.cache_key ,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      console.log('Summary Error Failed ---->:',error)
      res.status(500).send({
        message: 'Fetching ----> data failed' +req.body.cache_key
      });
    }
    
   }

  else {
    console.log("Summary Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")

    db.models[reg_model].findAll(qry).then((list) => {
      res.status(200).send({
        Total: list,
        fromCache: false,
          code: '0000'
      })
    })

}
   

 
}

exports.xsumGroupByMultipleColumns = async (req, res) => {
  var reg_model = req.body.model
   var groupField = req.body.groupField
  var assoc_model = db.models[req.body.assoc_model[0]]

  console.log('-------------------------------------------------------------------------------')
  console.log('----------------------Sum Multiple---------------------------------------------')
 

  if (req.body.cache_key && req.body.cache_key != '') {
    
    let result;
    let isCached = false;
  
    try {
      const cacheResults = await redisClient.get(req.body.cache_key );
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
      }
      else {
          await db.models[reg_model].findAll(qry).then(async (response) => {
          await redisClient.set(req.body.cache_key, JSON.stringify(response), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result=(response)
         })
       
      }
      res.status(200).send({
        fromCache: isCached,
        cache_key:req.body.cache_key ,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      console.log('Summary Error Failed ---->:',error)
      res.status(500).send({
        message: 'Fetching ----> data failed' +req.body.cache_key
      });
    }
    
   }

  else {
    console.log("Summary Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")

    db.models[reg_model].findAll(qry).then((list) => {
      res.status(200).send({
        Total: list,
        fromCache: false,
          code: '0000'
      })
    })

}
  
   

 
}


exports.sumGroupByMultipleColumns = async (req, res) => {
  console.log('-------------------------------------------------------------------------------');
  console.log('----------------------Sum Multiple---------------------------------------------');

  let result;
  let isCached = false;
  var filters = req.body.filters || [];
  var values = req.body.filterValues || [];

  if (req.body.cache_key && req.body.cache_key !== '') {
    var cache_key = req.body.model + req.body.cache_key;

    try {
      const cacheResults = await redisClient.get(cache_key);
      console.log('cached >>>>>>>>>>>>>>>>>>>>>>>>', cacheResults);
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
        console.log('using cached data {{{{{{{{{{{{{{{{{');
        res.status(200).send({
          fromCache: isCached,
          Total: result,
          code: '0000'
        });
      } else {
        var query = `SELECT `;
        req.body.summaryFields.forEach((field, index) => {
          query += `SUM(${field}) as su_${field}`;
          if (index < req.body.summaryFields.length - 1) query += ', ';
        });

        if (filters.length > 0 && values.length > 0) {
          query += ` FROM households WHERE `;

          filters.forEach((filter, index) => {
            query += `${filter} IN (${values[index].join(', ')})`;
            if (index < filters.length - 1) query += ' AND ';
          });
        } else {
          query += ` FROM households `;
        }

        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
          .then(async results => {
            await redisClient.set(cache_key, JSON.stringify(results), {
              EX: 3600,  // 1 hour
              NX: true,
            });

            res.status(200).send({
              fromCache: isCached,
              Total: results,
              code: '0000'
            });
          });
      }

      console.log('Result....................', result);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: 'Fetching data failed'
      });
    }
  } else {
    console.log("Summary Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....");

    var query = `SELECT `;
    req.body.summaryFields.forEach((field, index) => {
      query += `SUM(${field}) as su_${field}`;
      if (index < req.body.summaryFields.length - 1) query += ', ';
    });

    if (filters.length > 0 && values.length > 0) {
      query += ` FROM households WHERE `;

      filters.forEach((filter, index) => {
        query += `${filter} IN (${values[index].join(', ')})`;
        if (index < filters.length - 1) query += ' AND ';
      });
    } else {
      query += ` FROM households `;
    }

    sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
      .then(async results => {
        res.status(200).send({
          fromCache: isCached,
          Total: results,
          code: '0000'
        });
      });
  }
};

exports.sumModelAssociatedMultipleModels = async (req, res) => {


 
  var reg_model = req.body.model;
  var summaryField = req.body.summaryField;
  var summaryFunction = req.body.summaryFunction;
  var calculationType = req.body.calculationType; // 'absolute' or 'proportion'
  var assoc_models = req.body.assoc_models;
  var groupFields = req.body.groupFields;
  var nested_models = req.body.nested_models;
  let operator = req.body.filterOperator?req.body.filterOperator:[];
  let unique_counts = req.body.uniqueCounts?req.body.uniqueCounts:false;
  let operators = [] // to be used to check for unik results

  
  
 // -------------------------------------------------------------------------------
// if (req.body.model == 'settlement') {
  console.log('---------------------Sum unique_counts-----4---',req.body.model,  unique_counts ,'-------------------------------------')

//}

  
  // Build the query based on the parameters
  var qry = {
    attributes: [],
    include: [],
    group: [],
    where: {},
  };


  let groupfields = []
  
  // if (req.body.groupFields) {
  //   for (let i = 0; i < req.body.groupFields.length; i++) {
  //     let field = req.body.groupFields[i]
  //     groupfields.push(field)
  //   }
  // }


  if (req.body.groupFields) {
    for (let i = 0; i < req.body.groupFields.length; i++) {
      let field = req.body.groupFields[i];
      let formattedField;
  
      // Format the date field before pushing it into groupfields
      if (field === "indicator_category_report.createdAt") {
        // Apply TO_CHAR to format the date without the time part
        formattedField = sequelize.literal(`TO_CHAR("indicator_category_report"."createdAt", 'YYYY-MM-DD')`);
        //formattedField = sequelize.fn('date_trunc', 'day', sequelize.col('indicator_category_report.createdAt'));

      } else if(field === "indicator_category_report.date")  {

        formattedField = sequelize.literal(`TO_CHAR("indicator_category_report"."date", 'YYYY-MM-DD')`);

      }
      
      else {
        // Escape and quote the field name to respect capitalization
        formattedField = field
      }
  
      groupfields.push(formattedField);
    }

    


  }
  
  


  // Add group fields to the query if provided
  if (groupFields && Array.isArray(groupFields)) {
    qry.attributes= [...groupfields],
    qry.group= [...groupfields],
    qry.raw=true
    


  }
  else {
    
  //    qry.attributes= [...groupfields,[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      qry.raw=true
   

  }




  // Add summary calculation to the query attributes
  if (summaryField && summaryFunction) {


    // generate querry that has disticnt/unique results 
    if (summaryFunction =='count' && unique_counts ) {
        qry.attributes.push([
        Sequelize.fn(summaryFunction, Sequelize.fn('DISTINCT', Sequelize.col(summaryField))),summaryFunction
      ]);

    } else {
      qry.attributes.push([Sequelize.fn(summaryFunction, Sequelize.col(summaryField)), summaryFunction]);


    }


      
  }

  // Add associated models to the query
  if (assoc_models &&  req.body.assoc_models.length > 0 && Array.isArray(assoc_models) ) {
    assoc_models.forEach(assocModel => {
      qry.include.push({
        model: db.models[assocModel],
        attributes: [],
      });
    });
  }

  // Add nested include models to the query
  if (nested_models &&  req.body.nested_models.length > 0  && Array.isArray(nested_models)) {
    nested_models.forEach(nestedModel => {
      qry.include.push({
        model: db.models[nestedModel.model],
        as: nestedModel.alias,
        attributes: [],
      });
    });
  }

 
 
if (req.body.filterField && req.body.filterValue &&req.body.filterOperator && req.body.filterField.length > 0 && req.body.filterValue.length > 0) {
  let filterCols = req.body.filterField;
  let filterValues = req.body.filterValue;
  let filterOperators = req.body.filterOperator; // Array of filter operators

  if (!Array.isArray(filterCols)) {
    filterCols = [filterCols];
    filterValues = [filterValues];
    filterOperators = [filterOperators];
  }

  const operatorMappings = {
    eq: op.eq,
    gt: op.gt,
    gte: op.gte,
    lt: op.lt,
    lte: op.lte, // Added lte mapping

    // Add more operator mappings as needed
  };

  const filterConditions = [];
  console.log('-----------------------------x--------------------------------',req.body.filterField)

  for (let i = 0; i < filterCols.length; i++) {

    console.log(filterCols[i], filterOperators[i],filterValues[i] )
    const filterCol = filterCols[i];
    const filterVal = filterValues[i];
    const operator = filterOperators[i]; // Get the operator corresponding to the filter field
    // keep a record of the ops in ths querry 
    operators.push(operator)

    if (operator === "all" ) {
      // No filter, retrieve all records for this field
      continue; // Skip adding any condition for this field
    } else {

      console.log('Operator---->S',operator, [operatorMappings[operator]] )

      if (Array.isArray(filterVal)) {
       // const nestedConditions = filterVal.map((nestedVal) => ({ [filterCol]: nestedVal }));
        const nestedConditions = filterVal.map((nestedVal) => ({ [filterCol]: { [operatorMappings[operator]]: nestedVal } }));
  
        filterConditions.push({ [op.or]: nestedConditions });
      } else if (operator !== "all" && operator) {

        filterConditions.push({ [filterCol]: { [operatorMappings[operator]]: filterVal } });
      }
    }

   
  }

  if (filterConditions.length > 0) {
    qry.where = { [op.and]: filterConditions };
  }
  }
  
 
  // console.log('operators',summaryFunction,unique_counts)
  // if (summaryFunction =='count' && unique_counts ) {
  //   console.log("The array contains the string.");
  //   qry.distinct = true; // Add the distinct option to the query

  // } else {
  //   console.log("The array does not contain the string.");
  // }

  

  // if (operator === "all") {
  //   // No filters, retrieve all records
  //   qry.where = {}; // or qry.where = true;
  // }
  console.log("The array contains the string.",qry);

db.models[reg_model].findAll(qry).then(async (list) => {

  let totalValue;
  if (calculationType === 'proportion') {
    const totalCount = await db.models[reg_model].count();
    totalValue = list.map((item) => ({
      ...item,
      [summaryFunction]: item[summaryFunction] / totalCount * 100,
    }));
  } else {
    totalValue = list;
  }


  res.status(200).send({
    Total: totalValue,
    fromCache: false,
      code: '0000'
  })
})

};





exports.dsumModelAssociatedMultipleModels = async (req, res) => {
   
  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
  var calculationType = req.body.calculationType; // 'absolute' or 'proportion'

  let groupfields = []
  
  if (req.body.groupFields) {
    for (let i = 0; i < req.body.groupFields.length; i++) {
      let field = req.body.groupFields[i]
      groupfields.push(field)
    }
    
    console.log("groupfields, ",groupfields)
    console.log("summaryFunction, ",summaryFunction)
    console.log("FilterValues, ",req.body.filterValue)

    var qry = {
      attributes: [...groupfields,[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      group: [...groupfields],
      raw: true
    }
  } else {
    var qry = {
      attributes: [...groupfields,[sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      raw: true
    }

  }

  
  var includeModels = []
  if ( typeof req.body.nested_models !== 'undefined' && Array.isArray(req.body.nested_models) && req.body.nested_models.length > 0 ) {
     var child_model = db.models[req.body.nested_models[0]]
     var grand_child_model = db.models[req.body.nested_models[1]]
  
   var nestedModels = { model: child_model, include: [{ model: grand_child_model,attributes:[]  }], raw: true, nested: true }
  // var nestedModels = { model: child_model, include: grand_child_model, raw: true, nested: true }
   includeModels.push(nestedModels)

  
  } else {
    var nestedModels =[]
 }

  console.log("Checking included models",req.body.assoc_models.length)
  if (req.body.assoc_models.length > 0) {
    // loop through the include models
    for (let i = 0; i < req.body.assoc_models.length; i++) {
      var modelIncl = {}
      modelIncl.model = db.models[req.body.assoc_models[i]]
      modelIncl.raw = false
      modelIncl.nested = false
      modelIncl.attributes=[]
      includeModels.push(modelIncl)
    }
  }

 // console.log(includeModels)
    

  qry.include=includeModels
 
  
  
  // old code without GT filiters 
  
  if (req.body.filterField && req.body.filterValue) {
    let filterCols = req.body.filterField;
    let filterValues = req.body.filterValue;
  
    if (!Array.isArray(filterCols)) {
      filterCols = [filterCols];
      filterValues = [filterValues];
    }
  
    const filterConditions = [];
  
    for (let i = 0; i < filterCols.length; i++) {
      const filterCol = filterCols[i];
      const filterVal = filterValues[i];
  
      if (Array.isArray(filterVal)) {
        const nestedConditions = filterVal.map((nestedVal) => ({ [filterCol]: nestedVal }));
        filterConditions.push({ [op.or]: nestedConditions });
      } else {
        filterConditions.push({ [filterCol]: filterVal });
      }
    }
  
    if (filterConditions.length > 0) {
      qry.where = { [op.and]: filterConditions };
    }
  }

   // testing new filters
  // if (req.body.filterField && req.body.filterValue&& req.body.filterOperator) {
  //   let filterCols = req.body.filterField;
  //   let filterValues = req.body.filterValue;
  //   let filterOperators = req.body.filterOperator;
  
  //   if (!Array.isArray(filterCols)) {
  //     filterCols = [filterCols];
  //     filterValues = [filterValues];
  //     filterOperators = [filterOperators];
  //   }
  
  //   const comparisonOperators = {
  //     eq: op.eq,
  //     gt: op.gt,
  //     lt: op.lt,
  //     lte: op.lte,
  //     gte: op.gte,
  //     // Add other operators and their corresponding Sequelize operators here
  //   };

  //   const filterConditions = [];
  
  //   for (let i = 0; i < filterCols.length; i++) {
  //     const filterCol = filterCols[i];
  //     const filterVal = filterValues[i];
  //     const filterOp = filterOperators[i];
  //   //  console.log(operator)

  //     const operator = comparisonOperators[filterOp];

  
  //     // if (Array.isArray(filterVal)) {
  //     //   const nestedConditions = filterVal.map((nestedVal) => ({ [filterCol]: nestedVal }));
  //     //   filterConditions.push({ [op.or]: nestedConditions });
  //     // } else {
  //     //   filterConditions.push({ [filterCol]: filterVal });
  //     // }
  //     if (Array.isArray(filterVal)) {
  //       // const nestedConditions = filterVal.map((nestedVal) => ({

  //       //   [filterCol]: { [operator]: nestedVal[0] },
  //       // }));

  //       for (const nestedVal of filterVal) {
  //         if (Array.isArray(nestedVal)  && nestedVal.length>1) {
  //           filterConditions.push({ [filterCol]: { [op.or]: nestedVal} });
  //         }
  //         else if (Array.isArray(nestedVal)  && nestedVal.length<2) {
  //           filterConditions.push({ [filterCol]: { [operator]: nestedVal[0]} });
  //         }
  //         else {
  //           filterConditions.push({ [filterCol]: { [operator]: nestedVal } });
  //         }
  //       }

  //     //  filterConditions.push({ [op.or]: nestedConditions });
  //     } else {
  //       filterConditions.push({ [filterCol]: { [operator]: filterVal } });
  //     }

  //   }
  
  //   if (filterConditions.length > 0) {
  //     qry.where = { [op.and]: filterConditions };
  //   }
  // }


  

   
  
  if (req.body.cache_key && req.body.cache_key != '') {
    
    let result;
    let isCached = false;
  
    try {
      const cacheResults = await redisClient.get(req.body.cache_key );
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
      }
      else {
        await db.models[reg_model].findAll(qry).then(async (response) => {
            
          let totalValue;
          if (calculationType === 'proportion') {
            const totalCount = response.reduce((acc, item) => acc + item[summaryFunction], 0);
            totalValue = response.map((item) => ({
              ...item,
              [summaryFunction]: item[summaryFunction] / totalCount * 100,
            }));
          } else {
            totalValue = response;
          }



          await redisClient.set(req.body.cache_key, JSON.stringify(totalValue), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result=(totalValue)
         })
       
      }
      res.status(200).send({
        fromCache: isCached,
        cache_key:req.body.cache_key ,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      console.log('Summary Error Failed ---->:',error)
      res.status(500).send({
        message: 'Fetching ----> data failed' +req.body.cache_key
      });
    }
    
   }

  else {
    console.log("Summary Caching.......................1...")

    db.models[reg_model].findAll(qry).then(async (list) => {

      let totalValue;
      if (calculationType === 'proportion') {
        const totalCount = await db.models[reg_model].count();
        totalValue = list.map((item) => ({
          ...item,
          [summaryFunction]: item[summaryFunction] / totalCount * 100,
        }));
      } else {
        totalValue = list;
      }


      res.status(200).send({
        Total: totalValue,
        fromCache: false,
          code: '0000'
      })
    })

}
  
}

const getSumPerModel = async (model,user) => { 
  var result = await db.models[model].findAll({
    attributes: [     
       [
        sequelize.fn
        (
          "to_char", 
          sequelize.col("createdAt"), 
          'dd/mm/YY'
        ),
        "date",
       ],
       [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: {
      createdBy: user,
    },
    group: [sequelize.literal('date')],
  });

  var dateValueArray = result.map(entry => ({
    date: entry.dataValues.date,
    value: parseInt(entry.dataValues.count)
  }));

  var sorted = dateValueArray.sort((a, b) => new Date(a.date) - new Date(b.date));


  var obj = {}
  obj.model = model
  obj.summary=sorted
  return(obj);
}

exports.appGetSummaryCombined = async (req, res) => { 
   
var summaryModels =['settlement', 'education_facility', 'sewer', 'piped_water', 'water_point', 'road', 'health_facility', 'other_facility']
  
try {
  var results =[]
  for (const model of summaryModels) {
    var count = await getSumPerModel(model, req.body.userId)
    results.push(count)
  }
  console.log(results)

// rearrange such that the dates are all present in each element 

// Extract the data
const models = results

// Find all unique dates
const allDates = new Set();
models.forEach(model => {
  model.summary.forEach(summary => {
    allDates.add(summary.date);
  });
});

// Sort the dates in ascending order
const sortedDates = Array.from(allDates).sort((a, b) => {
  const [dayA, monthA, yearA] = a.split('/');
  const [dayB, monthB, yearB] = b.split('/');

  // Convert the components to numbers
  const dateA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA));
  const dateB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB));

  return dateA - dateB;
});
  
// Reprocess the data
const adjustedData = models.map(model => {
  const summaryDict = {};
  model.summary.forEach(summary => {
    summaryDict[summary.date] = summary.value;
  });

  const adjustedSummary = sortedDates.map(date => {
    return { date, value: summaryDict[date] || 0 };
  });

  return {
    model: model.model,
    summary: adjustedSummary
  };
});

console.log(adjustedData);







  res.status(200).send({
     data: adjustedData,
       code: '0000'
  })
} catch (error) {
 console.log(error)
  res.status(500).send({
    message: 'Getting your data contributions failed. Try again later'  
  });

  }
  

}