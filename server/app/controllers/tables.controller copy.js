const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
 const op = Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const crypto = require('crypto');
const Activity = db.activity
const {   fn, col, literal } = require("sequelize");

// for enabling storage of files outside public...
const path = require('path')
const fs = require('fs');
const User = db.user;
const redis = require("redis");
const Progress = require('progress');
const { v4: uuidv4 } = require('uuid');

const fuzzball = require('fuzzball'); // Make sure to install this with `npm install fuzzball`

var request = require('request');


const nodemailer = require('nodemailer')
const { authJwt } = require("../middleware");
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
 


getUser = (token) => {
      jwt.verify(token, config.secret, (err, decoded) => {
      console.log("----x-----", token)
     thisUser = User.findOne({
       where: {
         id: decoded.id
       }
     })

     });
  
     return thisUser

 };

exports.allAccess = (req, res) => {
  res.status(200).send('Public Content.')
}


exports.GetRoutes = (req, res) => {
  console.log('Req-body 001', req.body)
   // console.log('nested filters....>', req.body.nested_filter[0])
 
   var reg_model = req.body.model
 
   // Associated Models
   var associated_multiple_models = req.body.associated_multiple_models
   console.log('associated_multiple_models', associated_multiple_models.length)
 
   // nested Models
   // here me limit to two nesting levels only
   var nested_models = req.body.nested_models
   if (req.body.nested_models) {
     var child_model = db.models[req.body.nested_models[0]]
     var grand_child_model = db.models[req.body.nested_models[1]]
     var nestedQuery = {}
 
     // create the criterial for the grandchild 
     if (req.body.nested_filter) {
       nestedQuery[req.body.nested_filter[0]] = req.body.nested_filter[1]
     }
 
   }
 
   var qry = {}
   var includeModels = []
 
   // loop through the include models
   for (let i = 0; i < req.body.associated_multiple_models.length; i++) {
     var modelIncl = {}
     modelIncl.model = db.models[req.body.associated_multiple_models[i]]
     modelIncl.raw = true
     modelIncl.nested = true
     includeModels.push(modelIncl)
 
 
   }
 
   //console.log(includeModels)
   if (associated_multiple_models) {
     if (nested_models) {
       if (req.body.nested_filter) {
         var nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true }
       } else {
         var nestedModels = { model: child_model, include: grand_child_model, raw: true, nested: true }
       }
 
       includeModels.push(nestedModels)
       var qry = {
         include: includeModels
       }
     } else {
       console.log('---no---')
       var qry = {
         include: includeModels
       }
     }
   } else {
     var qry = {}
   }
 
   console.log('The Querry----->', qry)
   if (req.body.limit ) {
     qry.limit = req.body.limit 
   }
   if (req.body.page ) {
     qry.offset = (req.body.page - 1) * req.body.limit
   }
 
 
   var lstQuerries = []
 
 
   if (req.body.filters) {
     if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
 
       for (let i = 0; i < req.body.filters.length; i++) {
         var queryFields = {}
         //queryFields[req.body.filters[i]] = req.body.filterValues[i][j]
         lstQuerries.push(queryFields)
         var lstValues  = []
         for (let j = 0; j < req.body.filterValues[i].length; j++) {
           lstValues.push(req.body.filterValues[i][j])
         }
         queryFields[req.body.filters[i]] = lstValues
         lstQuerries.push(queryFields)
 
       }
     }
     console.log('Final-1-object------------>', lstQuerries)
  
     qry.where = lstQuerries
   }
   console.log('Final-2-object------------>', qry)
 
 
 
 
   // if involving households decryot the HH name
 
 
 
   const searchString = 'households';
   if (associated_multiple_models) {
      console.log(associated_multiple_models)
     if (associated_multiple_models.includes(searchString) ) {
       console.log(`${searchString} is in the array`);
       console.log(qry)
     
               console.log('getting households--1-->')
               var attributes = []
          
               for( let key in   db.models[reg_model].rawAttributes ){
                 attributes.push(key)
             }
             
       
             //   console.log('attributes',attributes)
               var index = attributes.indexOf('name');
               if (index !== -1) {
                   attributes.splice(index, 1);
               }
     
               let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('household.name'), 'bytea'),'***REDACTED***'),'name']
                 attributes.push(encrytpedField)
       
               
       qry.attributes = attributes
       qry.attributes.exclude = ['password', 'resetPasswordExpires', 'resetPasswordToken'] 
      }
  }
   else {
     
     qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] } // will be applciable to users only
 
 }
      
 
 
 
 
 
 
   db.models[reg_model].findAndCountAll(qry).then((list) => {
     res.status(200).send({
       data: list.rows,
       total: list.count,
       code: '0000'
     })
   })
 }


exports.modelBoard = (req, res) => {
  var fields = []
  var reg_model = req.body.model
  console.log('----->Models:', reg_model)
  
  // Find the right Model

  for (let key in db.models[reg_model].rawAttributes) {
    var myObject = {}

    myObject['field'] = key
    myObject['type'] = db.models[reg_model].rawAttributes[key].type.key
    myObject['match']='' 
    fields.push(myObject)
  }

  // console.log(fields)
 
  res.status(200).send({
     data: fields,
     code: '0000'
  })
}

exports.modelRelatives = (req, res) => {
   var reg_model = req.body.model
  
  var relatives = []
  console.log('model',reg_model)

 // const ass = db.models.project.getAssociations();

 var relatives = []
 var relativeKeys = []
 var assoc_models = []
 //const associatedModels = Object.keys( db.models[reg_model].associations).map(key =>  db.models[reg_model].associations[key].target.name);
  const associatedModels = db.models[reg_model].associations;

// iterate over the associations and log the associated models and foreign keys
Object.keys(associatedModels).forEach((key) => {
  const association = associatedModels[key];
  relatives.push(association.target.name)
  relativeKeys.push(association.foreignKey)

  var associatedModel = {}
  associatedModel.model = association.target.name
  associatedModel.key = association.foreignKey
  assoc_models.push(associatedModel)

  console.log(`Associated model: ${association.target.name}, foreign key: ${association.foreignKey}`);
});

  
 console.log(associatedModels)
  


  // console.log(fields)
 
  res.status(200).send({
    data: relatives,
    models :assoc_models,
    keys: relativeKeys,

     code: '0000'
  })
}



exports.modelData = (req, res) => {
  console.log('Include for users......')

  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}
  if (reg_model === 'users') {
    ; (qry.offset = pg_number * limit),
      (qry.limit = limit),
      //  qry.include=[{ model:  db.role, required: true },],
      (qry.order = [['id', sort]])
  } else {
    ; (qry.offset = pg_number * limit), (qry.limit = limit), (qry.order = [['id', sort]])
  }

  console.log('The Querry', qry)
  db.models[reg_model].findAndCountAll({ qry }).then((list) => {
    // console.log(list.rows)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: 20000
    })
  })
}

exports.modelAllData = (req, res) => {
  var reg_model = req.query.model
  // var ass_model = req.query.assocModel
  // console.log("All Data----->")
  var ass_model = db.models[req.query.assocModel]

  //console.log('All Model Data-----> 30/10', req)

  if (ass_model) {
    var includeQuerry = {
      include: [{ model: ass_model }]
    }
  } else {
    var includeQuerry = {}
    console.log('No Associated Model')
  }
  console.log('the Querry', includeQuerry)

  db.models[reg_model].findAndCountAll(includeQuerry).then((list) => {
    //db.models[reg_model].findAndCountAll({}).then(list => {

    //console.log(list.rows)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  })
}


 

exports._modelAllDataNoGeo = (req, res) => {
  var reg_model = req.query.model;
  var field = req.query.searchField;
  var searchKeyword = req.query.searchKeyword;
  var ass_model = db.models[req.query.assocModel];

  var nestedModels = req.query.nested_models; // Comma-separated list of nested models
  var associated_multiple_models = req.query.associated_multiple_models; // Comma-separated list of nested models
   var includeQuery = {};
  var modelsToInclude = [];

  if (req.query.assocModel) {
    var assocModelObject = {
      model: db.models[req.query.assocModel],
      attributes: { exclude: ['geom'] }
    };
    modelsToInclude.push(assocModelObject);
  }

// multiple associated models 
 

if (associated_multiple_models && associated_multiple_models !== '') {
  var modelList = associated_multiple_models.split(',');
  modelList.forEach((assModel) => {
    var assModelObject = {
      model: db.models[assModel],
      attributes: { exclude: ['geom'] }
    };
   // modelsToInclude.push(assModelObject);
   
    if (!modelsToInclude.some((model) => model.model === assModelObject.model)) {
      modelsToInclude.push(assModelObject);
    }

  });
}

  
  
  

  if (nestedModels && nestedModels !== '' ) {
    var nestedModelList = nestedModels.split(',');

    nestedModelList.forEach((nestedModel) => {
      var nestedModelObject = {
        model: db.models[nestedModel],
        attributes: { exclude: ['geom'] }
      };
     // modelsToInclude.push(nestedModelObject);
      if (!modelsToInclude.some((model) => model.model === nestedModelObject.model)) {
        modelsToInclude.push(nestedModelObject);
      }
    });

    modelsToInclude.reduceRight((prevModel, nestedModelObject) => {
      nestedModelObject.include = [prevModel];
      return nestedModelObject;
    });

    includeQuery.include = [modelsToInclude[0]];
  } else {
    console.log('No Nested Models');

    includeQuery.include = modelsToInclude;

    
  }

  includeQuery.attributes = { exclude: ['geom'] };

  //includeQuery.order = [['name', 'ASC'], ['title', 'ASC']]; //sort either by title or name

  
  if (reg_model === 'users') {
    // Exclude password fields if the model is users
    includeQuery.attributes = {
      exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken' ]
    };
  } else {
    includeQuery.attributes = { exclude: ['geom'] };
  }
 

  if (field && searchKeyword && searchKeyword !== '' && field !== '') {
    console.log('Filtered with no GEO');

    includeQuery.where = {
      [field]: Number.isInteger(parseInt(searchKeyword)) ? parseInt(searchKeyword) : { [Op.iLike]: `%${searchKeyword.toLowerCase()}%` }
    };

    db.models[reg_model]
      .findAndCountAll(includeQuery)
      .then((list) => {
        res.status(200).send({
          data: list.rows,
          total: list.count,
          code: '0000'
        });
      });
  } else {
    db.models[reg_model].findAndCountAll(includeQuery).then((list) => {
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: '0000'
      });
    });
  }
};

 

exports.modelAllDataNoGeo = async (req, res) => {
  var reg_model = req.query.model;
  var field = req.query.searchField;
  var searchKeyword = req.query.searchKeyword;
  var ass_model = db.models[req.query.assocModel];

  var nestedModels = req.query.nested_models; // Comma-separated list of nested models
  var associated_multiple_models = req.query.associated_multiple_models; // Comma-separated list of nested models
   var includeQuery = {};
  var modelsToInclude = [];

  if (req.query.assocModel) {
    var assocModelObject = {
      model: db.models[req.query.assocModel],
      attributes: { exclude: ['geom'] }
    };
    modelsToInclude.push(assocModelObject);
  }

// multiple associated models 
 

if (associated_multiple_models && associated_multiple_models !== '') {
  var modelList = associated_multiple_models.split(',');
  modelList.forEach((assModel) => {
    var assModelObject = {
      model: db.models[assModel],
      attributes: { exclude: ['geom'] }
    };
   // modelsToInclude.push(assModelObject);
   
    if (!modelsToInclude.some((model) => model.model === assModelObject.model)) {
      modelsToInclude.push(assModelObject);
    }

  });
}

  

  if (nestedModels && nestedModels !== '' ) {
    var nestedModelList = nestedModels.split(',');

    nestedModelList.forEach((nestedModel) => {
      var nestedModelObject = {
        model: db.models[nestedModel],
        attributes: { exclude: ['geom'] }
      };
     // modelsToInclude.push(nestedModelObject);
      if (!modelsToInclude.some((model) => model.model === nestedModelObject.model)) {
        modelsToInclude.push(nestedModelObject);
      }
    });

    modelsToInclude.reduceRight((prevModel, nestedModelObject) => {
      nestedModelObject.include = [prevModel];
      return nestedModelObject;
    });

    includeQuery.include = [modelsToInclude[0]];
  } else {
    console.log('No Nested Models');

    includeQuery.include = modelsToInclude;

    
  }

  includeQuery.attributes = { exclude: ['geom'] };

  //includeQuery.order = [['name', 'ASC'], ['title', 'ASC']]; //sort either by title or name

  
  if (reg_model === 'users') {
    // Exclude password fields if the model is users
    includeQuery.attributes = {
      exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken' ]
    };
  } else {
    includeQuery.attributes = { exclude: ['geom'] };
  }
 

  if (field && searchKeyword && searchKeyword !== '' && field !== '') {
    console.log('Filtered with no GEO');

    includeQuery.where = {
      [field]: Number.isInteger(parseInt(searchKeyword)) ? parseInt(searchKeyword) : { [Op.iLike]: `%${searchKeyword.toLowerCase()}%` }
    };
 
  } 

 

 
const cache_key = req.query.cache_key;
const cacheDuration = 3600; // Cache duration in seconds

if (cache_key && cache_key !== '') {
  try {
    // Get the last time the data in the database was modified
    const lastRow = await db.models[reg_model].findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    });

    const lastModified = lastRow ? lastRow.updatedAt.getTime() : Date.now();

    // Check if cached data exists
    const cacheResults = await redisClient.get(cache_key);

    if (cacheResults) {
      const result = JSON.parse(cacheResults);

      if (lastModified > result.lastModified) {
        // If the database was updated after the cached data was generated, update the cache
        const response = await db.models[reg_model].findAndCountAll(includeQuery);

        await redisClient.set(cache_key, JSON.stringify({
          data: response,
          lastModified: Date.now()
        }), {
          EX: cacheDuration,
          NX: true,
        });

        res.status(200).send({
          fromCache: false,
          cache_key: cache_key,
          data: response.rows,
          total: response.count,
          code: '0000'
        });
      } else {
        // If the cached data is still valid, return it from the cache
        res.status(200).send({
          fromCache: true,
          cache_key: cache_key,
          data: result.data.rows,
          total: result.data.count,
          code: '0000'
        });
      }
    } else {
      // If no cache data exists, generate new data and store it in the cache
      const response = await db.models[reg_model].findAndCountAll(includeQuery);

      await redisClient.set(cache_key, JSON.stringify({
        data: response,
        lastModified: Date.now()
      }), {
        EX: cacheDuration,
        NX: true,
      });

      // Return the data from the cache
      res.status(200).send({
        fromCache: false,
        cache_key: cache_key,
        data: response.rows,
        total: response.count,
        code: '0000'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
} else {
  // If no cache key is provided, execute the query without caching
  console.log("No Caching...");
  db.models[reg_model].findAndCountAll(includeQuery).then((list) => {
    res.status(200).send({
      fromCache: false,
      data: list.rows,
      total: list.count,
      code: '0000'
    });
  });
}



};







exports.xmodelAllDatafilter = (req, res) => {
  var reg_model = req.query.model
  var field = req.query.searchField
  var searchKeyword = req.query.searchKeyword
  db.models[reg_model]
    .findAndCountAll({
      where: {
        [field]: {
         // [op.iLike]: '%' + searchKeyword + '%' // like = case sensitive, iLike=case insensitve
          [Op.iLike]: `%${searchKeyword.toLowerCase()}%`  // use iLike with lowercase search term

        }
      }
    })
    .then((list) => {
      //console.log(list.rows)
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: 20000
      })
    })
}

exports.modelAllDatafilter = (req, res) => {
  var reg_model = req.query.model
  var field = req.query.searchField
  var searchKeyword = req.query.searchKeyword

  console.log('modelPaginatedData Data----->')
  var ass_model = db.models[req.query.assocModel]

  if (ass_model) {
    var qry = {
      include: [{ model: ass_model }]
    }
  } else {
    var qry = {}
  }

  ; (qry.where = {
  //   [field]: { [op.iLike]: '%' + searchKeyword + '%' }
     [field]: { [Op.iLike]: `%${searchKeyword.toLowerCase()}%` }


  }),
    db.models[reg_model].findAndCountAll(qry).then((list) => {
      //console.log(list.rows)
      res.status(200).send({
        data: list.rows,
        total: list.count,
        code: 20000
      })
    })
}

exports.xmodelImportData = (req, res) => {
  var reg_model = req.body.model

  console.log('here ----', req.body.data)

  // insert


  db.models[reg_model]
    .bulkCreate(req.body.data, { returning: true })
    .then(function (item) {
      console.log(req.body.count)
      res.status(200).send({
        message: 'Record Successfully saved',
        total: req.body.count,
        code: '0000'
      })
    })
    .catch(function (err) {
      // handle error;
      console.log('error0----1------>', err)

      if (err.name == 'SequelizeUniqueConstraintError') {
        var msg = 'One or more table constraints are violated. Check your unique columns'
      } else {
        var msg = 'The uploaded file does not match the required fields'
      }
      return res.status(500).send({ message: msg })

    })
}

exports.modelImportData = async (req, res) => {
  var reg_model = req.body.model
  let data = req.body.data

  //console.log('Model upsert----', data)
  let errors = []
  for (let i = 0; i < data.length; i++) {

    var obj = req.body.data[i]
    obj.createdBy=req.thisUser.id

    await db.models[reg_model].upsert(obj)
      .then(data => console.log(data))
      .catch(err => errors.push(err.original));
  }

  console.log("Errors ---->", errors)
  if (errors.length > 0) {
    res.status(500).send({ message: 'Import/Update failed' })
  } else {
    res.status(200).send({
      message: 'Import/Updated Successful',
      code: '0000'
    })
  }


}

 

exports.modelImportDataUpsert = async (req, res) => {

  console.log('req.body', req.body);

  const reg_model = req.body.model;
  //const data = req.body.data;
  let data = req.body.data;

    // Check if data is a JSON string and parse it if so
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid JSON format for data' });
      }
    }


  const insertedDocuments = [];
  const errors = [];

 

  try {
    if (reg_model === 'project') {
      // Handle projects with associated activities
      await Promise.all(
        data.map(async (item) => {
          item.createdBy = req.thisUser.id;

          item.sourceFunding = Array.isArray(item.sourceFunding) ? item.sourceFunding : [item.sourceFunding];
          item.activities = Array.isArray(item.activities) ? item.activities : [item.activities];

          try {
            const prj = await db.models[reg_model].create(item);

            const list_activities = item.activities;
            const activities = await db.models.activity.findAll({
              where: {
                id: list_activities,
              },
            });

            await prj.addActivities(activities);

            insertedDocuments.push(prj); // Add the inserted document to the array
          } catch (err) {
            errors.push(err.original);
            console.log('Error while processing project:', err);
          }
        })
      );
    } else {
      // Handle other models
      await Promise.all(
        data.map(async (item) => {
          item.createdBy = req.thisUser.id;

          try {
            // Use upsert to insert or update depending on conflicts
            const [insertedData, created] = await db.models[reg_model].upsert(item, {
              returning: true, // Get the inserted/updated data
            });

            if (reg_model === 'settlement') {
              sendSettDataToODK([item]);
            }

            if (created) {
              insertedDocuments.push(insertedData); // Add the inserted document to the array if it was created
            }
          } catch (err) {
            errors.push(err.original);
            console.log('Error while processing other models:', err);
          }
        })
      );
    }
    
    // Check for errors and respond accordingly
    if (errors.length > 0) {
      let errorCodes = [...new Set(errors.map(error => error.code))];
      let errorMsg = 'Import/Update failed for ' + errors.length + ' Records.';

      if (errorCodes.includes("42P10")) {
        errorMsg = 'There are one or more duplicate records';
      }

      res.status(500).send({ message: errorMsg });
    } else {
      res.status(200).send({
        message: 'Import/Update Successful',
        code: '0000',
        insertedDocuments: insertedDocuments, // Add the inserted documents to the response
      });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).send({ message: 'Internal Server Error', error: err.message });
  }
};



async function logEvents(log_object) {
  console.log(log_object)

     /// Log this activity 
     const  instlog = {}
     instlog.table=log_object.model
     instlog.action=log_object.action
     instlog.date = new Date();
     const clientIp = log_object.remoteAddress; // This will give you the remote IP address of the client
     console.log(clientIp);
     instlog.source = clientIp;
 
     // Log the user details 
     instlog.userId = log_object.user_id
     instlog.userName = log_object.user_name
     instlog.status =log_object.status
     console.log(instlog)
 
     //if(thisUser.id!=1){
       await db.models.logs.create(instlog);
    // }
 


 
}


 

exports.modelCreateOneRecord = (req, res) => {

  console.log(req.thisUser.id)
  let token = req.headers["x-access-token"];
  console.log('creating......')
  var reg_model = req.body.model


  /// Create Log Events Object 
  let event ={}
      event.model=reg_model
      event.remoteAddress= req.connection.remoteAddress
      event.user_id= req.thisUser.id
      event.user_name= req.thisUser.username
      event.action= 'Create '+ reg_model
 ///////////////////////////////



  console.log('model... ----', req.body.model)
  console.log('geom... ----', req.body.geom)

  var obj = req.body
  obj.createdBy=req.thisUser.id
  delete obj.model // or delete person["age"];
  
  if (JSON.stringify(req.body.geom ) ===  "{}" ) {
    delete obj.geom // or delete person["age"];

  }

  console.log('One record... Edited---s-', obj)


 
  
  db.models[reg_model]
  .create(obj)
  .then(async function (item) {
    // Special for projects where we store the project-activity relation
    console.log('temI', item)
  
    
    event.status= 'successful'
 
    logEvents(event)


    
    if (reg_model === 'settlement') {
      // send the ouput to be put send to ODK central
      sendSettDataToODK([item])
     }
    
    
    else if (reg_model === 'dashboard_section_chart') {
      var indicator_list = req.body.indicator_id;
      const list_indicators = await db.models.indicator.findAll({
        where: {
          id: indicator_list,
        },
      });

      item.addIndicators(list_indicators);
    }

    res.status(200).send({
      message: 'Record Saved Successfully',
      total: req.body.count,
      data: item, // Include the created record in the response
      code: '0000',
    });
  })
  .catch(async function (error) {
    // handle error;
    console.log('error0--90----->', error);
    event.status= 'failed' 

    logEvents(event)


    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Duplicate entry error:', error.errors.map(e => e.message).join(', '));
      // Handle the duplicate key error (e.g., return a user-friendly message)
      return res.status(400).json({
        message: 'Duplicate records for '+ reg_model + ' not allowed'
      });
    } else {
      // Handle other errors

      console.log('Error creating record:', error);
      return res.status(500).json({
        message: 'An unexpected error occurred while creating the record.'
      });
    }



      
  
 
  });
  

}


 
 




 
 
exports.modelAllGeo = async (req, res) => {
  var reg_model = req.body.model
   
  var qry2 =
  "SELECT row_to_json(fc) AS json_build_object FROM (SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(ST_ReducePrecision(geom, 0.0001))::json AS geometry, json_strip_nulls(row_to_json(" + reg_model + ")) AS properties FROM " +
  reg_model + " WHERE geom IS NOT NULL) AS f) AS fc";

   
  console.log("req.body.cache_key",)



  if (req.body.cache_key && req.body.cache_key != '') { 

    const cache_key = req.body.cache_key;   
    const cacheDuration = 3600; // Cache duration in seconds

    
    // get last time it was modified 
    const lastRow = await db.models[reg_model].findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    });
    
    const lastModified = lastRow ? lastRow.updatedAt: Date.now()
    console.log(lastModified,req.body.cache_key)
     console.log("Caching>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")


    try {
      const cacheResults = await redisClient.get(cache_key);
     

      if (cacheResults) {
        console.log("reurning from cachec.....")
        const result = JSON.parse(cacheResults);
         if (lastModified && lastModified > result.lastModified) {
          // If the database was updated after the cached data was generated, update the cache
          //const response = await db.models[reg_model].findAndCountAll(qry2);
          const response = await sequelize.query(qry2, {
            model: db.models[reg_model],
            mapToModel: false // pass true here if you have any mapped fields
          })


          
          await redisClient.set(cache_key, JSON.stringify({
            data: response,
             lastModified: Date.now() // Update the last modified timestamp
          }), {
            EX: cacheDuration,
            NX: true,
          });

          res.status(200).send({
            fromCache: false,
            cache_key: cache_key,
            data: response,
            code: '0000'
          });
        } else {
          // If the cached data is still valid, return it from the cache

          console.log(result.data)
          res.status(200).send({
            fromCache: true,
            cache_key: cache_key,
            data: result.data,
            code: '0000'
          });
        }
      } 
      else {

        // If no cache data exists, generate new data and store it in the cache
        //const response = await db.models[reg_model].findAndCountAll(qry);
        const response = await sequelize.query(qry2, {
          model: db.models[reg_model],
          mapToModel: false // pass true here if you have any mapped fields
        })


       // console.log('county geo', response.data[0].json_build_object)
        console.log(response[0])

         //const reducedPrecisionGeoJSON = reducePrecision(response[0], 1);
       // console.log(JSON.stringify(reducedPrecisionGeoJSON, null, 2));



        await redisClient.set(cache_key, JSON.stringify({
          data: response,
           lastModified: Date.now() // Set the last modified timestamp to current time
        }), {
          EX: cacheDuration,
          NX: true,
        });

          //  return it from the cache
          res.status(200).send({
            fromCache: false,
            cache_key: cache_key,
            data: response,
             code: '0000'
          });
    }
  }
    catch(error) {
      res.status(500).send({
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }




  } 
  else {

    console.log("123xxxNo Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")
  
    

     
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  res.status(200).send({
    data: result_geo,
    code: '0000'
  })
  

  }

}


//ST_AsGeoJSON(ST_ReducePrecision(geom, 0.0001))

const { Readable } = require('stream');

 
exports.streamAllGeo = async (req, res) => {
  const reg_model = req.query.model;

  const qry2 =
  "SELECT row_to_json(fc) AS json_build_object FROM (SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(ST_ConvexHull(geom))::json AS geometry, (SELECT json_strip_nulls(row_to_json(" +
  reg_model +
  ")) FROM (SELECT id) t) AS properties FROM  " +
  reg_model +
  ' WHERE ST_IsEmpty(geom) = false AND geom IS NOT NULL) AS f) AS fc';

  
 
  if (req.query.cache_key && req.query.cache_key !== '') {
    const cache_key = req.query.cache_key;
    const cacheDuration = 3600; // Cache duration in seconds

    const lastRow = await db.models[reg_model].findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']],
    });

    const lastModified = lastRow ? lastRow.updatedAt : Date.now();

    console.log(lastModified, req.query.cache_key);
    console.log("Caching>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....");

    try {
      const cacheResults = await redisClient.get(cache_key);

      if (cacheResults) {
        console.log("Returning from cache...");

        const result = JSON.parse(cacheResults);

        if (lastModified && lastModified > result.lastModified) {
          const response = await sequelize.query(qry2, {
            model: db.models[reg_model],
            mapToModel: false,
          });

          await redisClient.set(
            cache_key,
            JSON.stringify({
              data: response,
              lastModified: Date.now(),
            }),
            {
              EX: cacheDuration,
              NX: true,
            }
          );

          res.status(200);
          console.log('piping the results 1.......')

          // Create a readable stream from the response data
          const readableStream = new Readable();
          readableStream.push(JSON.stringify({
            fromCache: false,
            cache_key: cache_key,
            data: response,
            code: '0000',
          }));
          readableStream.push(null);

          // Pipe the stream to the response
          readableStream.pipe(res);
        } 
        else {
          res.status(200);
          console.log('piping the results 2x.......')

 
          // Create a readable stream from the cached data
          const readableStream = new Readable();
          readableStream.push(JSON.stringify({
            fromCache: true,
            cache_key: cache_key,
            data: result.data,
            code: '0000',
          }));
          readableStream.push(null);

          // Pipe the stream to the response
          readableStream.pipe(res);
        }
      } 
      else {
        const response = await sequelize.query(qry2, {
          model: db.models[reg_model],
          mapToModel: false,
        });

        await redisClient.set(
          cache_key,
          JSON.stringify({
            data: response,
            lastModified: Date.now(),
          }),
          {
            EX: cacheDuration,
            NX: true,
          }
        );

        res.status(200);
        
        // Create a readable stream from the response data
        const readableStream = new Readable();
        readableStream.push(JSON.stringify({
          fromCache: false,
          cache_key: cache_key,
          data: response,
          code: '0000',
        }));
        readableStream.push(null);

        // Pipe the stream to the response
        readableStream.pipe(res);
      }
    } catch (error) {
      res.status(500);
      
      // Create a readable stream from the error message
      const readableStream = new Readable();
      readableStream.push(JSON.stringify({
        message: 'Internal server error',
        code: 'SERVER_ERROR',
      }));
      readableStream.push(null);

      // Pipe the stream to the response
      readableStream.pipe(res);
    }
  } else {
    console.log("No Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....");

    const result_geo = await sequelize.query(qry2, {
      model: db.models[reg_model],
      mapToModel: false,
    });

    res.status(200);
    
    // Create a readable stream from the response data
    const readableStream = new Readable();
    readableStream.push(JSON.stringify({
      data: result_geo,
      code: '0000',
    }));
    readableStream.push(null);

    // Pipe the stream to the response
    readableStream.pipe(res);
  }
};


 



exports.modelOneGeo = async (req, res) => {
  var reg_model = req.body.model
  var id = req.body.id
  var msg = ''
  
  
  
   
  var qry2 =
  " select row_to_json(fc)  as json_build_object from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features  from ( select 'Feature' as type, ST_AsGeoJSON((geom)):: json as geometry,( select json_strip_nulls(row_to_json(" +reg_model+ " )) from ( select id) t ) as properties  from  " +
  reg_model  + ' where geom is not null and id= '+ id +' ) as f ) as fc'
  
  

  
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  const json = JSON.stringify(result_geo) // [1,2,3]

   console.log('GEo----->', result_geo[0])
  if (result_geo) {
    msg = 'Shapes found. Loading shortly...'
    console.log(msg)
    res.status(200).send({
      data: result_geo,
      code: '0000',
      message: 'Shapes found. Loading...'
    })
    // console.log('Found ...', json[0].json_build_object)
  } 
}

 
 

exports.modelSelectGeo = async (req, res) => {
  const reg_model = req.body.model;
  const columnFilterField = req.body.columnFilterField;
  let arr;

  // Determine the array of identifiers based on the request body
  if (req.body.selectedParents.length > 0) {
    arr = req.body.selectedParents;
  } else if (req.body.filtredGeoIds.length > 0) {
    arr = [req.body.filtredGeoIds];
  } else {
    arr = [req.body.id];
  }

  let qry2;

  // Build the query based on whether identifiers are present
  if (!arr[0] || arr[0].length === 0) {
    qry2 = `
      SELECT row_to_json(fc) AS json_build_object
      FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(geom, 3)::json AS geometry,
                 json_strip_nulls(row_to_json(${reg_model}.*)) AS properties --  Non Parcels
          FROM ${reg_model}
          WHERE geom IS NOT NULL
        ) AS f
      ) AS fc`;
  } else {
    const filterValues = Array.isArray(columnFilterField) ? columnFilterField : [columnFilterField];
    const filterClause = filterValues.map((value) => `(${value} IN (${arr}))`).join(' OR ');

    qry2 = `
      SELECT row_to_json(fc) AS json_build_object
      FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(geom, 3)::json AS geometry,
                 json_strip_nulls(row_to_json(${reg_model}.*)) AS properties --    Non Parcels
          FROM ${reg_model}
          WHERE geom IS NOT NULL
            AND (${filterClause})
        ) AS f
      ) AS fc`;
  }

  // Execute the query
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  });

  // Send the result back in the response
  res.status(200).send({
    data: result_geo,
    code: '0000'
  });
};

 
exports.modelSelectParcelGeo = async (req, res) => {
  const reg_model = req.body.model;
  const columnFilterField = req.body.columnFilterField;
  let arr;

  // Determine the array of identifiers based on the request body
  if (req.body.selectedParents.length > 0) {
    arr = req.body.selectedParents;
  } else if (req.body.filtredGeoIds.length > 0) {
    arr = [req.body.filtredGeoIds];
  } else {
    arr = [req.body.id];
  }

  let qry2;

  // Build the query based on whether identifiers are present
  if (!arr[0] || arr[0].length === 0) {
    qry2 = `
      SELECT row_to_json(fc) AS json_build_object
      FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(geom, 8)::json AS geometry,
                 json_strip_nulls(row_to_json(${reg_model}.*)) AS properties -- For Parcels
          FROM ${reg_model}
          WHERE geom IS NOT NULL
        ) AS f
      ) AS fc`;
  } else {
    const filterValues = Array.isArray(columnFilterField) ? columnFilterField : [columnFilterField];
    const filterClause = filterValues.map((value) => `(${value} IN (${arr}))`).join(' OR ');

    qry2 = `
      SELECT row_to_json(fc) AS json_build_object
      FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(geom, 8)::json AS geometry,
                 json_strip_nulls(row_to_json(${reg_model}.*)) AS properties -- For Parcels
          FROM ${reg_model}
          WHERE geom IS NOT NULL
            AND (${filterClause})
        ) AS f
      ) AS fc`;
  }

  // Execute the query
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  });

  // Send the result back in the response
  res.status(200).send({
    data: result_geo,
    code: '0000'
  });
};



exports.modelGetByCode= async (req, res) => {
  console.log('Codes  ----------------------------------->', req.query);

 
  var reg_model = req.query.model;
  var arrayCodes = req.query.code;

  if (typeof arrayCodes === 'string' && arrayCodes.includes(',')) {
    // Split the pcodes string into an array using commas
    arrayCodes = arrayCodes.split(',');
}

// Now pcodes will either be the original value (if it's not a string or doesn't contain a comma)
// or it will be an array of strings if it contains a comma

  
// Query your database to retrieve records based on the array of IDs
db.models[reg_model].findAll({
  where: {
    code: arrayCodes // Use the 'id' column to filter by the array of IDs
  },
  attributes: {
    exclude: ['geom'] // Exclude the 'geom' column from the result
  }
})
  .then((results) => {
    console.log(results);
    
        res.status(200).send({
          data: results,
          code: '0000'
        });
          
  
  })
  .catch((error) => {
    console.error('Error fetching records:', error);
    res.status(500).send({ message: 'Getting Parents failed' })

  });

};

 

 

exports.modelOneRecord = (req, res) => {
  var reg_model = req.body.model;

  var ass_model = db.models[req.body.assocModel];

  var qry = {
    include:[]
  };

  if (ass_model) {
      qry.include= [{ model: ass_model }]
    };
  
  
  if (reg_model === 'project') {
    // Include activities through the many-to-many relationship
    qry.include.push({
      model: db.models.activity,
      as: 'activities', // Replace 'activities' with the actual alias for the many-to-many association
      through: { attributes: [] } // Exclude join table attributes from the result
    });
  }

  qry.where = { id: { [op.eq]: req.body.id } };

  db.models[reg_model].findOne(qry).then((thisRecord) => {
    res.status(200).send({
      data: thisRecord,
      code: '0000'
    });
  });
};

exports.modelOneRecordByCode = (req, res) => {
  var reg_model = req.body.model;

  var ass_model = db.models[req.body.assocModel];

  var qry = {
    include:[]
  };

  if (ass_model) {
      qry.include= [{ model: ass_model }]
    };
  
   

  qry.where = { code: { [op.eq]: req.body.code } };

  db.models[reg_model].findOne(qry).then((thisRecord) => {
    res.status(200).send({
      data: thisRecord,
      code: '0000'
    });
  });
};

exports.modelEditOneRecord = (req, res) => {

   /// Create Log Events Object 
   const edit_event ={}
   edit_event.model= req.body.model;
   edit_event.remoteAddress= req.connection.remoteAddress
   edit_event.user_id= req.thisUser.id
   edit_event.user_name= req.thisUser.username
   edit_event.action= 'Edit '+ req.body.model
 ///////////////////////////////



  var reg_model = req.body.model;
  console.log('Editing thus record',req.body)




  // Get the record and update it by replacing the whole document
  db.models[reg_model].findOne({ where: { id: req.body.id } })
    .then(async (result) => {


      // Special for projects where we store the project-activity relation
      if (reg_model === 'project') {
        var activity_list = req.body.activities;
        const list_activities = await db.models.activity.findAll({
          where: {
            id: activity_list
          }
        });

        console.log(result);
        console.log(list_activities);

        await result.setActivities(list_activities);
      }

      if (reg_model === 'document' && req.body.edited_name) {
        const oldFilePath = `/data/uploads/${result.name}`;
        const newFilePath = `/data/uploads/${req.body.edited_name}`;
        
        fs.rename(oldFilePath, newFilePath, (err) => {
          if (err) {
            console.log('Error renaming the file:', err);
          } else {
            console.log('File renamed successfully.');
          }
        });
      }
     

      console.log("Edit", result);
      if (result) {
        result.set(req.body);
        await result.save(); // Wait for the record to be saved

        if (reg_model === 'settlement') { 

          // update ODK settelment 
          updateSettlementDataInODK(result)
  
        }

        edit_event.status='Successful'
        logEvents(edit_event)


        res.status(200).send({
          message: "Update successful",
          code: "0000",
          data: result // Include the updated record in the response
        });
      } else {
        res.status(404).send({
          message: "Record not found",
          code: "0001"
        });
      }
    })
    .catch(function (err) {
      // handle error;
      console.log('update Error----->', err);
      edit_event.status='Fail'
      
      logEvents(edit_event)
      var message = err.message || 'An error occurred';
    
      return res.status(500).send({ message: message });
    });
};


exports.modelActivateUser = async (req, res) => {
  try {
    const { model } = req.query;
    const { id, isactive } = req.body;

    // Find the user by ID
    const user = await db.models[model].findOne({ where: { id } });

    if (!user) {
      return res.status(404).send({
        message: 'User not found',
        code: '0001'
      });
    }

    // Update the status field
    user.isactive = isactive;

    // Save the updated record
    await user.save();

    res.status(200).send({
      message: 'User status updated successfully',
      data: user,
      code: '0000'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).send({
      message: 'Unable to update user status. Please try again later.',
      code: '9999'
    });
  }
};



 

exports.modelDeleteOneRecord = async (req, res) => {

    /// Create Log Events Object 
    const del_event ={}
    del_event.model= req.body.model;
    del_event.remoteAddress= req.connection.remoteAddress
    del_event.user_id= req.thisUser.id
    del_event.user_name= req.thisUser.username
    del_event.action= 'Delete '+ req.body.model
  ///////////////////////////////


  try {
    const modelName = req.body.model;
    const model = db.models[modelName];
    const id = req.body.id;


    
 

    // Check if the model exists
    if (!model) {
      return res.status(400).send({
        message: `Model '${modelName}' does not exist`,
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Check if the record exists
    const record = await model.findOne({ where: { id } });
    if (!record) {
      return res.status(404).send({
        message: `Record with id '${id}' does not exist in '${modelName}' model`,
        code: 'RECORD_NOT_FOUND'
      });
    }

    

 
    // Check for dependencies in associated models
    const associations = Object.keys(model.associations);


 
    console.log('associations',associations)

    for (let i = 0; i < associations.length; i++) {
      const associationName = associations[i];
      const association = model.associations[associationName];

      
      let dependentRowsCount = 0;
      const associationType = association.associationType;
    
      if (associationType === 'HasMany') {
        const mdl = association.target; // Get the associated model's class reference
    
        dependentRowsCount = await mdl.count({
          where: {
            [association.foreignKey]: id
          }
        });
    
        console.log('dependentRowsCount', dependentRowsCount);
      } else {
        dependentRowsCount = 0;
      }
    
      if (dependentRowsCount > 0) {
        return res.status(500).send({
          message: `Cannot delete '${modelName}' record, it has ${dependentRowsCount} dependent ${association.target.name}(s)`,
          code: 'DEPENDENCY_FOUND'
        });
      }
    }

    

    // Delete the record
    await model.destroy({ where: { id } });
    del_event.status='Successful'
    logEvents(del_event)
  
    if (modelName == 'settlement') { 
      deleteSettlementDataFromODK(record)

    }

 

    res.status(200).send({
      message: 'Delete successful',
      code: '0000'
    });
  } catch (err) {
    console.error(err);

    del_event.status='failed'
      logEvents(del_event)

    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

 

 
exports.modelDeleteByFields = async (req, res) => {

      /// Create Log Events Object 
      const del_event ={}
      del_event.model= req.body.model;
      del_event.remoteAddress= req.connection.remoteAddress
      del_event.user_id= req.thisUser.id
      del_event.user_name= req.thisUser.username
      del_event.action= 'Delete '+ req.body.model
    ///////////////////////////////


  try {
    const modelName = req.body.model;
    const model = db.models[modelName];
    const criteria = req.body.criteria; // Expecting an object with field-value pairs

    // Check if the model exists
    if (!model) {
      return res.status(400).send({
        message: `Model '${modelName}' does not exist`,
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Check if criteria is provided and is an object
    if (typeof criteria !== 'object' || criteria === null || Array.isArray(criteria)) {
      return res.status(400).send({
        message: 'Invalid criteria format. Expected an object with field-value pairs.',
        code: 'INVALID_CRITERIA'
      });
    }

    // Construct the where clause based on the criteria
    const whereClause = { ...criteria };

    // Check if any records match the criteria
    const records = await model.findAll({ where: whereClause });

    if (records.length === 0) {
      return res.status(404).send({
        message: `No records found matching the provided criteria in '${modelName}' model`,
        code: 'RECORD_NOT_FOUND'
      });
    }

    // Check for dependencies in associated models
    const associations = Object.keys(model.associations);

    for (let i = 0; i < associations.length; i++) {
      const associationName = associations[i];
      const association = model.associations[associationName];

      let dependentRowsCount = 0;
      const associationType = association.associationType;

      if (associationType === 'HasMany') {
        const mdl = association.target; // Get the associated model's class reference

        dependentRowsCount = await mdl.count({
          where: {
            [association.foreignKey]: {
              [Op.in]: records.map(record => record.id)
            }
          }
        });

        if (dependentRowsCount > 0) {
          return res.status(500).send({
            message: `Cannot delete records, there are ${dependentRowsCount} dependent ${association.target.name}(s)`,
            code: 'DEPENDENCY_FOUND'
          });
        }
      }
    }

    // Delete the records
    await model.destroy({ where: whereClause });
  del_event.status='Successful'
    logEvents(del_event)

    res.status(200).send({
      message: 'Delete successful',
      code: '0000'
    });
  } catch (err) {

    del_event.status='Failed'
    logEvents(del_event)
    console.error(err);
    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};



exports.modelDeleteRecords = async (req, res) => {

  /// Create Log Events Object 
  const del_event ={}
  del_event.model= req.body.model;
  del_event.remoteAddress= req.connection.remoteAddress
  del_event.user_id= req.thisUser.id
  del_event.user_name= req.thisUser.username
  del_event.action= 'Delete '+ req.body.model
///////////////////////////////


  try {
    console.log("Deleting multiple records...");

    const modelName = req.body.model;
    const model = db.models[modelName];
    const fields = req.body.fields; // Array of field names
    const fieldValues = req.body.fieldValues; // Array of arrays of values for each field

    // Check if the model exists
    if (!model) {
      return res.status(400).send({
        message: `Model '${modelName}' does not exist`,
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Validate fields and fieldValues
    if (!Array.isArray(fields) || !Array.isArray(fieldValues) || fields.length !== fieldValues.length) {
      return res.status(400).send({
        message: 'Invalid fields or field values provided',
        code: 'INVALID_FIELDS'
      });
    }

    // Construct the condition for finding records
    const whereCondition = fields.reduce((condition, field, index) => {
      const values = fieldValues[index];
      if (Array.isArray(values) && values.length > 0) {
        condition[field] = {
          [Op.in]: values
        };
      }
      return condition;
    }, {});

    console.log('Where condition:', whereCondition);

    // Check for dependencies in associated models
    const associations = Object.keys(model.associations);

    for (let i = 0; i < associations.length; i++) {
      const associationName = associations[i];
      const association = model.associations[associationName];
      
      let dependentRowsCount = 0;
      const associationType = association.associationType;

      if (associationType === 'HasMany') {
        const mdl = association.target; // Get the associated model's class reference

        dependentRowsCount = await mdl.count({
          where: whereCondition
        });

        console.log('dependentRowsCount', dependentRowsCount);
      } else {
        dependentRowsCount = 0;
      }

      if (dependentRowsCount > 0) {
        return res.status(500).send({
          message: `Cannot delete '${modelName}' records, some have dependent ${association.target.name}(s)`,
          code: 'DEPENDENCY_FOUND'
        });
      }
    }

    // Delete the records
    await model.destroy({
      where: whereCondition
    });

    // Perform any additional actions based on the model type
    if (modelName === 'settlement') {
      // Fetch the deleted records to pass to the deleteSettlementDataFromODK function
      const deletedRecords = await model.findAll({
        where: whereCondition
      });
      
      deletedRecords.forEach(record => deleteSettlementDataFromODK(record));
    }

    del_event.status='Successful'
    logEvents(del_event)


    res.status(200).send({
      message: 'Delete successful',
      code: '0000'
    });
  } catch (err) {
    console.error(err);

    del_event.status='Failed'
    logEvents(del_event)


    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};



// count all
exports.modelCountAll = (req, res) => {
  var reg_model = req.query.model
  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].count().then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        count: result,
        code: 20000
      })
    }
  })
}

// count DISTICNT
exports.modelCountDistinct = (req, res) => {
  var reg_model = req.query.model
  var countField = req.query.countField
  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].count({ distinct: true, col: countField }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        count: result,
        code: 20000
      })
    }
  })
}

// count with creteria

const { Op } = require('sequelize');

exports.modelCountFilter = (req, res) => {
  var reg_model = req.body.model;
  var filterFields = req.body.filterFields; // Modified to accept an array of filter fields
  var criteria = req.body.criteria; // Modified to accept an array of criteria

  // Here we create an object for the query comprising the field and value to query
  const whereClause = {};

  // Loop through each filter field and add it to the where clause with its corresponding criteria
  const conditions = [];
  for (let i = 0; i < filterFields.length; i++) {
    const condition = {};
    condition[filterFields[i]] = criteria[i];
    conditions.push(condition);
  }
  whereClause[Op.and] = conditions;

  console.log ('------------Clause-----------' , whereClause);

  // Count the number of records that match the where clause
  db.models[reg_model].count({ where: whereClause }).then((result) => {
    if (result) {
      res.status(200).send({
        count: result,
        code: '0000'
      });
    }
  });
}


exports.xmodelCountFilter = (req, res) => {
  var reg_model = req.body.model
  var filterField = req.body.filterField
  var criteria = req.body.criteria
  // here we creat an object for the query  comprising the field and value to querry
  const obj = {}
  obj[filterField] = criteria
  console.log(obj)
  db.models[reg_model].count({ where: obj }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        count: result,
        code: '0000'
      })
    }
  })
}

// Sum  all
exports.modelSumAll = (req, res) => {
  var reg_model = req.query.model
  var sumField = req.body.sumField
  console.log('Querry:', req.query)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model]
    .findAll({
      attributes: [[sequelize.fn('sum', sequelize.col(sumField)), 'Sum']]
    })
    .then((result) => {
      if (result) {
        // res.status(200).send(result);
        res.status(200).send({
          Total: result,
          code: 20000
        })
      }
    })
}

// Sum  filtred

exports.xmodelSumFiltered = (req, res) => {
  var reg_model = req.body.model
  var sumField = req.body.sumField
  var filterField = req.body.filterField
  var criteria = req.body.criteria

  const obj = {}
  obj[filterField] = criteria
  console.log(obj)

  console.log('Querry:', req.body)
  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].sum(sumField, { where: obj }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        data: result,
        code: '0000'
      })
    } else {
      res.status(200).send({
        data: 0,
        code: '0000'
      })
    }
  })
}

exports.modelSumFiltered = (req, res) => {
  var reg_model = req.body.model
  var sumField = req.body.sumField
  var filterFields = req.body.filterFields
  var criteria = req.body.criteria

  const whereClause = {}
  filterFields.forEach((field, index) => {
    whereClause[field] = criteria[index]
  })
  console.log(whereClause)

  console.log('Query:', req.body)
  // get this one  record and update it by replacing the whole document
  db.models[reg_model].sum(sumField, { where: whereClause }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        data: result,
        code: '0000'
      })
    } else {
      res.status(200).send({
        data: 0,
        code: '0000'
      })
    }
  })
}




exports.modelAllUsers = (req, res) => {
  var reg_model = req.body.model
  var pg_number = req.body.page
  var limit = req.body.limit
  var sort = req.body.sort
  var curUSer = req.body.curUser

  console.log('All Users ----- X --------X ')

  console.log('Sort:order', req.body.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}

  /*  if (reg_model === 'users') {
     console.log('Include for users......')
       ; (qry.offset = (pg_number - 1) * limit),
         (qry.limit = limit),
         (qry.where = { id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
     qry.order = [['id', sort]]
   } else {
     ; (qry.offset = (pg_number - 1) * limit), (qry.limit = limit), (qry.order = [['id', sort]])
   } */

  console.log('The Querry', qry)
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list.count)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
      message: 'Users xfetched succesfully'
    })
  })
}

exports.modelPaginatedData = (req, res) => {
  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  var curUSer = req.query.curUser

  console.log('modelPaginatedData Data----->')
  var ass_model = db.models[req.query.assocModel]

  if (ass_model) {
    var qry = {
      include: [{ model: ass_model }]
    }
  } else {
    var qry = {}
  }

  //db.models[reg_model].findAndCountAll(includeQuerry).then(list => {

  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  if (reg_model === 'users') {
    //   console.log("Include for users......")
    ; (qry.offset = (pg_number - 1) * limit),
      (qry.limit = limit),
      (qry.where = { id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
    qry.order = [['id', sort]]
  } else {
    ; (qry.offset = (pg_number - 1) * limit), (qry.limit = limit), (qry.order = [['id', sort]])
  }

  console.log('The Querry', qry)
  console.log('The reg_model', reg_model)

  db.models[reg_model].findAndCountAll(qry).then((list) => {
    // console.log(list.rows)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  })
}


exports.XmodelPaginatedDatafilterByColumn = async (req, res) => {
  console.log('Req-body 002', req.body);

  var reg_model = req.body.model;

  // Base count query without nested models and includes
  var baseCountQuery = {
    where: {}
  };

  if (req.body.filters && req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length) {
    var lstQuerries = [];
    for (let i = 0; i < req.body.filters.length; i++) {
      var lstValues = req.body.filterValues[i];
      lstQuerries.push({ [req.body.filters[i]]: lstValues });
    }
    baseCountQuery.where = { [Op.and]: lstQuerries };
  }

  // Count records without nested models and includes
  let count = await db.models[reg_model].count(baseCountQuery);
  console.log('Base count:', count);

  // Associated Models
  var associated_multiple_models = req.body.associated_multiple_models;
  //console.log('associated_multiple_models', associated_multiple_models.length);

  // Nested Models
  var nested_models = req.body.nested_models;
  var nestedQuery = {};

  if (req.body.nested_models) {
    var child_model = db.models[req.body.nested_models[0]];
    var grand_child_model = db.models[req.body.nested_models[1]];

    if (req.body.nested_filter) {
      nestedQuery[req.body.nested_filter[0]] = req.body.nested_filter[1];
    }
  }

  var qry = {};
  var includeModels = [];

  // Loop through the include models
  for (let i = 0; i < associated_multiple_models.length; i++) {
    var modelIncl = { model: db.models[associated_multiple_models[i]] };

    if (associated_multiple_models[i] === 'users') {
      modelIncl.raw = true;
      modelIncl.nested = true;
      modelIncl.attributes = ['name', 'email', 'phone'];
    }

    includeModels.push(modelIncl);
  }

  if (associated_multiple_models) {
    if (nested_models) {
      var nestedModels;
      if (req.body.nested_filter) {
        nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true };
      } else {
        nestedModels = { model: child_model, include: [grand_child_model], raw: true, nested: true };
      }
      includeModels.push(nestedModels);
      qry.include = includeModels;
    } else {
      qry.include = includeModels;
    }
  }

  // Pagination and sorting
  if (req.body.limit) {
    qry.limit = req.body.limit;
  }
  if (req.body.page) {
    qry.offset = (req.body.page - 1) * req.body.limit;
  }

  // Filtering
  if (req.body.filters) {
    if (req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length) {
      var lstQuerries = [];
      for (let i = 0; i < req.body.filters.length; i++) {
        var lstValues = req.body.filterValues[i];
        lstQuerries.push({ [req.body.filters[i]]: lstValues });
      }
      qry.where = { [Op.and]: lstQuerries };
    }
  }

  // Order by createdAt in descending order
  qry.order = [['createdAt', 'DESC']];

  console.log('Final Query:', qry);

  

  // Cache handling
  if (req.body.cache_key && req.body.cache_key !== '') {
    const cache_key = req.body.cache_key;
    const cacheDuration = 3600; // Cache duration in seconds

    // Get last time it was modified
    const lastRow = await db.models[reg_model].findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']]
    });

    const lastModified = lastRow ? lastRow.updatedAt : Date.now();

    try {
      const cacheResults = await redisClient.get(cache_key);
      if (cacheResults) {
        const result = JSON.parse(cacheResults);
        if (lastModified && lastModified > result.lastModified) {
          // If the database was updated after the cached data was generated, update the cache
          const response = await db.models[reg_model].findAndCountAll(qry);
          await redisClient.set(cache_key, JSON.stringify({
            data: response.rows,
            total: count,
            lastModified: Date.now()
          }), {
            EX: cacheDuration,
            NX: true,
          });
          res.status(200).send({
            fromCache: false,
            cache_key: cache_key,
            data: response.rows,
            total: count,
            code: '0000'
          });
        } else {
          // If the cached data is still valid, return it from the cache
          res.status(200).send({
            fromCache: true,
            cache_key: cache_key,
            data: result.data,
            total: count,
            code: '0000'
          });
        }
      } else {
        // If no cache data exists, generate new data and store it in the cache
        const response = await db.models[reg_model].findAndCountAll(qry);
        await redisClient.set(cache_key, JSON.stringify({
          data: response.rows,
          total: count,
          lastModified: Date.now()
        }), {
          EX: cacheDuration,
          NX: true,
        });
        res.status(200).send({
          fromCache: false,
          cache_key: cache_key,
          data: response.rows,
          total: count,
          code: '0000'
        });
      }
    } catch (error) {

      console.log(error)
      res.status(500).send({
        message: 'Internal server error 1',
        code: 'SERVER_ERROR'
      });
    }
  } else {
    // No cache
    try {
      const response = await db.models[reg_model].findAndCountAll(qry);
      res.status(200).send({
        fromCache: false,
        data: response.rows,
        total: count,
        code: '0000'
      });
    } catch (error) {
      console.log(error)
      res.status(500).send({
        message: 'Internal server error 2',
        code: 'SERVER_ERROR'
      });
    }
  }
};


exports.modelPaginatedDatafilterByColumn = async (req, res) => {
  console.log('Req-body 002', req.body);

  const reg_model = req.body.model;

  // Base count query
  let baseCountQuery = {
    where: {}
  };

  if (req.body.filters && req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length) {
    let lstQuerries = [];
    for (let i = 0; i < req.body.filters.length; i++) {
      const lstValues = req.body.filterValues[i];
      lstQuerries.push({ [req.body.filters[i]]: lstValues });
    }
    baseCountQuery.where = { [Op.and]: lstQuerries };
  }

  // Count records
  let count = await db.models[reg_model].count(baseCountQuery);
  console.log('Base count:', count);

  // Query setup
  let qry = { include: [], order: [['createdAt', 'DESC']] };

  if (req.body.limit) qry.limit = req.body.limit;
  if (req.body.page) qry.offset = (req.body.page - 1) * req.body.limit;

  if (baseCountQuery.where) qry.where = baseCountQuery.where;

  const associated_multiple_models = req.body.associated_multiple_models || [];
  const nested_models = req.body.nested_models || [];

  // Handle includes
  associated_multiple_models.forEach(model => {
    qry.include.push({ model: db.models[model] });
  });

  if (nested_models.length > 0) {
    const child_model = db.models[nested_models[0]];
    const grand_child_model = db.models[nested_models[1]];
    const nestedQuery = req.body.nested_filter ? { [req.body.nested_filter[0]]: req.body.nested_filter[1] } : {};

    qry.include.push({
      model: child_model,
      include: [{ model: grand_child_model, where: nestedQuery }]
    });
  }

  // Blob attributes to be converted
  const blobAttributes = ['cover_photo']; // Update to match your blob fields

  try {
    const response = await db.models[reg_model].findAndCountAll(qry);

    // Transform blob attributes to Base64
    const transformedData = response.rows.map(record => {
      const transformedRecord = { ...record.toJSON() };

      blobAttributes.forEach(attr => {
        if (transformedRecord[attr]) {
          transformedRecord[attr] = `data:image/jpeg;base64,${Buffer.from(transformedRecord[attr]).toString('base64')}`;
        }
      });

      return transformedRecord;
    });

    const result = {
      fromCache: false,
      data: transformedData,
      total: count,
      code: '0000',
    };

    // Cache handling
    if (req.body.cache_key) {
      const cache_key = req.body.cache_key;
      const cacheDuration = 3600; // Cache duration in seconds
      await redisClient.set(cache_key, JSON.stringify(result), { EX: cacheDuration });
    }

    res.status(200).send(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};



exports.xxmodelPaginatedDatafilterByColumn = async (req, res) => {
  console.log('Req-body 002', req.body);

  const reg_model = req.body.model;

  // Base count query
  const baseCountQuery = { where: {} };

  if (req.body.filters && req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length) {
    const lstQuerries = req.body.filters.map((filter, i) => ({ [filter]: req.body.filterValues[i] }));
    baseCountQuery.where = { [Op.and]: lstQuerries };
  }

  const count = await db.models[reg_model].count(baseCountQuery);
  console.log('Base count:', count);

  const associated_multiple_models = req.body.associated_multiple_models || [];
  const nested_models = req.body.nested_models || [];
  const nestedQuery = req.body.nested_filter ? { [req.body.nested_filter[0]]: req.body.nested_filter[1] } : {};
  
  const qry = {
    include: associated_multiple_models.map((model) => ({ model: db.models[model] })),
    limit: req.body.limit || 10,
    offset: (req.body.page - 1) * (req.body.limit || 10),
    where: baseCountQuery.where,
    order: [['createdAt', 'DESC']],
  };

  if (nested_models.length > 0) {
    const child_model = db.models[nested_models[0]];
    const grand_child_model = db.models[nested_models[1]];

    qry.include.push({
      model: child_model,
      include: [{
        model: grand_child_model,
        where: nestedQuery,
      }],
    });
  }

  // List of attributes that might be blobs
  const blobAttributes = ['cover_photo' ]; // Adjust to match your actual blob fields

  try {
    const response = await db.models[reg_model].findAndCountAll(qry);

    // Transform blob attributes to Base64
    const transformedData = response.rows.map((record) => {
      const transformedRecord = { ...record.toJSON() };

      blobAttributes.forEach((attr) => {
        if (transformedRecord[attr]) {
          transformedRecord[attr] = `data:image/jpeg;base64,${Buffer.from(transformedRecord[attr]).toString('base64')}`;
        }
      });

      return transformedRecord;
    });

    const result = {
      fromCache: false,
      data: transformedData,
      total: count,
      code: '0000',
    };

    // Cache logic if applicable
    if (req.body.cache_key) {
      const cache_key = req.body.cache_key;
      const cacheDuration = 3600; // Cache duration in seconds
      await redisClient.set(cache_key, JSON.stringify(result), { EX: cacheDuration });
    }

    res.status(200).send(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
    });
  }
};

exports.__modelPaginatedDatafilterByColumn = async (req, res) => {
  console.log('Req-body 002', req.body);

  const reg_model = req.body.model;

  // Base count query
  const baseCountQuery = { where: {} };

  if (req.body.filters && req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length) {
    const lstQuerries = req.body.filters.map((filter, i) => ({ [filter]: req.body.filterValues[i] }));
    baseCountQuery.where = { [Op.and]: lstQuerries };
  }

  const count = await db.models[reg_model].count(baseCountQuery);
  console.log('Base count:', count);

  const associated_multiple_models = req.body.associated_multiple_models || [];
  const nested_models = req.body.nested_models || [];
  const nestedQuery = req.body.nested_filter ? { [req.body.nested_filter[0]]: req.body.nested_filter[1] } : {};

  const qry = {
    include: associated_multiple_models.map((model) => ({ model: db.models[model] })),
    limit: req.body.limit || 10,
    offset: (req.body.page - 1) * (req.body.limit || 10),
    where: baseCountQuery.where,
    order: [['createdAt', 'DESC']],
  };

  if (nested_models.length > 0) {
    const child_model = db.models[nested_models[0]];
    const grand_child_model = db.models[nested_models[1]];

    qry.include.push({
      model: child_model,
      include: [
        {
          model: grand_child_model,
          where: nestedQuery,
        },
      ],
    });
  }

  try {
    const response = await db.models[reg_model].findAndCountAll(qry);

    // Transform blob attributes to Base64 only if they exist in the data
    const transformedData = response.rows.map((record) => {
      const transformedRecord = { ...record.toJSON() };

      Object.keys(transformedRecord).forEach((attr) => {
        if (blobAttributes.includes(attr) && transformedRecord[attr]) {
          transformedRecord[attr] = `data:image/jpeg;base64,${Buffer.from(transformedRecord[attr]).toString('base64')}`;
        }
      });

      return transformedRecord;
    });

    const result = {
      fromCache: false,
      data: transformedData,
      total: count,
      code: '0000',
    };

    // Cache logic if applicable
    if (req.body.cache_key) {
      const cache_key = req.body.cache_key;
      const cacheDuration = 3600; // Cache duration in seconds
      await redisClient.set(cache_key, JSON.stringify(result), { EX: cacheDuration });
    }

    res.status(200).send(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
    });
  }
};









exports.modelPaginatedDatafilterByColumnNoGeo = async (req, res) => {
  console.log('Req-body 002 - ', req.body)
   // console.log('nested filters....>', req.body.nested_filter[0])
 
   var reg_model = req.body.model
 
   // Associated Models
   var associated_multiple_models = req.body.associated_multiple_models
   console.log('associated_multiple_models', associated_multiple_models.length)
 
   // nested Models
   // here me limit to two nesting levels only
   var nested_models = req.body.nested_models
   if (req.body.nested_models) {
     var child_model = db.models[req.body.nested_models[0]]
     var grand_child_model = db.models[req.body.nested_models[1]]
     var nestedQuery = {}
 
     // create the criterial for the grandchild 
     if (req.body.nested_filter) {
       nestedQuery[req.body.nested_filter[0]] = req.body.nested_filter[1]
     }
 
   }
 
   var qry = {}
   var includeModels = []
 
   // loop through the include models
   for (let i = 0; i < req.body.associated_multiple_models.length; i++) {
     var modelIncl = {}
     modelIncl.model = db.models[req.body.associated_multiple_models[i]]
 
     if (req.body.associated_multiple_models[i] === 'users') {
          modelIncl.raw = true
          modelIncl.nested = true
          modelIncl.attributes = ['name', 'email', 'phone'];
 
     }
 
     includeModels.push(modelIncl)
 
 
   }
   var lstQuerries = []
 
   //console.log(includeModels)
   if (associated_multiple_models) {
    if (nested_models) {
      if (req.body.nested_filter) {
        var nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true }
      } else {
        var nestedModels = { model: child_model, include: grand_child_model, raw: true, nested: true }
      }
    
      // Adjust attributes for included/nested models
      if (child_model) {
        nestedModels.attributes = Object.keys(child_model.rawAttributes).filter(attr => attr !== 'geom');
      }
      if (grand_child_model) {
        nestedModels.include[0].attributes = Object.keys(grand_child_model.rawAttributes).filter(attr => attr !== 'geom');
      }
    
      includeModels.push(nestedModels);
      var qry = {
        include: includeModels
      };
    } else {
      console.log('---no---');
    
      // Adjust attributes for included models
      for (const inclModel of includeModels) {
        inclModel.attributes = Object.keys(inclModel.model.rawAttributes).filter(attr => attr !== 'geom');
      }
    
      var qry = {
        include: includeModels
      };
    }
    
 
 
 
 
   } else {
     var qry = {}
   }
 
   console.log('The Querry----->', qry)
   if (req.body.limit ) {
     qry.limit = req.body.limit 
   }
   if (req.body.page ) {
     qry.offset = (req.body.page - 1) * req.body.limit
   }
 
 
 
   if (req.body.filters) {
     if (req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length )  {
      
       var queryFields = {}
       for (let i = 0; i < req.body.filters.length; i++) {
         
         //lstQuerries.push(queryFields)
         var lstValues  = []
         for (let j = 0; j < req.body.filterValues[i].length; j++) {
           lstValues.push(req.body.filterValues[i][j])
         }
         queryFields[req.body.filters[i]] = lstValues
         lstQuerries.push(queryFields)
 
       }
       console.log('Final-7-object------------>', lstQuerries)
 
     }
  
     qry.where = lstQuerries
   }
  
  
   console.log('Final-3-object-------excluding----->', qry)
 
   qry.order=[['id', 'ASC']]
 
   // if involving households decryot the HH name
 
 
 
   const searchString = 'households';
   if (associated_multiple_models) {
 
     console.log(associated_multiple_models)
     if (associated_multiple_models.includes(searchString) ) {
       console.log(`${searchString} is in the array`);
       console.log(qry)
     
               console.log('getting households--x2-->')
               var attributes = []
          
               for( let key in   db.models[reg_model].rawAttributes ){
                 attributes.push(key)
             }
             //   console.log('attributes',attributes)
               var index = attributes.indexOf('name');
               if (index !== -1) {
                   attributes.splice(index, 1);
               }
     
               let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('household.name'), 'bytea'),'***REDACTED***'),'name']
               attributes.push(encrytpedField)
       
           console.log('these attributes', attributes)
       
               
       qry.attributes = attributes
       qry.attributes.exclude = ['password', 'resetPasswordExpires', 'resetPasswordToken','geom'] 
     } else {
 
       console.log('Not hosuehdols.....')
 
       var attributes = []
          
       for( let key in db.models[reg_model].rawAttributes ){
         attributes.push(key)
       }
       
       console.log('excluding.........>>' )
   
       qry.attributes = attributes
       qry.attributes.exclude = ['geom'] 
 
       
     }
     
 
 
 
   }
 
   else {
     
     var attributes = []
          
     for( let key in db.models[reg_model].rawAttributes ){
       attributes.push(key)
     }
     
     console.log('excluding.........>>' )
 
     qry.attributes = attributes
     qry.attributes.exclude = ['geom'] 
  
 
 }
      
 qry.order= [['createdAt', 'DESC']]
 
 
 
 
 //qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] } // will be applciable to users only
 
 console.log("req.body.cache_key")
   if (req.body.cache_key && req.body.cache_key != '') { 
 
     const cache_key = req.body.cache_key;   
     const cacheDuration = 3600; // Cache duration in seconds
 
     
     // get last time it was modified 
     const lastRow = await db.models[reg_model].findOne({
       attributes: ['updatedAt'],
       order: [['updatedAt', 'DESC']]
     });
     
     const lastModified = lastRow ? lastRow.updatedAt: Date.now()
    // console.log(lastModified,req.body.cache_key)
    // console.log("Caching>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")
 
 
     try {
       const cacheResults = await redisClient.get(cache_key);
       if (cacheResults) {
         const result = JSON.parse(cacheResults);
          if (lastModified && lastModified > result.lastModified) {
           // If the database was updated after the cached data was generated, update the cache
           const response = await db.models[reg_model].findAndCountAll(qry);
           await redisClient.set(cache_key, JSON.stringify({
             data: response.rows,
             total: response.count,
             lastModified: Date.now() // Update the last modified timestamp
           }), {
             EX: cacheDuration,
             NX: true,
           });
           res.status(200).send({
             fromCache: false,
             cache_key: cache_key,
             data: response.rows,
             total: response.count,
             code: '0000'
           });
         } else {
           // If the cached data is still valid, return it from the cache
           res.status(200).send({
             fromCache: true,
             cache_key: cache_key,
             data: result.data,
             total: result.total,
             code: '0000'
           });
         }
       } else {
 
         // If no cache data exists, generate new data and store it in the cache
         const response = await db.models[reg_model].findAndCountAll(qry);
         await redisClient.set(cache_key, JSON.stringify({
           data: response.rows,
           total: response.count,
           lastModified: Date.now() // Set the last modified timestamp to current time
         }), {
           EX: cacheDuration,
           NX: true,
         });
 
           //  return it from the cache
           res.status(200).send({
             fromCache: true,
             cache_key: cache_key,
             data: result.data,
             total: result.total,
             code: '0000'
           });
     }
     }
     catch(error) {
       res.status(500).send({
         message: 'Internal server error',
         code: 'SERVER_ERROR'
       });
     }
 
 
 
 
   } else {
 
     console.log("123xxxNo Caching>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>....")
     console.log(qry)
 
     db.models[reg_model].findAndCountAll(qry).then((list) => {
       res.status(200).send({
         fromCache: false,
         data: list.rows,
         total: list.count,
         code: '0000'
       })
     })
 
   }
 
 
 
 }

exports.modelPaginatedDatafilterByColumnM2M = (req, res) => {
  console.log(' 003', req.body)
   // console.log('nested filters....>', req.body.nested_filter[0])
 
   var reg_model = req.body.model
 
   // Associated Models
   var associated_multiple_models = req.body.associated_multiple_models
   console.log('associated_multiple_models', associated_multiple_models.length)
 
   // nested Models
   // here me limit to two nesting levels only
   var nested_models = req.body.nested_models
   if (req.body.nested_models) {
     var child_model = db.models[req.body.nested_models[0]]
     var grand_child_model = db.models[req.body.nested_models[1]]
     var nestedQuery = {}
 
     // create the criterial for the grandchild 
     if (req.body.nested_filter) {
       nestedQuery[req.body.nested_filter[0]] = req.body.nested_filter[1]
     }
 
   }
 
   var qry = {}
   var includeModels = []
 
   // loop through the include models
   for (let i = 0; i < req.body.associated_multiple_models.length; i++) {
     var modelIncl = {}
      modelIncl.model = db.models[req.body.associated_multiple_models[i]]
     modelIncl.raw = true
     modelIncl.nested = true
     modelIncl.through = req.body.associated_multiple_field[i]
     
     includeModels.push(modelIncl)
 
 
   }
   var lstQuerries = []
 
   //console.log(includeModels)
   if (associated_multiple_models) {
     if (nested_models) {
       if (req.body.nested_filter) {
         var nestedModels = { model: child_model, include: [{ model: grand_child_model, where: nestedQuery }], raw: true, nested: true }
       } else {
         var nestedModels = { model: child_model, include: grand_child_model, raw: true, nested: true }
       }
 
       includeModels.push(nestedModels)
       var qry = {
         include: includeModels
       }
     } else {
       console.log('---no---')
       var qry = {
         include: includeModels
       }
     }
 
 
 
 
 
   } else {
     var qry = {}
   }
 
   console.log('The Querry----->', qry)
   if (req.body.limit ) {
     qry.limit = req.body.limit 
  }
  
   if (req.body.page ) {
     qry.offset = (req.body.page - 1) * req.body.limit
   }
 
 
 
   if (req.body.filters) {
     if (req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length )  {
      
       var queryFields = {}
       for (let i = 0; i < req.body.filters.length; i++) {
         
         //lstQuerries.push(queryFields)
         var lstValues  = []
         for (let j = 0; j < req.body.filterValues[i].length; j++) {
           lstValues.push(req.body.filterValues[i][j])
         }
         queryFields[req.body.filters[i]] = lstValues
         lstQuerries.push(queryFields)
 
       }
       console.log('Final-7-object------------>', lstQuerries)
 
     }
  
     qry.where = lstQuerries
   }
   console.log('Final-3-object------------>', qry)
 
 
 
 
   // if involving households decryot the HH name
 
 
 
   const searchString = 'households';
   if (associated_multiple_models) {
 
     console.log(associated_multiple_models)
     if (associated_multiple_models.includes(searchString) ) {
       console.log(`${searchString} is in the array`);
       console.log(qry)
     
               console.log('getting households--3-->')
               var attributes = []
          
               for( let key in   db.models[reg_model].rawAttributes ){
                 attributes.push(key)
             }
             //   console.log('attributes',attributes)
               var index = attributes.indexOf('name');
               if (index !== -1) {
                   attributes.splice(index, 1);
               }
     
               let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('household.name'), 'bytea'),'***REDACTED***'),'name']
                 attributes.push(encrytpedField)
       
               
       qry.attributes = attributes
       qry.attributes.exclude = ['password', 'resetPasswordExpires', 'resetPasswordToken'] 
      }
  }
   else {
     
     qry.attributes = { exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'] } // will be applciable to users only
 
 }
      
 
   db.models[reg_model].findAndCountAll(qry).then((list) => {
     res.status(200).send({
       data: list.rows,
       total: list.count,
       code: '0000'
     })
   })
 }

 
 
exports._modelPaginatedDatafilterBykeyWord = async (req, res) => {
  try {
    console.log('/api/v1/data/paginated/filter --- Keyword', req.body);

    // Extract request body properties
    const {
      model: reg_model,
      searchField: field,
      excludeGeom,
      excludeGeomAssoc,
      searchKeyword,
      associated_multiple_models: associatedModels = [],
      nested_models: nestedModels = [],
      filters = [],
      filterValues = [],
      limit = 20,
      page = 1,
    } = req.body;

    // Initialize variables
    const includeModels = [];
    const queryCondition = {};

    // Set nested models if available
    const [childModel, grandChildModel] = nestedModels.map(nested => db.models[nested]);

    // Prepare associated models for inclusion
    if (associatedModels.length > 0) {
      associatedModels.forEach(modelName => {
        const model = db.models[modelName];
        includeModels.push({
          model: model,
          raw: true,
          nested: true,
          attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
        });
      });

      // Add nested models to the include list if they are present
      if (childModel && grandChildModel) {
        includeModels.push({
          model: childModel,
          include: [{
            model: grandChildModel,
            raw: true,
            nested: true,
            attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
          }],
          raw: true,
          nested: true,
          attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
        });
      }
    }

    // Build query
    const qry = {
      include: includeModels,
      attributes: excludeGeom ? { exclude: ['geom'] } : undefined, // Exclude geometry from the main model
    };

    // Add multiple filters if provided
    if (filters.length > 0 && filterValues.length > 0) {
      filters.forEach((filter, index) => {
        queryCondition[filter] = filterValues[index];
      });
    }

    // Add search condition if searchField and searchKeyword are provided
    if (field && searchKeyword) {
      queryCondition[field] = {
        [Op.iLike]: `%${searchKeyword.toLowerCase()}%`,
      };
      // If there is a searchKeyword, do not limit the number of results
      //qry.limit = undefined; // Remove the limit
    } else {
      // Apply pagination limit and offset if no searchKeyword
      //qry.limit = limit;
      //qry.offset = (page - 1) * limit;
    }

    qry.where = queryCondition;

    console.log('The xQuery----->', qry);

    // Execute the query
    const list = await db.models[reg_model].findAndCountAll(qry);

    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
    });
  } catch (error) {
    console.error('Error in modelPaginatedDatafilterBykeyWord:', error);
    res.status(500).send({
      error: 'Internal Server Error',
      code: '9999',
    });
  }
};

 
exports.modelPaginatedDatafilterBykeyWord = async (req, res) => {
  try {
    console.log('/api/v1/data/paginated/filter --- Keyword', req.body);

    // Extract request body properties
    const {
      model: reg_model,
      searchField: field,
      excludeGeom,
      excludeGeomAssoc,
      searchKeyword,
      associated_multiple_models: associatedModels = [],
      nested_models: nestedModels = [],
      filters = [],
      filterValues = [],
      limit = 20,
      page = 1,
    } = req.body;

    // Initialize variables
    const includeModels = [];
    const queryCondition = {};

    // Set nested models if available
    const [childModel, grandChildModel] = nestedModels.map(nested => db.models[nested]);

    // Prepare associated models for inclusion
    if (associatedModels.length > 0) {
      associatedModels.forEach(modelName => {
        const model = db.models[modelName];
        includeModels.push({
          model: model,
          raw: true,
          nested: true,
          attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
        });
      });

      // Add nested models to the include list if they are present
      if (childModel && grandChildModel) {
        includeModels.push({
          model: childModel,
          include: [{
            model: grandChildModel,
            raw: true,
            nested: true,
            attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
          }],
          raw: true,
          nested: true,
          attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
        });
      }
    }

    // Build query
    const qry = {
      include: includeModels,
      attributes: excludeGeom ? { exclude: ['geom'] } : undefined, // Exclude geometry from the main model
    };

    // Add multiple filters if provided
    if (filters.length > 0 && filterValues.length > 0) {
      filters.forEach((filter, index) => {
        queryCondition[filter] = filterValues[index];
      });
    }

    // Add search condition if searchField and searchKeyword are provided
    if (field && searchKeyword) {
      queryCondition[field] = {
        [Op.iLike]: `%${searchKeyword.toLowerCase()}%`,
      };
    }

    // Apply pagination if no searchKeyword is present
    if (!searchKeyword) {
      qry.limit = limit;
      qry.offset = (page - 1) * limit;
    }

    qry.where = queryCondition;

    console.log('The xQuery----->', qry);

    // Execute the query
    const list = await db.models[reg_model].findAndCountAll(qry);

    // Process each item to check for BLOB fields (cover_photo)
    const results = await Promise.all(list.rows.map(async (item) => {
      if (item.cover_photo) {
        try {
          // Convert BLOB field (cover_photo) to Base64 if it exists
          const coverPhotoBase64 = item.cover_photo.toString('base64');
          item.cover_photo = `data:image/jpeg;base64,${coverPhotoBase64}`;
        } catch (err) {
          console.error('Error converting cover photo to base64:', err);
          item.cover_photo = null; // Fallback to null if conversion fails
        }
      }
      
      // Return the item with all other fields intact
      return item;
    }));

    // Send the response with the processed data
    res.status(200).send({
      data: results,
      total: list.count,
      code: '0000',
    });
  } catch (error) {
    console.error('Error in modelPaginatedDatafilterBykeyWord:', error);
    res.status(500).send({
      error: 'Internal Server Error',
      code: '9999',
    });
  }
};



exports.modelLookup = async (req, res) => {
  try {
    console.log('modelLookup --- Request', req.body);

    // Extract request body properties
    const {
      model: reg_model,
      excludeGeom,
      associated_multiple_models: associatedModels = [],
      nested_models: nestedModels = [],
      filters = [],
      filterValues = [],
    } = req.body;

    // Initialize variables
    const includeModels = [];
    const queryCondition = {};

    // Set nested models if available
    const [childModel, grandChildModel] = nestedModels.map(nested => db.models[nested]);

    // Prepare associated models for inclusion
    if (associatedModels.length > 0) {
      associatedModels.forEach(modelName => {
        const model = db.models[modelName];
        includeModels.push({
          model: model,
          raw: true,
          nested: true,
          attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
        });
      });

      // Add nested models to the include list if they are present
      if (childModel && grandChildModel) {
        includeModels.push({
          model: childModel,
          include: [{
            model: grandChildModel,
            raw: true,
            nested: true,
            attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
          }],
          raw: true,
          nested: true,
          attributes: excludeGeomAssoc ? { exclude: ['geom'] } : undefined, // Adjust the geometry field name
        });
      }
    }

    // Build query
    const qry = {
      include: includeModels,
      attributes: excludeGeom ? { exclude: ['geom'] } : undefined, // Exclude geometry from the main model
    };

    // Add multiple filters if provided
    if (filters.length > 0 && filterValues.length > 0) {
      filters.forEach((filter, index) => {
        queryCondition[filter] = filterValues[index];
      });
    }

    qry.where = queryCondition;

    console.log('The Query----->', qry);

    // Execute the query
    const list = await db.models[reg_model].findAll(qry); // Changed to findAll to get all records

    res.status(200).send({
      data: list,
      code: '0000',
    });
  } catch (error) {
    console.error('Error in modelPaginatedDatafilterBykeyWord:', error);
    res.status(500).send({
      error: 'Internal Server Error',
      code: '9999',
    });
  }
};




exports.modelCountyUsers = (req, res) => {
  var reg_model = req.query.model
  var pg_number = req.query.page
  var limit = req.query.limit
  var sort = req.query.sort
  var county = req.query.county_id
  var curUSer = req.query.curUser

  console.log('modelCountyUsers ------->', req.query)

  console.log('Sort:order', req.query.sort)
  console.log('Model', reg_model)
  console.log('Limit', limit)

  var qry = {}

  if (reg_model === 'users') {
    //   console.log("Include for users......")
    qry.offset = (req.query.page - 1) * req.query.limit
      ; (qry.limit = limit), (qry.where = { county_id: county, id: { [op.ne]: curUSer } }) // Exclude the logged in user returing in the list
    qry.order = [['id', sort]]
  } else {
    ; (qry.offset = pg_number * limit), (qry.limit = limit), (qry.order = [['id', sort]])
  }

  console.log('The Querry', qry)
  db.models[reg_model].findAndCountAll(qry).then((list) => {
    console.log(list.count)
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: 20000
    })
  })
}


exports.modelGetParentIDS = (req, res) => {
  var reg_model = req.body.parent
 
  db.models[reg_model].findAll({
    attributes: ['id', 'code']
  }).then((list) => {
    res.status(200).send({
      data: list,
      code: "0000"
    })
  })
}
 
 




 





exports.getFieldQUnique = async (req, res) => {
  var reg_model = req.body.model;
  var selField = req.body.selectedField;

  try {
    const Model = db.models[reg_model];
    
    // Find all unique values in the specified field
    const uniqueValues = await Model.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col(selField)), selField],
      ],
    });

    // Extract the unique values from the Sequelize result
    const data = uniqueValues.map(value => value.dataValues[selField]);

    res.status(200).send({
      data,
      code: '0000',
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send({
      error: 'An error occurred',
      code: '5000',
    });
  }
};




const multer = require('multer');

const uploadDir = '/data/uploads';


// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  console.log('Create Folder if not esists ')
  fs.mkdirSync(uploadDir, { recursive: true });
} else {
  console.log('Folder exists. Skipping ')
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/data/uploads'); // Define the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original file name
  },
});




const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit (adjust as needed)
  },
});


 


exports.batchDocumentsUpload = (req, res) => {
  // The uploaded files can be accessed using `req.files`
// Use `upload.array('files')` middleware to handle multiple file uploads
// 'files' should match the name attribute of the file input(s) in your form
upload.array('files')(req, res, async (err) => {
if (err) {
  console.log(err);
  // Handle multer errors, if any
 // return res.status(400).json({ error: 'File upload failed.' });
 return res.status(500).send({
    message: 'Upload failed.',
    code: '0000'
  })
}


var reg_model = 'document'
let myFiles = req.files
let objs = []


 console.log('req.field_id:', req.field_id);



if (!Array.isArray(myFiles)) {
  myFiles = [myFiles]; // Convert to an array with one element
}


for (let i = 0; i < myFiles.length; i++) {
  
  console.log('doc#',i, myFiles[i], req.body )
  
   var obj = {}
 // var column = req.body.field_id[i]
 // obj[column] = req.body[column][i]

    // Check if 'field_id' exists in 'req.body' before adding 'column' property to 'obj'
  if (req.body.field_id) {
    var column = req.body.field_id[i]
          if (myFiles.length >1) {
            obj[column] = req.body[column][i];
            obj.category = req.body.category[i]
            obj.format = req.body.format[i]
            obj.size = req.body.size[i]
            obj.createdBy = req.body.createdBy[i] 
            obj.protectedFile = req.body.protected[i] 
            obj.name = myFiles[i].originalname
            obj.location = myFiles[i].path
            obj.code = crypto.randomUUID()
            objs.push(obj)

          } else {
            var column = req.body.field_id
            obj[column] = req.body[column];
            obj.format = req.body.format 
            obj.size = req.body.size 
            obj.createdBy = req.body.createdBy[i] 
            obj.protectedFile = req.body.protected[i] 
            obj.name = myFiles[i].originalname
            obj.location = myFiles[i].path
            obj.code = crypto.randomUUID()

            obj.format = req.body.format 
            obj.category = req.body.category
 
            objs.push(obj)

          }
       } else {

        if (myFiles.length >1) {
          obj.category = req.body.category[i]
          obj.format = req.body.format[i]
          obj.size = req.body.size[i]
          obj.createdBy = req.body.createdBy[i] 
          obj.protectedFile = req.body.protected[i] 
          obj.name = myFiles[i].originalname
          obj.location = myFiles[i].path
          obj.code = crypto.randomUUID()
          objs.push(obj)

        } else {
          obj.format = req.body.format 
          obj.size = req.body.size 
          obj.createdBy = req.body.createdBy[i] 
          obj.protectedFile = req.body.protected[i] 
          obj.name = myFiles[i].originalname
          obj.location = myFiles[i].path
          obj.code = crypto.randomUUID()

          obj.format = req.body.format 
          obj.category = req.body.category



          objs.push(obj)

        }

  }




}

console.log('objs#',  objs )




try {
  //await db.models[reg_model].create(obj)
 for (const nobj of objs) {
  console.log('inserting....., ', nobj)
   await db.models[reg_model].create(nobj);


 }

 res.status(200).send({
  message: 'Batch Upload Successful',
  code: '0000'
})

}
     
catch (error) {
 console.log(error)

 
res.status(500).send({
 message: 'Upload failed. ' + error + ' errors',
 code: '0000'
})
}




// Other form fields (if any) can be accessed using `req.body`
//  console.log('other form fields:', req.body);

// Process the files or respond to the client accordingly
// res.json({ message: 'Form submission and file upload successful!' });
});
};

 
exports.batchDocumentsUploadCover = (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send({
        message: 'File upload failed.',
        code: '0000',
      });
    }

    const { model, id } = req.body;

    if (!model || !id) {
      return res.status(400).send({
        message: 'Missing required fields: model or id',
        code: '0001',
      });
    }

    try {
      // Access the uploaded file
      const file = req.file;

      if (!file) {
        return res.status(400).send({
          message: 'No file uploaded.',
          code: '0002',
        });
      }

      // Read the file from disk and convert it to a buffer
      const fileBlob = fs.readFileSync(file.path);

      // Update the record in the database
      const record = await db.models[model].findByPk(id);

      if (!record) {
        return res.status(404).send({
          message: `No record found for model "${model}" with ID ${id}.`,
          code: '0003',
        });
      }

      // Update the specific field to store the blob
      record.cover_photo = fileBlob; // Assuming the field name is `cover_photo`
      await record.save();

      console.log(`Updated record for model: ${model}, ID: ${id}`);

      res.status(200).send({
        message: 'Cover photo uploaded and saved successfully.',
        code: '0000',
      });
    } catch (error) {
      console.error('Error saving cover photo:', error);
      res.status(500).send({
        message: 'An error occurred while uploading the cover photo.',
        code: '0004',
      });
    }
  });
};


exports.ReportDocumentationUpload = async (req, res) => {

  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.log(err);
      // Handle multer errors, if any
      // return res.status(400).json({ error: 'File upload failed.' });
      return res.status(500).send({
        message: 'Upload failed.',
        code: '0000'
      })
    }


    console.log(req.files)
    var column = req.body.column

    if (!req.files) {
      return res.status(500).send({ msg: 'file is not found:ReportDocumentationUpload' })
    }
    console.log('In upload single.....', req.files.file)
    console.log('In upload  multiple express.....', req.files.file.length)

    if (Array.isArray(req.files.file)) {

      var myFiles = req.files.file

    } else {
      var myFiles = [req.files.file]


    }
    // accessing the file
    var arr = req.body.DocType
    //let ftypes = arr.split(',')

    const parent_code = req.body.parent_code

    console.log('myFiles', myFiles.length)

    // Run for more than one document

    
    var errors = []

    for (let i = 0; i < myFiles.length; i++) {
      // Sin
 
      let fname = parent_code + '_' + myFiles[i].name.replace(/\s/g, '_')
      let location = `./public/${fname}`
      var thisFile = {
        type: req.body.DocType[i],
        name: fname,
        file_path: `./public/${fname}`,
        group: req.body.grp
      }
      console.log('Thisfile', thisFile, req.body.model)
      var reg_model = 'document'
      var obj = {}
      obj.name = fname
      obj.category = req.body.grp
      obj.format = req.body.DocType[i]
      obj.location = `./public/${fname}`
      obj[column] = req.body.parent_code
      obj.code = crypto.randomUUID()

      console.log("kinsert Object", obj)
      // insert
      await db.models[reg_model].create(obj)
        .then(function (item) {
          console.log("Movig to public...", location)
          myFiles[i].mv(location)
        
        })
        .catch(function (err) {
          // handle error;
          console.log('error0---3------->', err)
          errors.push(err)

          if (err.name == 'SequelizeUniqueConstraintError') {
            var message = 'One or more table constraints are violated. Check your id columns'
          } else {
            var message = 'The uploaded file does not match the required fields'
          }
          return res.status(500).send({ message: message })
        })
    }
    if (errors.length === 0) {
      res.status(200).send({
        message: 'Upload Successful',
        code: '0000'
      })
  

    } else {

      res.status(500).send({
        message: 'Upload failed. There are ' + errors.length + ' errors',
        code: '0000'
      })
    }


  })
}


 
exports.xbatchDocumentsUploadByParentCode = async (req, res) => {


  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.log(err);
      // Handle multer errors, if any
      // return res.status(400).json({ error: 'File upload failed.' });
      return res.status(500).send({
        message: 'Upload failed.',
        code: '0000'
      })
    }



  //  const uploadsDir = path.join(__dirname, '../../../..', 'uploads');

    if (!req.files) {
      return res.status(500).send({ msg: 'file is not found :batchDocumentsUploadByParentCode' })
    }

    var myFiles =req.files
    // if (Array.isArray(req.files.file)) {

    //   myFiles = req.files.file
    //   console.log('In upload  multiple express.....', req.files.file)

    // } else {
    //   // var myFiles = [req.files.file]
    //   myFiles.push(req.files.file)
    //   console.log('In upload single.....', req.files.file)
  
    // }

    console.log('files to upload',myFiles )
    console.log('Properties Document',req.body )
 
    var errors = []

    for (let i = 0; i < myFiles.length; i++) {
      // Sin
      var obj = {}
      if (myFiles.length > 1) {
        var column = req.body.field_id[i]
        obj.category = req.body.category[i]
        obj.format = req.body.format[i]
        obj.size = req.body.size[i]
        obj.createdBy = req.body.createdBy[i]
        obj.protectedFile = req.body.protected[i]


        await db.models[req.body.model[i]]
          .findOne({
            where: {
              code: {
                [Op.eq]: req.body.pcode[i]
              }
            }
          })
          .then((record) => {
            if (record) {
              obj[column] = record.id;
            } else {
              obj[column] = '';
            }
          });
    
          // obj.name = myFiles[i].originalname
          // obj.code = crypto.randomUUID()
          // obj.location = myFiles[i].path
      

      } else {
        var column = req.body.field_id
        //obj[column] = req.body[column]
        obj.category = req.body.category
        obj.format = req.body.format
        obj.size = req.body.size
        obj.createdBy = req.body.createdBy
        obj.protectedFile = req.body.protected


        await db.models[req.body.model]
          .findOne({
            where: {
              code: {
                [Op.eq]: req.body.pcode
              }
            }
          })
          .then((record) => {
            if (record) {
              obj[column] = record.id;
            } else {
              obj[column] = '';
            }
          });
    

      
      
        console.log("KEY>>>", column, obj[column])

      }
      if (obj[column] === '' || obj.category === 'undefined') {
        errors.push('The field' + column + ' is required')

      } else {
        let fname = myFiles[i].originalname
        //let location = `./public/${fname}`
        //let location = uploadsDir + '/' + fname
      
      
        console.log(i, '----', column)
        obj.name = fname
        obj.location =  myFiles[i].path
  
        obj.code = crypto.randomUUID()
     
        var reg_model = 'document'
        console.log("insert Object", obj)
  
        try {
          await db.models[reg_model].create(obj)
            .then(function (item) {
             // console.log("Moving to public...", location)
           //   myFiles[i].mv(location)
            })
        }
            
        catch (error) {
          // handle error;
          console.log(error)
          errors.push('Failed to upload attachments.')
 
        }

      }
  
    }

    // Send message

    if (errors.length === 0) {
      res.status(200).send({
        message: 'Upload via App Successful',
        code: '0000'
      })
  

    } else {

      res.status(500).send({
        message: 'Upload failed. ' + errors + ' errors',
        code: '0000'
      })
    }
  })
}
exports.batchDocumentsUploadByParentCode = async (req, res) => {


  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.log(err);
        return res.status(500).send({
        message: 'Upload failed.',
        code: '0000'
      })
    } 
    if (!req.files) {
      return res.status(500).send({ msg: 'file is not found :batchDocumentsUploadByParentCode' })
    }

    var myFiles =req.files
  

    console.log('files to upload',myFiles )
    console.log('Properties Document',req.body )
 
    var errors = []
    var objs =[]

    for (let i = 0; i < myFiles.length; i++) {
      // Sin
  
        var obj = {}

        var column = req.body.field_id
        obj.type = req.body.type
        obj.format = req.body.format
        obj.size = req.body.size
        obj.createdBy = req.body.createdBy
        obj.category = req.body.category
        obj.protectedFile = req.body.protected
        obj.public = req.body.public 

        obj.name = myFiles[i].originalname
        obj.location =  myFiles[i].path
  
        obj.code = crypto.randomUUID()
        try {
          await db.models[req.body.model]
            .findAll({
              where: {
                code: {
                  [Op.eq]: req.body.pcode
                }
              }
            })
            .then((records) => {
              if (records && records.length > 0) {
                const recordIds = records.map((record) => record.id);
                recordIds.forEach((recordId) => {
        
                  // Create a shallow copy of the old object
                  const newObj = { ...obj };
        
                  // Add the new property with its value
                  newObj[column] = recordId;
                  // Push newObj into the array
                  objs.push(newObj);
        
                  // Perform any other actions with obj[column] as needed
                });
              } else {
                obj[column] = '';
              }
            });
        } catch (error) {
          // Handle the error here
          console.error("An error occurred:", error);
        }
        
     

    //  }
  
    }

    // Send message

    
    var reg_model = 'document'
    // console.log("insert Objects", objs)


     try {
       for (const eobj of objs) {
          console.log(eobj)
         await db.models[reg_model].create(eobj)
           .then(function () {
             console.log('-----')
           });
       }
     }  
     

         
     catch (error) {
       // handle error;
       console.log(error)
       errors.push('Failed to upload attachments.')

     }



    if (errors.length === 0) {
      res.status(200).send({
        message: 'Upload via App Successful',
        code: '0000'
      })
  

    } else {

      res.status(500).send({
        message: 'Upload failed. ' + errors + ' errors',
        code: '0000'
      })
    }
  })
}


exports.modelUpload = (req, res) => {
  console.log('xxxx', req.body.createdBy) 
 

  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.log(err);
      // Handle multer errors, if any
      // return res.status(400).json({ error: 'File upload failed.' });
      return res.status(500).send({
        message: 'Upload failed.',
        code: '0000'
      })
    }


    if (!req.files) {
      return res.status(500).send({ msg: 'file is not found :modelUpload' })
    }
    console.log('In upload express.....', req.body.DocTypes)
    // accessing the file
    var arr = req.body.DocTypes
    let ftypes = arr.split(',')

    const myFiles = req.files.file
    const settlement_name = req.body.settlement_name

    console.log('myFiles', myFiles.length)

    // Run for more than one document


        
          // obj.name = myFiles[i].originalname
          // obj.code = crypto.randomUUID()
          // obj.location = myFiles[i].path
      

    
    if (myFiles.length > 0) {
      var objs = []

      for (let i = 0; i < myFiles.length; i++) {
        //  mv() method places the file inside public directory
        
        var fname = settlement_name + '_' + myFiles[i].originalname
        var doctype = ftypes[i]
        console.log(ftypes[i])

        if (
          doctype == 'socio_economic' ||
          doctype == 'stakeholder_report' ||
          doctype == 'planning_report' ||
          doctype == 'basemap_report' ||
          doctype == 'esia_report'
        ) {
          var group = 'Report'
        }

        if (doctype == 'ldpdp' || doctype == 'pdp') {
          var group = 'Development Plan'
        }

        if (doctype == 'survey_plan' || doctype == 'rim') {
          var group = 'Map'
        }

        if (doctype == 'design' || doctype == 'built') {
          var group = 'Drawing'
        }

        var thisFile = {
          type: doctype,
          name: fname,
          file_path: myFiles[i].path,
          settlement_id: req.body.settlement_id,
          group: group
        }
        objs.push(thisFile)
      }

      console.log('Multiple Files:', objs)

      db.models.settlement_uploads
        .bulkCreate(objs)
        .then(function () {
            // return models.DiscoverySource.findAll();
          res.status(200).send({
            message: 'Saved succesfully',
            code: '0000'
          })
          console.log('upload data have been saved')
        })
        .catch(function (error) {
          res.send(error.errors)
          console.log('Error during Post: ' + error)
        })
    } else {
      // Sin
      var objs = []
      var fname = settlement_name + '_' +  myFiles[i].originalname
      var doctype = ftypes
      console.log('ftypes:', ftypes[0])

      if (
        doctype == 'socio_economic' ||
        doctype == 'stakeholder_report' ||
        doctype == 'planning_report' ||
        doctype == 'basemap_report' ||
        doctype == 'esia_report'
      ) {
        var group = 'Report'
      }

      if (doctype == 'ldpdp' || doctype == 'pdp') {
        var group = 'Development Plan'
      }

      if (doctype == 'survey_plan' || doctype == 'rim') {
        var group = 'Map'
      }

      if (doctype == 'design' || doctype == 'built') {
        var group = 'Drawing'
      }

      var thisFile = {
        type: ftypes[0],
        name: fname,
        file_path: `./public/${fname}`,
        settlement_id: req.body.settlement_id,
        group: group
      }
      objs.push(thisFile)

      console.log('Thisfile', thisFile)

      db.models.settlement_uploads
        .bulkCreate(objs)
        .then(function () {
          // var fname = settlement_name+"_"+myFiles.name
          //myFiles.mv(`./public/${fname}`)

          // return models.DiscoverySource.findAll();
          res.status(200).send({
            message: 'One File Saved succesfully',
            code: '0000'
          })
        })
        .catch(function (error) {
          res.send(error.errors[0])
          console.log('Error during Post: ' + error)
        })
    }
  })
}

 
exports.xdownloadFile = (req, res) => {
  console.log("Received files:", req.body);

  const uploadedFile = path.join('/data/uploads' , req.body.filename);

  console.log(uploadedFile);

  // Check if the file exists
  fs.access(uploadedFile, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(err);
   

      db.models.document.destroy({ where: { name: req.body.filename } })
      .then((result) => {
        console.log('succeed')
        res.status(500).send({
          message: 'File not found.',
          code: '0000'
        });
    }) 

      
    } else {
      // File exists, send it
      res.sendFile(uploadedFile, function(err) {
        if (err) {
          console.log(err);
          res.status(500).send({
            message: 'Download failed. Error occurred.',
            code: '0000'
          });
        } else {
          // File sent successfully
          // Handle success logic here if needed
          res.status(200).send({
            message: 'File Found. Downloading...',
            code: '0000'
          });
        }
      });
    }
  });
};

exports.downloadFile = (req, res) => {
  console.log("Received files:", req.body);

  const uploadedFile = path.join('/data/uploads' , req.body.filename);

  console.log(uploadedFile);

  // Check if the file exists
  fs.access(uploadedFile, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(err);
   

      db.models.document.destroy({ where: { name: req.body.filename } })
      .then(() => {
        console.log('succeed')
        res.status(500).send({
          message: 'File not found.',
          code: '0000'
        });
    }) 

      
    } else {
      // File exists, send it
    //  res.sendFile(path.resolve(filePath));

      res.sendFile(path.resolve(uploadedFile), function(err) {
        if (err) {
          console.log(err);
          res.status(500).send({
            message: 'Download failed. Error occurred.',
            code: '0000'
          });
        } else {
          // File sent successfully
          // Handle success logic here if needed
          // res.status(200).send({
          //   message: 'File Found. Downloading...',
          //   code: '0000'
          // });
        }
      });
    }
  });
};




exports.RemoveDocument = (req, res) => {
  var reg_model = 'document'  
  let errors =[]
  console.log("Removing files:", req.body.filesToDelete )
 
  for (let i = 0; i < req.body.filesToDelete.length; i++) {

    if (typeof(req.body.filesToDelete[i]) == 'object') { 

    //  var filePath = './public/' + req.body.filesToDelete[i].name;

    const filePath = path.join('/data/', 'uploads', req.body.filesToDelete[i].name );

      fs.unlinkSync(filePath);
    
      db.models[reg_model].destroy({ where: { name: req.body.filesToDelete[i].name } })
        .then((result) => {
       console.log('object succeed')
      }) 
      .catch(function (err) {
        // handle error;
        console.log('error0---------->', err)
        errors.push(err)
  
      })
    } else {

     // var filePath = './public/' + req.body.filesToDelete[i];
      const filePath = path.join('/data/', 'uploads', req.body.filesToDelete[i]);

       fs.unlinkSync(filePath);
    
      db.models[reg_model].destroy({ where: { name: req.body.filesToDelete[i] } })
        .then((result) => {
       console.log('delete succeed')
      }) 
      .catch(function (err) {
        // handle error;
        console.log('error0---------->', err)
        errors.push(err)
  
      })

    }
 

    if (errors.length ===0) {
      res.status(200).send({
        message: 'Delete Successful',
        code: '0000'
      })
    } else {
      res.status(500).send({
        message: 'Delete Failed',
        code: '0000'
      })
    }
  
    }



}




/// Submit  New settlments to ODK Central
 
// Define the endpoint URL and bearer token

 
// Function to send a POST request with the array of JSON objects
async function sendSettDataToODK(settArray) {

  // Construct the request body as a JSON object
  const requestBody = {
    email: 'kisip.mis@gmail.com',
    password: '***REDACTED***'
  };

  let token;

  // Login and get a token
  request({
    method: 'POST',
    url: 'https://collector.kesmis.go.ke/v1/sessions',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody) // Convert the object to a JSON string
  }, async function (error, response, body) {
    if (!error && response.statusCode === 200) {
      // Parse the JSON response
      const responseBody = JSON.parse(body);
      // Extract the token from the response
      token = responseBody.token;

      const endpointUrl = 'https://collector.kesmis.go.ke/v1/projects/1/datasets/settlements/entities';
      const bearerToken = token; // Use the extracted token here

      try {
        for (let i = 0; i < settArray.length; i++) {
          // Send a POST request to the endpoint with the array of JSON objects as the request body

          // get the county where this settlement belongs
          let county = await db.models.county.findOne({
            where: {
              id: {
                [Op.eq]: settArray[i].county_id,
              }
            }
          });

          let settObj = {
            "uuid": uuidv4(),
            "label": settArray[i].name,
            "data": {
              "county_name": county.name,
              "sett_name": settArray[i].name,
              "code": settArray[i].code,
            }
          };

          request({
            method: 'POST',
            url: endpointUrl,
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(settObj) // Convert the object to a JSON string
          }, function (error, response) {
            if (!error && response.statusCode === 200) {
              console.log(`Successfully sent data: ${JSON.stringify(settObj)}`);
            } else {
              console.error(`Failed to send data: ${JSON.stringify(settObj)}`);
              console.error(`Response status code: ${response.statusCode}`);
              console.error(`Response content: ${response.body}`);
            }
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      // Handle errors here
      console.error('Error:', error);
    }
  });
}


// Function to send a POST request with the array of JSON objects
async function deleteSettlementDataFromODK(settToDelete) {

  console.log("here to delete the settlement from ODK")
  // Construct the request body as a JSON object
  const requestBody = {
    email: 'kisip.mis@gmail.com',
    password: '***REDACTED***'
  };

  let token;

  // Login and get a token
  request({
    method: 'POST',
    url: 'https://collector.kesmis.go.ke/v1/sessions',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody) // Convert the object to a JSON string
  }, async function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('Logged in')
      const responseBody = JSON.parse(body);

      token = responseBody.token;

      // get all entities 
      request({
        method: 'GET',
        url: 'https://collector.kesmis.go.ke/v1/projects/1/datasets/settlements.svc/entities',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }, function (error, response, body) {
        
        if (!error && response.statusCode === 200) {
          console.log(body)
          let entities = JSON.parse(body);

          console.log(entities)

          const targetCode =settToDelete.code; // The code you want to filter by

 
          const filteredEntity = entities.value.filter(item => item.code === targetCode);
          console.log("filteredEntity",filteredEntity,settToDelete.code )

          // Now we have the entity - Delete it from dataasets
         //   /projects/16/datasets/people/entities/54a405a0-53ce-4748-9788-d23a30cc3afa
          // delete only if such an entiry is found 
          if (filteredEntity.length>0) {
            let url = 'https://collector.kesmis.go.ke/v1/projects/1/datasets/settlements/entities/'+filteredEntity[0].__id
   
            request({
              method: 'DELETE',
              url: url,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            },
              function (error, response, body) { 
                console.log('Delete Successful')
                console.log(response)
              }
            )
          }
       
              
     
        } else {
          // Handle errors here
          console.error('Error:', error);
          
        }
      });









    } else {
      // Handle errors here
      console.error('Error:', error);
    }
  });
}



// Function to send a POST request with the array of JSON objects
async function updateSettlementDataInODK(settToUpdate) {

  console.log("here to update the settlement in ODK")
  // Construct the request body as a JSON object
  const requestBody = {
    email: 'kisip.mis@gmail.com',
    password: '***REDACTED***'
  };

  let token;

  // Login and get a token
  request({
    method: 'POST',
    url: 'https://collector.kesmis.go.ke/v1/sessions',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody) // Convert the object to a JSON string
  }, async function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('Logged in')
      const responseBody = JSON.parse(body);

      token = responseBody.token;
 
      // get all entities 
      request({
        method: 'GET',
        url: 'https://collector.kesmis.go.ke/v1/projects/1/datasets/settlements.svc/entities',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }, function (error, response, body) {
        
        if (!error && response.statusCode === 200) {
        //  console.log(body)
          let entities = JSON.parse(body);

           console.log(settToUpdate)

          const targetCode =settToUpdate.code; // The code you want to filter by

 
          const filteredEntity = entities.value.filter(item => item.code === targetCode);
        //  console.log("filteredEntity",filteredEntity[0].__id )

          // Now we have the entity - Delete it from dataasets
         //   /projects/16/datasets/people/entities/54a405a0-53ce-4748-9788-d23a30cc3afa
          // delete only if such an entiry is found 

          
          //https://private-anon-90cf62d59f-odkcentral.apiary-mock.com/projects/projectId/datasets/name/entities/uuid
          
          
          
      let settObj = {
         "label": settToUpdate.name,
        "data": {
          "sett_name": settToUpdate.name,
       
      
         }
      };


          
          
          if (filteredEntity.length>0) {
            let url = 'https://collector.kesmis.go.ke/v1/projects/1/datasets/settlements/entities/'+filteredEntity[0].__id+'?force=true'
             request({
              method: 'PATCH',
              url: url,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(settObj) // Convert the object to a JSON string

            },
              function (error, response, body) { 
                console.log('Update ODK....... Successful')
               console.log(response.body)
              }
            )
          }
       
              
     
        } else {
          // Handle errors here
          console.error('Error:', error);
          
        }
      });









    } else {
      // Handle errors here
      console.error('Error:', error);
    }
  });
}

 
 
exports.filterRepository = async (req, res) => {
  try {
    const searchTerm = req.body.searchTerm; // Assuming you get the filter value in the request body
    console.log(req.body);

    const page = req.body.page || 1; // Page number (default to 1)
    const pageSize = 5; // Number of records per page
    const offset = (page - 1) * pageSize; // Calculate the offset based on the page and page size



    const filteredData = await db.models.document.findAll({
      where: {
        [Op.or]: [
          {
            // Search in the main model (Document) columns
            name: {
              [Op.iLike]: `%${searchTerm.toLowerCase()}%`,
            },
          },

          {
            // Search in the main model (Document) columns
            format: {
              [Op.iLike]: `%${searchTerm.toLowerCase()}%`,
            },
          },

          {
            // Search in the related model (Settlement) columns
            '$settlement.name$': {
              [Op.iLike]: `%${searchTerm.toLowerCase()}%`,
            },
          },
          {
            // Search in the related model (document_type) columns
            '$document_type.type$': {
              [Op.iLike]: `%${searchTerm.toLowerCase()}%`,
            },
          },
          {
            // Search in the related model (document_type) columns
            '$document_type.group$': {
              [Op.iLike]: `%${searchTerm.toLowerCase()}%`,
            },
          },
          {
            // Search in the related model (Settlement > County) columns
            '$settlement.county.name$': {
              [Op.iLike]: `%${searchTerm.toLowerCase()}%`,
            },
          },

          {
            // Search in the related model (Settlement > County) columns
            '$user.name$': {
              [Op.iLike]: `%${searchTerm.toLowerCase()}%`,
            },
          },
        ],
      },

      include: [
        {
          model: db.models.settlement,
          as: 'settlement', // This should match the alias you defined in your association
          attributes: ['id', 'name', 'county_id' ], // Specify the attributes for the 'settlement' model

          include: [
            {
              model: db.models.county, // Include the 'county' model within 'settlement'
              as: 'county', // This should match the alias you defined in your association
              attributes: ['id', 'name' ], // Specify the attributes for the 'settlement' model

            },
          ],
        },
        {
          model: db.models.document_type,
          as: 'document_type', // This should match the alias you defined in your association
          attributes: ['id', 'type', 'group'], // Specify the attributes for the 'settlement' model

        },
        {
          model: db.models.users,
          as: 'user', // This should match the alias you defined in your association
          attributes: ['id', 'name' ], // Specify the attributes for the 'settlement' model

        },
      ],
    //  limit: pageSize, // Limit the number of records per page
    //  offset: offset, // Set the offset to paginate

    });

    const count = filteredData.length;
    const totalPages = Math.ceil(count / pageSize); // Calculate the total number of pages

    console.log('pageSize', pageSize);
    console.log('offset', offset);
    console.log('totalPages', totalPages);

    res.status(200).send({
      data: filteredData,
      Total: count, // Add the count to the response
      code: '0000',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while filtering data.' });
  }
};



exports.getRawDocuments = async (req, res) => {
  const folderPath = '/data/uploads';

  console.log('req.body.params',req.body.params)
  // Parse query parameters for pagination
  const page = parseInt(req.body.params.page) || 1;
  const perPage = parseInt(req.body.params.perPage) || 5;

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading folder:', err);
      res.status(500).send('Failed to get documents');
      return;
    }

    // Perform pagination
    const startIdx = (page - 1) * perPage;
    const endIdx = startIdx + perPage;
    const paginatedFiles = files.slice(startIdx, endIdx);

    res.json({
      documents: paginatedFiles,
      code: '0000',
      pageInfo: {
        currentPage: page,
        perPage: perPage,
        totalItems: files.length,
        totalPages: Math.ceil(files.length / perPage),
      },
    });
  });
};



exports.DeleteRawDocuments = async (req, res) => {
  const folderPath = '/data/uploads';

  const fileName = req.body.fileName;
  const filePath = `${folderPath}/${fileName}`;
  console.log('filePath', req.body);

  try {
    // Check if the file exists before attempting to delete
    await fs.promises.access(filePath);

    // File exists, proceed with deletion
    await fs.promises.unlink(filePath);

    // Now, query the Sequelize model and delete the corresponding row
    const deletedRows = await db.models.document.destroy({
      where: { name: fileName },
    });

    if (deletedRows > 0) {
      //res.json({ message: 'File and corresponding database record deleted successfully' });
      console.log('File and corresponding database record deleted successfully' )
    } else {
     // res.status(404).json({ message: 'File not found in the database' });
      console.log('File not found in the database' )

    }




    res.json({ message: 'File deleted successfully', code: '0000' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).send('Deleting file failed.');
  }
};


 
exports.getAllListforDownload = async (req, res) => {
  console.log('Req-body:', req.body);

  const reg_model = req.body.model;

  // Base query without nested models and includes
  const baseQuery = {
    where: {},
    attributes: { exclude: [ 'latitude', 'longitude', 'coordinates' ] }
  };

  // Filtering
  if (req.body.filters && req.body.filters.length > 0 && req.body.filterValues.length > 0 && req.body.filterValues.length === req.body.filters.length) {
    const lstQueries = req.body.filters.map((filter, i) => ({
      [filter]: req.body.filterValues[i]
    }));
    baseQuery.where = { [Op.and]: lstQueries };
  }

  // Associated Models
  const associated_multiple_models = req.body.associated_multiple_models || [];

  // Nested Models
  const nested_models = req.body.nested_models || [];
  const nestedQuery = req.body.nested_filter ? { [req.body.nested_filter[0]]: req.body.nested_filter[1] } : {};

  const includeModels = [];

  // Loop through the include models if any
  if (associated_multiple_models.length > 0) {
    for (const modelName of associated_multiple_models) {
      const model = db.models[modelName];
      const attributes = model.rawAttributes;

      // Determine which fields to include
      const modelAttributes = ['id'];
      // if (attributes.name) modelAttributes.push('name');
      // if (attributes.title) modelAttributes.push('title');
      for (const attributeKey in attributes) {
        if (attributeKey.toLowerCase().includes("name")) {
          modelAttributes.push(attributeKey);
        }
        if (attributeKey.toLowerCase().includes("title")) {
          modelAttributes.push(attributeKey);
        }
      }
      
      includeModels.push({
        model: model,
        attributes: modelAttributes,
        raw: true,
        nested: true
      });
    }
  }

  // Handle nested models if provided
  if (nested_models.length > 0) {
    const child_model = db.models[nested_models[0]];
    const grand_child_model = db.models[nested_models[1]];

    const childAttributes = ['id'];
    if (child_model.rawAttributes.name) childAttributes.push('name');
    if (child_model.rawAttributes.title) childAttributes.push('title');

    const grandChildAttributes = ['id'];
    if (grand_child_model.rawAttributes.name) grandChildAttributes.push('name');
    if (grand_child_model.rawAttributes.title) grandChildAttributes.push('title');

    const nestedModels = {
      model: child_model,
      include: [{
        model: grand_child_model,
        where: nestedQuery,
        attributes: grandChildAttributes,
        raw: true,
        nested: true
      }],
      attributes: childAttributes
    };
    includeModels.push(nestedModels);
  }

  // Final query setup
  const qry = {
    ...baseQuery,
    include: includeModels.length > 0 ? includeModels : undefined, // Only include if there are models
    order: [['createdAt', 'DESC']]
  };

  console.log('Final Query:', qry);

  // Fetch data without pagination or limits
  try {
    const response = await db.models[reg_model].findAll(qry);
    res.status(200).send({
      fromCache: false,
      data: response,
      total: response.length,
      code: '0000'
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

 
 


 function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i; // Cost of deletion
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j; // Cost of insertion
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1; // Substitution cost
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return dp[m][n];
}

function calculateSimilarity(str1, str2) {
  str1 = String(str1);
  str2 = String(str2);

  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

exports.p2findPotentialDuplicates = async (req, res) => {
  console.log('Req-body for duplicates:', req.body);

  const { model, fields } = req.body;
  const similarityThreshold = 0.9;

  // Input validation
  if (!model || !fields || fields.length === 0) {
    return res.status(400).send({
      message: 'Invalid input data. Model and fields are required.',
      code: 'INVALID_INPUT'
    });
  }

  // Check if the model exists in the database
  if (!db.models[model]) {
    return res.status(400).send({
      message: 'Specified model does not exist.',
      code: 'MODEL_NOT_FOUND'
    });
  }

  // Prepare the SQL query
  const selectFields = fields.join(', ');
  const baseQuery = `SELECT ${selectFields}, id FROM public.${model}`;

  // Execute the query to get records
  const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

  // Group potential duplicates
  const groupedDuplicates = records.reduce((acc, recordA) => {
    // Check for similar records
    const similarRecords = records.filter(recordB => 
      recordA.id !== recordB.id && 
      fields.reduce((similaritySum, field) => 
        similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
    );

    // Only add if there are similar records
    if (similarRecords.length > 0) {
      // Create a group with recordA and its similarRecords
      acc.push([recordA, ...similarRecords]);
    }

    return acc;
  }, []);

  // Filter out groups with only one record
  const validGroups = groupedDuplicates.filter(group => group.length > 1);

  // Send response with grouped duplicates
  res.status(200).send({
    data: validGroups,
    total: validGroups.length,
    code: '0000'
  });
};


exports.p3findPotentialDuplicates = async (req, res) => {
  console.log('Req-body for duplicates:', req.body);

  const { model, fields, associated_model } = req.body; // single associated model
  const similarityThreshold = 0.9;

  // Input validation
  if (!model || !fields || fields.length === 0) {
      return res.status(400).send({
          message: 'Invalid input data. Model and fields are required.',
          code: 'INVALID_INPUT'
      });
  }

  // Check if the model exists in the database
  if (!db.models[model]) {
      return res.status(400).send({
          message: 'Specified model does not exist.',
          code: 'MODEL_NOT_FOUND'
      });
  }

  // Prepare the SQL query
  const selectFields = [...fields, 'id'].join(', ');
  const baseQuery = `SELECT ${selectFields} FROM public.${model}`;

  // Execute the query to get records
  const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

  // Group potential duplicates
  const groupedDuplicates = records.reduce((acc, recordA) => {
      const similarRecords = records.filter(recordB => 
          recordA.id !== recordB.id && 
          fields.reduce((similaritySum, field) => 
              similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
      );

      if (similarRecords.length > 0) {
          acc.push([recordA, ...similarRecords]);
      }

      return acc;
  }, []);

  const validGroups = groupedDuplicates.filter(group => group.length > 1);

  // If there is an associated model, fetch its data
  if (associated_model) {
      const associatedPromises = validGroups.map(async group => {
          const firstRecord = group[0];

          if (!db.models[associated_model]) {
              throw new Error(`Associated model ${associated_model} does not exist.`);
          }

          // Fetch associated model data
          const associatedData = await db.models[associated_model].findOne({
              where: {
                  id: firstRecord.county_id // Adjust this based on the correct field
              }
          });

          // Destructure to exclude 'geom' attribute
          const { geom, ...associatedAttributes } = associatedData.get({ plain: true });

          // Construct the response for this group
          return {
              ...associatedAttributes, // Spread all associated attributes except 'geom'
              duplicates: group
          };
      });

      const duplicatesWithAssociatedData = await Promise.all(associatedPromises);
      
      return res.status(200).send({
          data: duplicatesWithAssociatedData,
          total: duplicatesWithAssociatedData.length,
          code: '0000'
      });
  }

  res.status(200).send({
      data: validGroups,
      total: validGroups.length,
      code: '0000'
  });
};



 
 
exports.p4findPotentialDuplicates = async (req, res) => {
    console.log('Req-body for duplicates:', req.body);

    const { model, fields, associated_model } = req.body; // single associated model
    const similarityThreshold = 0.9;

    // Input validation
    if (!model || !fields || fields.length === 0) {
        return res.status(400).send({
            message: 'Invalid input data. Model and fields are required.',
            code: 'INVALID_INPUT'
        });
    }

    // Check if the model exists in the database
    if (!db.models[model]) {
        return res.status(400).send({
            message: 'Specified model does not exist.',
            code: 'MODEL_NOT_FOUND'
        });
    }

    // Prepare the SQL query
    const selectFields = [...fields, 'id'].join(', ');
    const baseQuery = `SELECT ${selectFields} FROM public.${model}`;

    // Execute the query to get records
    const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

    // Group potential duplicates
    const groupedDuplicates = records.reduce((acc, recordA) => {
        const similarRecords = records.filter(recordB => 
            recordA.id !== recordB.id && 
            fields.reduce((similaritySum, field) => 
                similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
        );

        if (similarRecords.length > 0) {
            acc.push([recordA, ...similarRecords]);
        }

        return acc;
    }, []);

    const validGroups = groupedDuplicates.filter(group => group.length > 1);

    // If there is an associated model, fetch its data
    if (associated_model) {
        const associatedPromises = validGroups.map(async group => {
            const firstRecord = group[0];
            const uniqueCode = uuidv4(); // Generate unique code for the group

            if (!db.models[associated_model]) {
                throw new Error(`Associated model ${associated_model} does not exist.`);
            }

            // Fetch associated model data
            const associatedData = await db.models[associated_model].findOne({
                where: {
                    id: firstRecord.county_id // Adjust this based on the correct field
                }
            });

            // Destructure to exclude 'geom' attribute
            const { geom, ...associatedAttributes } = associatedData.get({ plain: true });

            // Construct the response for this group with unique code for each duplicate
            const duplicatesWithCodes = group.map(duplicate => ({
                uniqueCode: uniqueCode, // Assign the same unique code to all duplicates in this group
                name: duplicate.name,
                county_id: duplicate.county_id,
                id: duplicate.id
            }));

            return {
                ...associatedAttributes, // Spread all associated attributes except 'geom'
                duplicates: duplicatesWithCodes
            };
        });

        const duplicatesWithAssociatedData = await Promise.all(associatedPromises);
        
        return res.status(200).send({
            data: duplicatesWithAssociatedData,
            total: duplicatesWithAssociatedData.length,
            code: '0000'
        });
    }

    // For groups without associated model data
    const responseData = validGroups.map(group => {
        const uniqueCode = uuidv4(); // Generate unique code for the group

        return {
            duplicates: group.map(duplicate => ({
                uniqueCode: uniqueCode, // Assign the same unique code to all duplicates in this group
                name: duplicate.name,
                county_id: duplicate.county_id,
                id: duplicate.id
            }))
        };
    });

    res.status(200).send({
        data: responseData,
        total: responseData.length,
        code: '0000'
    });
};


 
exports.p5findPotentialDuplicates = async (req, res) => {
    console.log('Req-body for duplicates:', req.body);

    const { model, fields, associated_model } = req.body; // single associated model
    const similarityThreshold = 0.9;

    // Input validation
    if (!model || !fields || fields.length === 0) {
        return res.status(400).send({
            message: 'Invalid input data. Model and fields are required.',
            code: 'INVALID_INPUT'
        });
    }

    // Check if the model exists in the database
    if (!db.models[model]) {
        return res.status(400).send({
            message: 'Specified model does not exist.',
            code: 'MODEL_NOT_FOUND'
        });
    }

    // Prepare the SQL query
    const selectFields = [...fields, 'id', 'county_id'].join(', '); // Include county_id for grouping
    const baseQuery = `SELECT ${selectFields} FROM public.${model}`;

    // Execute the query to get records
    const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

    // Group potential duplicates
    const groupedDuplicates = records.reduce((acc, recordA) => {
        const similarRecords = records.filter(recordB => 
            recordA.id !== recordB.id && 
            fields.reduce((similaritySum, field) => 
                similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
        );

        if (similarRecords.length > 0) {
            acc.push([recordA, ...similarRecords]);
        }

        return acc;
    }, []);

    const validGroups = groupedDuplicates.filter(group => group.length > 1);

    // If there is an associated model, fetch its data
    if (associated_model) {
        const associatedPromises = validGroups.map(async group => {
            const firstRecord = group[0];
            const uniqueCode = uuidv4(); // Generate unique code for the group

            if (!db.models[associated_model]) {
                throw new Error(`Associated model ${associated_model} does not exist.`);
            }

            // Fetch associated model data
            const associatedData = await db.models[associated_model].findOne({
                where: {
                    id: firstRecord.county_id // Adjust this based on the correct field
                }
            });

            // Destructure to exclude 'geom' attribute
            const { geom, ...associatedAttributes } = associatedData.get({ plain: true });

            // Construct the response for this group with unique code for each duplicate
            const duplicatesWithCodes = group.map(duplicate => ({
                uniqueCode: uniqueCode, // Assign the same unique code to all duplicates in this group
                name: duplicate.name,
                county_id: duplicate.county_id,
                id: duplicate.id
            }));

            return {
                countyName: associatedAttributes.name, // Assuming name is the field you want to group by
                 duplicates: duplicatesWithCodes
            };
        });

        const duplicatesWithAssociatedData = await Promise.all(associatedPromises);
        
        // Group duplicates by county name
        const groupedByCounty = duplicatesWithAssociatedData.reduce((acc, current) => {
            const countyName = current.countyName;
            if (!acc[countyName]) {
                acc[countyName] = {
                    countyName,
                    uniqueCode: current.uniqueCode,
                    duplicates: []
                };
            }
            acc[countyName].duplicates.push(...current.duplicates);
            return acc;
        }, {});

        return res.status(200).send({
            data: Object.values(groupedByCounty), // Convert object to array for response
            total: Object.values(groupedByCounty).length,
            code: '0000'
        });
    }

    // For groups without associated model data
    const responseData = validGroups.map(group => {
        const uniqueCode = uuidv4(); // Generate unique code for the group

        return {
            duplicates: group.map(duplicate => ({
                uniqueCode: uniqueCode, // Assign the same unique code to all duplicates in this group
                name: duplicate.name,
                county_id: duplicate.county_id,
                id: duplicate.id
            }))
        };
    });

    res.status(200).send({
        data: responseData,
        total: responseData.length,
        code: '0000'
    });
};

exports.checkPotentialDuplicates = async (req, res) => {
  console.log(req.thisUser.id);
  let token = req.headers["x-access-token"];
  console.log('checking duplicates......');
  var reg_model = req.body.model;

  // Create Log Events Object
  let event = {
    model: reg_model,
    remoteAddress: req.connection.remoteAddress,
    user_id: req.thisUser.id,
    user_name: req.thisUser.username,
    action: 'Check Duplicates for ' + reg_model
  };

  try {
    console.log('model... ----', req.body.model);
    console.log('geom... ----', req.body.geom);

    var obj = req.body;
    obj.createdBy = req.thisUser.id;
    delete obj.model;

    if (JSON.stringify(req.body.geom) === "{}") {
      delete obj.geom;
    }

    console.log('Checking for duplicates with object:', obj);

    const checkFields = req.body.checkFields || []; // Example: ['name', 'county_id']
    let potentialDuplicates = []; // To store potential duplicate records

    if (Array.isArray(checkFields) && checkFields.length > 0) {
      // Retrieve all records of the model
      const existingRecords = await db.models[reg_model].findAll();

      for (const record of existingRecords) {
        let matchCount = 0;

        for (const field of checkFields) {
          if (obj[field] !== undefined) {
            // String fields: fuzzy matching with 80% threshold
            if (typeof obj[field] === 'string' && typeof record[field] === 'string') {
              const similarity = fuzzball.ratio(obj[field], record[field]);
              if (similarity >= 80) {
                matchCount++;
                console.log('matchCount', matchCount, obj[field], record[field], similarity);
              }
            }
            // Non-string fields: exact match
            else if (obj[field] == record[field]) {
              matchCount++;
            }
          }
        }

        // If all specified fields match criteria, it's a potential duplicate
        if (matchCount === checkFields.length) {
          // Strip record to only include the checkFields
          let filteredRecord = {};
          checkFields.forEach(field => {
            filteredRecord[field] = record[field];
          });
          potentialDuplicates.push(filteredRecord); // Add to potential duplicates
        }
      }

      // If potential duplicates are found, return them
      if (potentialDuplicates.length > 0) {
        console.log('Potential duplicates found:', potentialDuplicates);
        event.status = 'failed';
        logEvents(event);

        return res.status(400).json({
          message: `Potential duplicate records for ${reg_model} found.`,
          checkFields: checkFields, // Only return the checkFields in the response
          duplicates: potentialDuplicates, // Return the list of potential duplicates with only checkFields
        });
      }
    }

    // If no duplicates, return a success message
    res.status(200).send({
      message: 'No duplicates found. Proceed with record creation.',
      checkFields: checkFields, // Return the checkFields for transparency
      code: '0000',
    });

  } catch (error) {
    console.log('Error checking duplicates:', error);
    event.status = 'failed';
    logEvents(event);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: `Duplicate records for ${reg_model} not allowed`,
      });
    } else {
      return res.status(500).json({
        message: 'An unexpected error occurred while checking for duplicates.',
      });
    }
  }
};

 
exports.p6findPotentialDuplicates = async (req, res) => {
    console.log('Req-body for duplicates:', req.body);

    const { model, fields, associated_model, foreignKey, displayField } = req.body; // single associated model
    const similarityThreshold = 0.9;

    // Input validation
    if (!model || !fields || fields.length === 0) {
        return res.status(400).send({
            message: 'Invalid input data. Model and fields are required.',
            code: 'INVALID_INPUT'
        });
    }

    // Check if the model exists in the database
    if (!db.models[model]) {
        return res.status(400).send({
            message: 'Specified model does not exist.',
            code: 'MODEL_NOT_FOUND'
        });
    }


    try {
        // Prepare the SQL query
    const selectFields = [...fields, 'id', foreignKey].join(', '); // Include foreign key for grouping
    const baseQuery = `SELECT ${selectFields} FROM public.${model}`;

    // Execute the query to get records
    const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

    // Group potential duplicates
    const groupedDuplicates = records.reduce((acc, recordA) => {
        const similarRecords = records.filter(recordB => 
            recordA.id !== recordB.id && 
            fields.reduce((similaritySum, field) => 
                similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
        );

        if (similarRecords.length > 0) {
            acc.push([recordA, ...similarRecords]);
        }

        return acc;
    }, []);

    const validGroups = groupedDuplicates.filter(group => group.length > 1);

    // If there is an associated model, fetch its data
    if (associated_model) {
        const associatedPromises = validGroups.map(async group => {
            const firstRecord = group[0];
            const uniqueCode = uuidv4(); // Generate unique code for the group

            if (!db.models[associated_model]) {
                throw new Error(`Associated model ${associated_model} does not exist.`);
            }

            // Fetch associated model data using the foreign key
            const associatedData = await db.models[associated_model].findOne({
                where: {
                    id: firstRecord[foreignKey] // Adjust to use the dynamic foreign key
                }
            });

            // Check if associated data is found
            if (!associatedData) {
                throw new Error(`No associated data found for ID: ${firstRecord[foreignKey]}`);
            }

            // Destructure to exclude 'geom' attribute if it exists
            const { geom, ...associatedAttributes } = associatedData.get({ plain: true });

            // Construct the response for this group with unique code for each duplicate
            const duplicatesWithCodes = group.map(duplicate => ({
                uniqueCode: uniqueCode, // Assign the same unique code to all duplicates in this group
                name: duplicate.name,
                [foreignKey]: duplicate[foreignKey],
                id: duplicate.id
            }));

            return {
                [displayField]: associatedAttributes[displayField], // Dynamically use the display field
                duplicates: duplicatesWithCodes
            };
        });

        const duplicatesWithAssociatedData = await Promise.all(associatedPromises);
        
        // Group duplicates by associated field name
        const groupedByAssociatedField = duplicatesWithAssociatedData.reduce((acc, current) => {
            const associatedFieldValue = current[displayField];
            if (!acc[associatedFieldValue]) {
                acc[associatedFieldValue] = {
                    [displayField]: associatedFieldValue,
                    //uniqueCode: uuidv4(), // Generate unique code for this group
                    duplicates: []
                };
            }
            acc[associatedFieldValue].duplicates.push(...current.duplicates);
            return acc;
        }, {});

        return res.status(200).send({
            data: Object.values(groupedByAssociatedField), // Convert object to array for response
            total: Object.values(groupedByAssociatedField).length,
            code: '0000'
        });
    }

    

        // For groups without associated model data
        const responseData = validGroups.map(group => {
          const uniqueCode = uuidv4(); // Generate unique code for the group
  
          return {
              duplicates: group.map(duplicate => {
                  const uniqueDuplicate = { uniqueCode }; // Create an object to hold the unique code
                  fields.forEach(field => {
                      uniqueDuplicate[field] = duplicate[field]; // Dynamically assign all fields
                  });
                  uniqueDuplicate.id = duplicate.id; // Always include the id
                  return uniqueDuplicate;
              })
          };
      });
  

    res.status(200).send({
        data: responseData,
        total: responseData.length,
        code: '0000'
    });
     
    } catch (err) {
      console.error('Error Gettign Duplicates:', err);
      res.status(500).send('Error Getting Duplicates.');
    }




  
};

exports.p7findPotentialDuplicates = async (req, res) => {
  console.log('Req-body for duplicates:', req.body);

  const { model, fields, associated_model, foreignKey, displayField } = req.body; // single associated model
  const similarityThreshold = 0.9;

  // Input validation
  if (!model || !fields || fields.length === 0) {
      return res.status(400).send({
          message: 'Invalid input data. Model and fields are required.',
          code: 'INVALID_INPUT'
      });
  }

  // Check if the model exists in the database
  if (!db.models[model]) {
      return res.status(400).send({
          message: 'Specified model does not exist.',
          code: 'MODEL_NOT_FOUND'
      });
  }

  try {
      // Prepare the SQL query
      const selectFields = [...fields, 'id', foreignKey].join(', '); // Include foreign key for grouping
      const baseQuery = `SELECT ${selectFields} FROM public.${model}`;

      // Execute the query to get records
      const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

      // Group potential duplicates
      const groupedDuplicates = records.reduce((acc, recordA) => {
          const similarRecords = records.filter(recordB => 
              recordA.id !== recordB.id && 
              fields.reduce((similaritySum, field) => 
                  similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
          );

          if (similarRecords.length > 0) {
              acc.push([recordA, ...similarRecords]);
          }

          return acc;
      }, []);

      const validGroups = groupedDuplicates.filter(group => group.length > 1);

      // If there is an associated model, fetch its data
      if (associated_model) {
          const associatedPromises = validGroups.map(async group => {
              const firstRecord = group[0];
              const uniqueCode = uuidv4(); // Generate unique code for the group

              if (!db.models[associated_model]) {
                  throw new Error(`Associated model ${associated_model} does not exist.`);
              }

              // Fetch associated model data using the foreign key
              const associatedData = await db.models[associated_model].findOne({
                  where: {
                      id: firstRecord[foreignKey] // Adjust to use the dynamic foreign key
                  }
              });

              // Check if associated data is found
              if (!associatedData) {
                  throw new Error(`No associated data found for ID: ${firstRecord[foreignKey]}`);
              }

              // Destructure to exclude 'geom' attribute if it exists
              const { geom, ...associatedAttributes } = associatedData.get({ plain: true });

              // Construct the response for this group with unique code for each duplicate
              const duplicatesWithCodes = group.map(duplicate => ({
                  uniqueCode: uniqueCode, // Assign the same unique code to all duplicates in this group
                  ...fields.reduce((acc, field) => {
                      acc[field] = duplicate[field]; // Dynamically assign all fields
                      return acc;
                  }, {}),
                  id: duplicate.id
              }));

              return {
                  [displayField]: associatedAttributes[displayField], // Dynamically use the display field
                  duplicates: duplicatesWithCodes
              };
          });

          const duplicatesWithAssociatedData = await Promise.all(associatedPromises);
          
          // Group duplicates by associated field name
          const groupedByAssociatedField = duplicatesWithAssociatedData.reduce((acc, current) => {
              const associatedFieldValue = current[displayField];
              if (!acc[associatedFieldValue]) {
                  acc[associatedFieldValue] = {
                      [displayField]: associatedFieldValue,
                      duplicates: []
                  };
              }
              acc[associatedFieldValue].duplicates.push(...current.duplicates);
              return acc;
          }, {});

          // Calculate total duplicates
          const totalDuplicates = Object.values(groupedByAssociatedField)
              .reduce((sum, group) => sum + group.duplicates.length, 0);

          return res.status(200).send({
              data: Object.values(groupedByAssociatedField), // Convert object to array for response
              total: totalDuplicates, // Total number of duplicates
              code: '0000'
          });
      }

      // For groups without associated model data
      const responseData = validGroups.map(group => {
          const uniqueCode = uuidv4(); // Generate unique code for the group

          return {
              duplicates: group.map(duplicate => {
                  const uniqueDuplicate = { uniqueCode }; // Create an object to hold the unique code
                  fields.forEach(field => {
                      uniqueDuplicate[field] = duplicate[field]; // Dynamically assign all fields
                  });
                  uniqueDuplicate.id = duplicate.id; // Always include the id
                  return uniqueDuplicate;
              })
          };
      });

      // Calculate total duplicates
      const totalDuplicates = responseData.reduce((sum, group) => sum + group.duplicates.length, 0);

      res.status(200).send({
          data: responseData,
          total: totalDuplicates, // Total number of duplicates
          code: '0000'
      });
       
  } catch (err) {
      console.error('Error Getting Duplicates:', err);
      res.status(500).send('Error Getting Duplicates.');
  }
};

exports.p8findPotentialDuplicates = async (req, res) => {
  console.log('Req-body for duplicates:', req.body);

  const { model, fields, associated_model, foreignKey, displayField } = req.body; // single associated model
  const similarityThreshold = 0.9;

  // Input validation
  if (!model || !fields || fields.length === 0) {
      return res.status(400).send({
          message: 'Invalid input data. Model and fields are required.',
          code: 'INVALID_INPUT'
      });
  }

  // Check if the model exists in the database
  if (!db.models[model]) {
      return res.status(400).send({
          message: 'Specified model does not exist.',
          code: 'MODEL_NOT_FOUND'
      });
  }

  try {
      // Prepare the SQL query
      // Fetch all columns from the specified model
      const baseQuery = `SELECT * FROM public.${model}`;

      // Execute the query to get records
      const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

      // Group potential duplicates
      const groupedDuplicates = records.reduce((acc, recordA) => {
          const similarRecords = records.filter(recordB =>
              recordA.id !== recordB.id &&
              fields.reduce((similaritySum, field) =>
                  similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
          );

          if (similarRecords.length > 0) {
              acc.push([recordA, ...similarRecords]);
          }

          return acc;
      }, []);

      const validGroups = groupedDuplicates.filter(group => group.length > 1);

      // If there is an associated model, fetch its data
      if (associated_model) {
          const associatedPromises = validGroups.map(async group => {
              const firstRecord = group[0];
              const uniqueCode = uuidv4(); // Generate unique code for the group

              if (!db.models[associated_model]) {
                  throw new Error(`Associated model ${associated_model} does not exist.`);
              }

              // Fetch associated model data using the foreign key
              const associatedData = await db.models[associated_model].findOne({
                  where: {
                      id: firstRecord[foreignKey] // Adjust to use the dynamic foreign key
                  }
              });

              // Check if associated data is found
              if (!associatedData) {
                  throw new Error(`No associated data found for ID: ${firstRecord[foreignKey]}`);
              }

              // Destructure to exclude 'geom' attribute if it exists
              const { geom, ...associatedAttributes } = associatedData.get({ plain: true });

              // Construct the response for this group with unique code for each duplicate
              const duplicatesWithCodes = group.map(duplicate => {
                  // Spread all properties of the duplicate record and add the unique code
                  return {
                      uniqueCode: uniqueCode,
                      ...duplicate // Include all properties of the duplicate record
                  };
              });

              return {
                  [displayField]: associatedAttributes[displayField], // Dynamically use the display field
                  duplicates: duplicatesWithCodes
              };
          });

          const duplicatesWithAssociatedData = await Promise.all(associatedPromises);

          // Group duplicates by associated field name
          const groupedByAssociatedField = duplicatesWithAssociatedData.reduce((acc, current) => {
              const associatedFieldValue = current[displayField];
              if (!acc[associatedFieldValue]) {
                  acc[associatedFieldValue] = {
                      [displayField]: associatedFieldValue,
                      duplicates: []
                  };
              }
              acc[associatedFieldValue].duplicates.push(...current.duplicates);
              return acc;
          }, {});

          // Calculate total duplicates
          const totalDuplicates = Object.values(groupedByAssociatedField)
              .reduce((sum, group) => sum + group.duplicates.length, 0);

          return res.status(200).send({
              data: Object.values(groupedByAssociatedField), // Convert object to array for response
              total: totalDuplicates, // Total number of duplicates
              code: '0000'
          });
      }

      // For groups without associated model data
      const responseData = validGroups.map(group => {
          const uniqueCode = uuidv4(); // Generate unique code for the group

          return {
              duplicates: group.map(duplicate => {
                  // Include all properties of the duplicate record and add the unique code
                  return {
                      uniqueCode: uniqueCode,
                      ...duplicate // Spread all properties of the duplicate record
                  };
              })
          };
      });

      // Calculate total duplicates
      const totalDuplicates = responseData.reduce((sum, group) => sum + group.duplicates.length, 0);

      res.status(200).send({
          data: responseData,
          total: totalDuplicates, // Total number of duplicates
          code: '0000'
      });

  } catch (err) {
      console.error('Error Getting Duplicates:', err);
      res.status(500).send('Error Getting Duplicates.');
  }
};

exports.p9findPotentialDuplicates = async (req, res) => {
  console.log('Req-body for duplicates:', req.body);

  const { model, fields, associated_model, foreignKey, displayField } = req.body; // single associated model
  const similarityThreshold = 0.9;

  // Input validation
  if (!model || !fields || fields.length === 0) {
      return res.status(400).send({
          message: 'Invalid input data. Model and fields are required.',
          code: 'INVALID_INPUT'
      });
  }

  // Check if the model exists in the database
  if (!db.models[model]) {
      return res.status(400).send({
          message: 'Specified model does not exist.',
          code: 'MODEL_NOT_FOUND'
      });
  }

  try {
      // Prepare the SQL query
      // Fetch all columns from the specified model
      const baseQuery = `SELECT * FROM public.${model}`;

      // Execute the query to get records
      const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

      // Group potential duplicates
      const groupedDuplicates = records.reduce((acc, recordA) => {
          const similarRecords = records.filter(recordB =>
              recordA.id !== recordB.id &&
              fields.reduce((similaritySum, field) =>
                  similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
          );

          if (similarRecords.length > 0) {
              acc.push([recordA, ...similarRecords]);
          }

          return acc;
      }, []);

      const validGroups = groupedDuplicates.filter(group => group.length > 1);

      // If there is an associated model, fetch its data
      if (associated_model) {
          const associatedPromises = validGroups.map(async group => {
              const firstRecord = group[0];

              if (!db.models[associated_model]) {
                  throw new Error(`Associated model ${associated_model} does not exist.`);
              }

              // Fetch associated model data using the foreign key
              const associatedData = await db.models[associated_model].findOne({
                  where: {
                      id: firstRecord[foreignKey] // Adjust to use the dynamic foreign key
                  }
              });

              // Check if associated data is found
              if (!associatedData) {
                  throw new Error(`No associated data found for ID: ${firstRecord[foreignKey]}`);
              }

              // Destructure to exclude 'geom' attribute if it exists
              const { geom, ...associatedAttributes } = associatedData.get({ plain: true });

              // Construct the response for this group
              return {
                  [displayField]: associatedAttributes[displayField], // Dynamically use the display field
                  duplicates: Array.from(new Set(group.map(duplicate => duplicate.id))) // Ensure unique records by ID
                      .map(uniqueId => group.find(duplicate => duplicate.id === uniqueId))
              };
          });

          const duplicatesWithAssociatedData = await Promise.all(associatedPromises);

          // Group duplicates by associated field name
          const groupedByAssociatedField = duplicatesWithAssociatedData.reduce((acc, current) => {
              const associatedFieldValue = current[displayField];
              if (!acc[associatedFieldValue]) {
                  acc[associatedFieldValue] = {
                      [displayField]: associatedFieldValue,
                      duplicates: []
                  };
              }
              acc[associatedFieldValue].duplicates.push(...current.duplicates);
              return acc;
          }, {});

          // Calculate total duplicates
          const totalDuplicates = Object.values(groupedByAssociatedField)
              .reduce((sum, group) => sum + group.duplicates.length, 0);

          return res.status(200).send({
              data: Object.values(groupedByAssociatedField), // Convert object to array for response
              total: totalDuplicates, // Total number of duplicates
              code: '0000'
          });
      }

      // For groups without associated model data
      const responseData = validGroups.map(group => {
          return {
              duplicates: Array.from(new Set(group.map(duplicate => duplicate.id))) // Ensure unique records by ID
                  .map(uniqueId => group.find(duplicate => duplicate.id === uniqueId))
          };
      });

      // Calculate total duplicates
      const totalDuplicates = responseData.reduce((sum, group) => sum + group.duplicates.length, 0);

      res.status(200).send({
          data: responseData,
          total: totalDuplicates, // Total number of duplicates
          code: '0000'
      });

  } catch (err) {
      console.error('Error Getting Duplicates:', err);
      res.status(500).send('Error Getting Duplicates.');
  }
};

 exports.findPotentialDuplicates = async (req, res) => {
    console.log('Req-body for duplicates:', req.body);

    const { model, fields, associated_model, foreignKey, displayField } = req.body; // Include associated model parameters
    const similarityThreshold = 0.9;

    // Input validation
    if (!model || !fields || fields.length === 0) {
        return res.status(400).send({
            message: 'Invalid input data. Model and fields are required.',
            code: 'INVALID_INPUT'
        });
    }

    // Check if the model exists in the database
    if (!db.models[model]) {
        return res.status(400).send({
            message: 'Specified model does not exist.',
            code: 'MODEL_NOT_FOUND'
        });
    }

    // Prepare the SQL query
    const selectFields = fields.join(', ');
    const baseQuery = `SELECT  * FROM public.${model}`;

    // Execute the query to get records
    const records = await db.sequelize.query(baseQuery, { type: db.sequelize.QueryTypes.SELECT });

    // Group potential duplicates
    const groupedDuplicates = records.reduce((acc, recordA) => {
        // Check for similar records
        const similarRecords = records.filter(recordB => 
            recordA.id !== recordB.id && 
            fields.reduce((similaritySum, field) => 
                similaritySum + calculateSimilarity(recordA[field], recordB[field]), 0) / fields.length >= similarityThreshold
        );

        // Only add if there are similar records
        if (similarRecords.length > 0) {
            // Create a group with recordA and its similarRecords
            acc.push([recordA, ...similarRecords]);
        }

        return acc;
    }, []);

    // Filter out groups with only one record
    const validGroups = groupedDuplicates.filter(group => group.length > 1);

    // If there is an associated model, fetch its data
    if (associated_model) {
        try {
            const associatedPromises = validGroups.map(async group => {
                const firstRecord = group[0]; // Take the first record to get associated data

                if (!db.models[associated_model]) {
                    throw new Error(`Associated model ${associated_model} does not exist.`);
                }

                // Fetch associated model data using the foreign key
                const associatedData = await db.models[associated_model].findOne({
                    where: {
                        id: firstRecord[foreignKey] // Adjust to use the dynamic foreign key
                    }
                });

                // Check if associated data is found
                if (!associatedData) {
                    throw new Error(`No associated data found for ID: ${firstRecord[foreignKey]}`);
                }

                // Get the display field value from the associated data
                const displayValue = associatedData[displayField];

                // Construct the response for this group
                return {
                    parent: displayValue, // Include the display field value from the associated model
                    duplicates: group.map(duplicate => {
                        // Return all attributes of the duplicate records
                        return {
                            ...duplicate // Include all properties of the duplicate record
                        };
                    })
                };
            });

            const duplicatesWithAssociatedData = await Promise.all(associatedPromises);

            // Calculate total duplicates
            const totalDuplicates = duplicatesWithAssociatedData.reduce((sum, group) => sum + group.duplicates.length, 0);

            // Send response with grouped duplicates and associated display field value
            return res.status(200).send({
                data: duplicatesWithAssociatedData,
                total: totalDuplicates,
                code: '0000'
            });

        } catch (err) {
            console.error('Error fetching associated data:', err);
            return res.status(500).send('Error fetching associated data.');
        }
    }

    // Send response with grouped duplicates if no associated model is provided
    const responseData = validGroups.map(group => ({
        duplicates: group.map(duplicate => ({
            ...duplicate // Include all properties of the duplicate record
        }))
    }));

    res.status(200).send({
        data: responseData,
        total: validGroups.length,
        code: '0000'
    });
};



exports.mergeDuplicates = async (req, res) => {
  const { primaryId, duplicateIds, model } = req.body;
  try {
    const Model = db.models[model];

    // Loop through all associations of the model
    for (const associationName in Model.associations) {
      const association = Model.associations[associationName];

      // Check if the association has a foreign key that points to this model
      if (association.foreignKey) {
        const associatedModel = association.target;

        // Update the foreign key in the associated model to point to the primary record
        await associatedModel.update(
          { [association.foreignKey]: primaryId },
          { where: { [association.foreignKey]: duplicateIds } }
        );
      }
    }

    // Delete the duplicate records
    await Model.destroy({ where: { id: duplicateIds } });

    //res.json({ message: "Records merged successfully." });

    res.status(200).send({
      message: "Records merged successfully.",
      code: '0000'

  });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
