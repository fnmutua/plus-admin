const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
const { QueryTypes } = require('sequelize')
const op = Sequelize.Op
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

 



exports.sumModelByColumn= async (req, res) => {
  var reg_model = req.body.model
 
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
 // var groupField = req.body.groupField[0]


  console.log('Summarizing Model by Column:', reg_model, ' by ', summaryField)
 
   let groupfields  = []
  if (req.body.groupField.length > 0) {
    
    for (let i = 0; i < req.body.groupField.length; i++) {
      let field = req.body.groupField[i]
      groupfields.push(field)
    }
    
    console.log("groupfields, ",groupfields)

    var qry = {
      attributes: [...groupfields, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      group: [...groupfields],
      raw: true
    }
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
          result = (response)
        })
       
      }
      res.status(200).send({
        fromCache: isCached,
        cache_key: req.body.cache_key,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      console.log('Summary Error Failed ---->:', error)
      res.status(500).send({
        message: 'Fetching ----> data failed' + req.body.cache_key
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
  var reg_model = req.body.model
  var groupField = req.body.groupField
  var assoc_model = db.models[req.body.assoc_model[0]]

  console.log('-------------------------------------------------------------------------------')
  console.log('----------------------Sum Multiple---------------------------------------------')
 
  let result;
  let isCached = false;
 
 
  if (req.body.cache_key && req.body.cache_key != '') {
    var cache_key = req.body.model + req.body.cache_key 

    try {
      const cacheResults = await redisClient.get(cache_key);
      console.log('cahed>>>>>>>>>>>>>>>>>>>>>>>>', cacheResults)
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
        console.log('using cached daata{{{{{{{{{{{{{{{{{')
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
        query += ` FROM households`;
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
          .then(async results => {
            await redisClient.set(cache_key, JSON.stringify(results), {
              EX: 3600,  // 1hour 
              NX: true,
            });
            //  console.log('KEY--hh-899->',results )

            res.status(200).send({
              fromCache: isCached,
              Total: results,
              code: '0000'
            });
                  
            
          });
      
      }
      console.log('Result....................', result)
    

   
    } catch (error) {
      console.log(error)
      res.status(500).send({
        message: 'Fetching data failed'
      });
    }
  }
   
  else {
    console.log("Summary Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")

    var query = `SELECT `;
    req.body.summaryFields.forEach((field, index) => {
      query += `SUM(${field}) as su_${field}`;
      if (index < req.body.summaryFields.length - 1) query += ', ';
    });
    query += ` FROM households`;


    sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
      .then(async results => {

        res.status(200).send({
          fromCache: isCached,
          Total: results,
          code: '0000'
        });

       });

}
 
}


exports.sumModelAssociatedMultipleModels = async (req, res) => {
   
  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction

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
 
  
  // if (req.body.filterField) {
  //   let filterCol = req.body.filterField
  //   let filterValue = req.body.filterValue
  //  // qry.where = { [filterCol]: { [op.in]:  req.body.filterValue } }  
  //   qry.where = { [filterCol]: { [op.in]:  req.body.filterValue } }  

  // }
  
  
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
  





  // db.models[reg_model]
  // .findAll(qry)
  // .then((result) => {
  //   if (result) {
  //     console.log(result)
  //     // res.status(200).send(result);
  //     res.status(200).send({
  //       Total: result,
  //       code: '0000'
  //     })
  //   }
  // })

  console.log("summary Qyerry - the ", qry)

     
  
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


