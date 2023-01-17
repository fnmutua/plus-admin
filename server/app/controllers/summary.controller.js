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

exports.xSimpleSumModelByColumn= (req, res) => {
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

    db.models[reg_model]
    .findAll(qry)
    .then((result) => {
      if (result) {
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: '0000'
        })
      }
    })
}

exports.SimpleSumModelByColumn= async (req, res) => {
  var reg_model = req.body.model
  var cache_key = req.body.model + req.body.cache_key 
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



  let result;
  let isCached = false;

  try {
    const cacheResults = await redisClient.get(cache_key);
    if (cacheResults) {
      isCached = true;
      result = JSON.parse(cacheResults);
    }
    else {
        await db.models[reg_model].findAll(qry).then(async (response) => {
        await redisClient.set(cache_key, JSON.stringify(response), {
          EX: 3600,  // 1hour 
          NX: true,
        });
        result=(response)
       })

     
    }
    res.status(200).send({
      fromCache: isCached,
      cache_key:cache_key,
      Total: result,
      code: '0000'
    });
  } catch (error) {
    res.status(500).send({
      message: 'Fecthing data failed'
    });
  }
  

  
}

exports.nestedSumModelByColumn= async (req, res) => {
  var reg_model = req.body.model
  var cache_key = req.body.model + req.body.cache_key 

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
 // console.log("--groupField-----", qry)
  
 // console.log("-------", qry)


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
  
  
    let result;
    let isCached = false;
  
    try {
      const cacheResults = await redisClient.get(cache_key);
      if (cacheResults) {
        isCached = true;
        result = JSON.parse(cacheResults);
      } else {
       
       await  db.models[reg_model]
        .findAll(qry)
        .then(async (response) => {
          if (response) {
            // res.status(200).send(result);
            console.log('KEY---->',cache_key )
            await redisClient.set(cache_key, JSON.stringify(response), {
              EX: 3600,  // 1hour 
              NX: true,
            });
            result =  response;
          }
        })
      }
      res.status(200).send({
        fromCache: isCached,
        Total: result,
        code: '0000'
      });
    } catch (error) {
      res.status(500).send({
        message: 'Fecthing data failed'
      });
    }
    
  
}



exports.xnestedSumModelByColumn= (req, res) => {
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
 // console.log("--groupField-----", qry)
  
  //console.log("-------", qry)


    db.models[reg_model]
    .findAll(qry)
    .then((result) => {
      if (result) {
        console.log(result)
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: '0000'
        })
      }
    })
}



exports.sumModelByColumn= async (req, res) => {
  var reg_model = req.body.model
  var cache_key = req.body.model + req.body.cache_key 

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
  
  
    
  let result;
  let isCached = false;

  try {
    const cacheResults = await redisClient.get(cache_key);
    if (cacheResults) {
      isCached = true;
      result = JSON.parse(cacheResults);
    } else {
     
     await  db.models[reg_model]
      .findAll(qry)
      .then(async (response) => {
        if (response) {
          // res.status(200).send(result);
          console.log('KEY---->',cache_key )
          await redisClient.set(cache_key, JSON.stringify(response), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result =  response;
        }
      })
    }
    res.status(200).send({
      fromCache: isCached,
      Total: result,
      code: '0000'
    });
  } catch (error) {
    res.status(500).send({
      message: 'Fecthing data failed'
    });
  }
  



}



exports.sumModelByColumnAssociated = async (req, res) => {
  var reg_model = req.body.model
  var cache_key = req.body.model + req.body.cache_key 

  var assoc_model1 = db.models[req.body.assoc_model[0]]
  var groupField = req.body.groupField[0]
  var childGroupField = req.body.childGroupField
  //var childGroupField2 = req.body.childGroupField2

  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction

  console.log('Summarizing:',reg_model, ' by ', summaryField)

 

  let result;
  let isCached = false;

  try {
    const cacheResults = await redisClient.get(cache_key);
    if (cacheResults) {
      isCached = true;
      result = JSON.parse(cacheResults);
    } else {
     
     await  db.models[reg_model]
      .findAll({
        attributes: [ childGroupField,groupField, [Sequelize.fn(summaryFunction, Sequelize.col(childGroupField)), summaryFunction]], 
        include: [{model: assoc_model1,attributes:['name'],nested: true} ],
       group : [childGroupField, groupField],
       order: [['count', 'DESC']],
        raw: true
          })
      .then(async (response) => {
        if (response) {
          // res.status(200).send(result);
          console.log('KEY---->',cache_key )
          await redisClient.set(cache_key, JSON.stringify(response), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result =  response;
        }
      })
    }
    res.status(200).send({
      fromCache: isCached,
      Total: result,
      code: '0000'
    });
  } catch (error) {
    res.status(500).send({
      message: 'Fecthing data failed'
    });
  }
  
  

    // db.models[reg_model]
    // .findAll({
    //   attributes: [ childGroupField,groupField, [Sequelize.fn(summaryFunction, Sequelize.col(childGroupField)), summaryFunction]], 
    //   include: [{model: assoc_model1,attributes:['name'],nested: true} ],
    //  group : [childGroupField, groupField],
    //  order: [['count', 'DESC']],
    //   raw: true
    //     })

    // .then((result) => {
    //   if (result) {
    //     // res.status(200).send(result);
    //     res.status(200).send({
    //       Total: result,
    //       code: '0000'
    //     })
    //   }
    // })

 
}

	

exports.sumModelAssociatedMultipleModels = async (req, res) => {
  
  console.log('xxxxsumModelByColumnAssociated.........')
  var cache_key = req.body.model + req.body.cache_key 

 
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

  
 
  if (req.body.assoc_models.length >1) {
    var nestedModels = { model: db.models[req.body.assoc_models[0]], attributes: [],include: [{ model: db.models[req.body.assoc_models[1]], attributes: [] }] }
 
  } else {
    var nestedModels = { model: db.models[req.body.assoc_models[0]], attributes: []   } 
 

 }


  qry.include=nestedModels
 
  
  if (req.body.filterField) {
    let filterCol = req.body.filterField
    let filterValue = req.body.filterValue
    qry.where = { [filterCol]: { [op.eq]: filterValue } } // Exclude the logged in user returing in the list

  }


  console.log("202020 - the ", qry)


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


     
  let result;
  let isCached = false;

  try {
    const cacheResults = await redisClient.get(cache_key);
    if (cacheResults) {
      isCached = true;
      result = JSON.parse(cacheResults);
      console.log("using cached results",result )
    } else {
     
      await db.models[reg_model]
      .findAll(qry)
      .then(async (response) => {
        if (response) {
          // res.status(200).send(result);
          console.log('KEY---->',cache_key )
          await redisClient.set(cache_key, JSON.stringify(response), {
            EX: 3600,  // 1hour 
            NX: true,
          });
          result =  response;
        }
      })
    }
    res.status(200).send({
      fromCache: isCached,
      Total: result,
      code: '0000'
    });
  } catch (error) {
    res.status(500).send({
      message: 'Fecthing data failed'
    });
  }
  
}