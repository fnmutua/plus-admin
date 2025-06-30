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

 
 
 
 exports.GetRoutes = async (req, res) => {
  try {
    const {
      model: reg_model,
      filters = [],
      filterValues = [],
      associated_multiple_models = [],
      limit,
      page,
      cache_key
    } = req.body;

    console.log('Req-body', req.body);

    // Validate model exists
    const modelDefinition = db.models[reg_model];
    if (!modelDefinition) {
      return res.status(400).send({
        error: `Model ${reg_model} not found`,
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Base query construction
    const baseQuery = { where: {} };

    // Filter handling
    if (filters.length > 0 && filterValues.length === filters.length) {
      baseQuery.where = {
        [Op.and]: filters.map((filter, i) => ({ [filter]: filterValues[i] }))
      };
    }

    // Count query (separate for better performance)
    const count = await modelDefinition.count(baseQuery);
    console.log('Total records:', count);

    // Build include models
    const includeModels = [];

    // Handle associated models
    associated_multiple_models.forEach(modelName => {
      if (db.models[modelName]) {
        includeModels.push({
          model: db.models[modelName],
          required: false
        });
      }
    });

    // Handle self-referential relationships automatically
    Object.values(modelDefinition.associations).forEach(assoc => {
      console.log('Handle self-referential relationships automatically.................',reg_model,assoc.target.name )

      if (assoc.target.name == reg_model) {

        console.log('assoc.target.name1..............',assoc.target.name)

        includeModels.push({
          model: modelDefinition,
          as: assoc.as,
          required: false,
        });
      }
    });

    // Main query construction
    const qry = {
      include: includeModels.length ? includeModels : undefined,
      where: baseQuery.where,
      order: [['createdAt', 'DESC']],
      distinct: true  // Important for correct counting with includes
    };

    // Pagination
    if (limit) {
      qry.limit = parseInt(limit);
      if (page) {
        qry.offset = (parseInt(page) - 1) * qry.limit;
      }
    }

    console.log('Final Query:', qry);

    // Cache handling
    if (cache_key) {
      const cacheDuration = 3600;
      const lastModified = await getLastModified(modelDefinition);
      const cachedData = await getCachedData(cache_key);

      if (cachedData && lastModified <= cachedData.lastModified) {
        return sendCachedResponse(res, cache_key, cachedData, count);
      }

      const response = await fetchAndCacheData(
        modelDefinition,
        qry,
        cache_key,
        cacheDuration,
        count
      );
      return res.status(200).send(response);
    }

    // Non-cached response
    const response = await modelDefinition.findAndCountAll(qry);
    return res.status(200).send({
      fromCache: false,
      data: response.rows,
      total: count,
      code: '0000'
    });

  } catch (error) {
    console.error('Error in GetRoutes:', error);
    return res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
      error: error.message
    });
  }
};



exports.xGetRoutes = async (req, res) => {
  try {
    const {
      model: reg_model,
      filters = [],
      filterValues = [],
      associated_multiple_models = [],
      limit,
      page,
      cache_key
    } = req.body;

    console.log('Req-body', req.body);

    // Validate model exists
    const modelDefinition = db.models[reg_model];
    if (!modelDefinition) {
      return res.status(400).send({
        error: `Model ${reg_model} not found`,
        code: 'MODEL_NOT_FOUND'
      });
    }

    // Base query construction
    const baseQuery = { where: {} };

    // Filter handling
    if (filters.length > 0 && filterValues.length === filters.length) {
      baseQuery.where = {
        [Op.and]: filters.map((filter, i) => ({ [filter]: filterValues[i] }))
      };
    }

    // Count query (separate for better performance)
    const count = await modelDefinition.count(baseQuery);
    console.log('Total records:', count);

    // Build include models
    const includeModels = [];

    // Handle associated models
    associated_multiple_models.forEach(modelName => {
      if (db.models[modelName]) {
        includeModels.push({
          model: db.models[modelName],
          required: false
        });
      }
    });

    // Helper: recursive include builder for self-referencing associations
    const buildRecursiveInclude = (model, alias, depth = 3) => {
      if (depth <= 0) return [];
      return [{
        model,
        as: alias,
        required: false,
        include: buildRecursiveInclude(model, alias, depth - 1)
      }];
    };

    // Handle self-referential relationships automatically
    Object.values(modelDefinition.associations).forEach(assoc => {
      if (assoc.target.name === reg_model) {
        console.log(`Adding recursive include for ${reg_model} -> ${assoc.as}`);
        includeModels.push(...buildRecursiveInclude(modelDefinition, assoc.as, 3)); // depth = 3
      }
    });

    // Main query construction
    const qry = {
      include: includeModels.length ? includeModels : undefined,
      where: baseQuery.where,
      order: [['createdAt', 'DESC']],
      distinct: true
    };

    // Pagination
    if (limit) {
      qry.limit = parseInt(limit);
      if (page) {
        qry.offset = (parseInt(page) - 1) * qry.limit;
      }
    }

    console.log('Final Query:', JSON.stringify(qry, null, 2));

    // Cache handling
    if (cache_key) {
      const cacheDuration = 3600;
      const lastModified = await getLastModified(modelDefinition);
      const cachedData = await getCachedData(cache_key);

      if (cachedData && lastModified <= cachedData.lastModified) {
        return sendCachedResponse(res, cache_key, cachedData, count);
      }

      const response = await fetchAndCacheData(
        modelDefinition,
        qry,
        cache_key,
        cacheDuration,
        count
      );
      return res.status(200).send(response);
    }

    // Non-cached response
    const response = await modelDefinition.findAndCountAll(qry);
    return res.status(200).send({
      fromCache: false,
      data: response.rows,
      total: count,
      code: '0000'
    });

  } catch (error) {
    console.error('Error in GetRoutes:', error);
    return res.status(500).send({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
      error: error.message
    });
  }
};













// Helper functions
async function getLastModified(model) {
  const lastRow = await model.findOne({
    attributes: ['updatedAt'],
    order: [['updatedAt', 'DESC']]
  });
  return lastRow?.updatedAt ?? Date.now();
}

async function getCachedData(cache_key) {
  const cacheResults = await redisClient.get(cache_key);
  return cacheResults ? JSON.parse(cacheResults) : null;
}

function sendCachedResponse(res, cache_key, cachedData, count) {
  return res.status(200).send({
    fromCache: true,
    cache_key,
    data: cachedData.data,
    total: count,
    code: '0000'
  });
}

async function fetchAndCacheData(model, query, cache_key, cacheDuration, count) {
  const response = await model.findAndCountAll(query);
  await redisClient.set(
    cache_key,
    JSON.stringify({
      data: response.rows,
      total: count,
      lastModified: Date.now()
    }),
    { EX: cacheDuration, NX: true }
  );
  return {
    fromCache: false,
    cache_key,
    data: response.rows,
    total: count,
    code: '0000'
  };
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

 
 


 

 

 
 
 


function safeParseAndSanitize(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr, (key, value) => {
      if (typeof value === 'number' && !isFinite(value)) return null;
      if (value === 'NaN' || value === 'Infinity') return null;
      return value;
    });
    return parsed;
  } catch (err) {
    throw new Error('Malformed JSON payload');
  }
}



 
 

exports.modelImportDataUpsert = async (req, res) => {
  try {
    // Validate request body
    console.log('Validate request body', req.body);
    const body = typeof req.body === 'string' ? safeParseAndSanitize(req.body) : req.body;
    const { model: modelName, data: rawData } = body;

    if (!modelName || !rawData) {
      return res.status(400).json({ message: 'Model name and data are required' });
    }

    // Validate model existence
    const Model = db.models[modelName];
    if (!Model) {
      return res.status(400).json({ message: `Model "${modelName}" not found` });
    }

    // Parse data array
    let data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Data must be an array' });
    }

    // Prepare result containers
    const inserted = [];
    const updated = [];
    const errors = [];

    // Encryption passphrase for households
    const passphrase = '***REDACTED***';
    const sequelizeFn = db.sequelize.fn;
    const sequelizeCol = db.sequelize.col;

    // Determine model attributes
    const attributes = Model.rawAttributes;

    // Pre-validate records: filter undefined fields & check hard type mismatches
    const validRecords = [];
    data.forEach((origItem, index) => {
      if (!origItem || typeof origItem !== 'object') {
        errors.push({ item: origItem, error: 'Invalid record format', detail: `Record at index ${index} is not an object.` });
        return;
      }
      // Keep only defined attributes
      const item = {};
      Object.keys(origItem).forEach(key => { if (attributes[key]) item[key] = origItem[key]; });
      
      // Auto-convert string IDs to integers for common ID fields
      const idFields = ['project_id', 'county_id', 'subcounty_id', 'ward_id', 'settlement_id', 'implementer'];
      idFields.forEach(field => {
        if (item[field] && typeof item[field] === 'string' && !isNaN(parseInt(item[field]))) {
          item[field] = parseInt(item[field]);
        }
      });
      
      // Type checks
      Object.entries(attributes).forEach(([key, attrDef]) => {
        if (!(key in item)) return;
        const val = item[key]; if (val == null) return;
        const expType = attrDef.type.key;
        let mismatch = false;
        switch (expType) {
          case 'INTEGER': case 'BIGINT': case 'FLOAT': case 'DOUBLE': case 'DECIMAL':
            if (typeof val !== 'number') mismatch = true; break;
          // case 'BOOLEAN':
          //   if (typeof val !== 'boolean') mismatch = true; break;
          case 'DATE':
            if (isNaN(Date.parse(val))) mismatch = true; break;
          case 'JSON':
            if (typeof val !== 'object') mismatch = true; break;
          default: return;
        }
        if (mismatch) {
          errors.push({ item, field: key, error: 'Type mismatch', detail: `Expected ${expType} for '${key}', got ${typeof val}` });
        }
      });
      if (!errors.some(e => e.item === origItem || e.item === item)) validRecords.push(item);
    });

    if (!validRecords.length) {
      return res.status(400).json({ message: 'No valid records to process', failedCount: errors.length, errors });
    }

    // Add metadata and perform field-level encryption/sanitization for households
    const currentUser = req.thisUser?.id;
    const timestamp = new Date();
    const validData = validRecords.map(item => {
      const record = {
        ...item,
        createdBy: currentUser,
        updatedAt: timestamp,
        createdAt: item.createdAt || timestamp,
      };
      if (modelName === 'households') {
        // --- RESPONDENT NAME ---
        let name = record.respondents_name || '';
        name = name.trim();
        record.respondents_name = name.length > 0 ? name : 'unspecified';
      }
      return record;
    });

    // Upsert logic with unique constraint handling
    for (const item of validData) {
      const uniqueFields = Object.keys(attributes).filter(attr =>
        attributes[attr].unique || (attributes[attr].primaryKey && attr !== 'id')
      );
      const where = {};
      uniqueFields.forEach(f => { if (item[f] != null) where[f] = item[f]; });
      try {
        let existing = Object.keys(where).length ? await Model.findOne({ where }) : null;
        if (existing) {
          const updateData = { ...item };
          uniqueFields.forEach(f => delete updateData[f]);
          await existing.update(updateData);
          updated.push(item.code || existing.id);
        } else {
          try {
            const rec = await Model.create(item);
            inserted.push(rec.id);
          } catch (createErr) {
            if (createErr.name === 'SequelizeUniqueConstraintError') {
              const vioWhere = {};
              Object.keys(createErr.fields).forEach(f => vioWhere[f] = item[f]);
              const rec = await Model.findOne({ where: vioWhere });
              if (rec) {
                const upd = { ...item };
                uniqueFields.forEach(f => delete upd[f]);
                await rec.update(upd);
                updated.push(item.code || rec.id);
              } else {
                errors.push({ item, error: createErr.name, detail: createErr.message });
              }
            } else throw createErr;
          }
        }
      } catch (err) {
        errors.push({ item, error: err.name || 'UpsertError', detail: err.message });
      }
    }

    // If importing households, recategorize monthly_income via raw SQL
    if (modelName === 'households') {
      await db.sequelize.query(
        `UPDATE "households"
         SET monthly_income = CASE
           WHEN monthly_income::int <= 5000 THEN '0_5000'
           WHEN monthly_income::int BETWEEN 5001 AND 10000 THEN '5001_10000'
           WHEN monthly_income::int BETWEEN 10001 AND 15000 THEN '10001_15000'
           WHEN monthly_income::int BETWEEN 15001 AND 20000 THEN '15001_20001'
           WHEN monthly_income::int BETWEEN 20001 AND 30000 THEN '20001_30000'
           WHEN monthly_income::int BETWEEN 30001 AND 50000 THEN '30001_50000'
           WHEN monthly_income::int > 50000 THEN 'above_50000'
         END
         WHERE monthly_income ~ '^[0-9]+$';`
      );
    }

    // Final response
    const hasErrors = errors.length > 0;
    return res.status(hasErrors ? 207 : 200).json({
      message: hasErrors ? 'Import completed with some errors' : 'Import process completed successfully',
      insertedCount: inserted.length,
      updatedCount: updated.length,
      failedCount: errors.length,
      errors,
      code: hasErrors ? '0001' : '0000',
    });
  } catch (fatalErr) {
    console.error('Fatal upsert error:', fatalErr);
    return res.status(500).json({ message: 'Internal Server Error', failedCount: 1, error: fatalErr.message });
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

  if (!obj.id) {
    delete obj.id;
  }
 
  
  db.models[reg_model]
  .create(obj)
  .then(async function (item) {
    // Special for projects where we store the project-activity relation
    console.log('temI', item)
  
    
    event.status= 'Successful'
 
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

 
 


function toGeoJSONFeatureCollection(rows, geomField = 'geom') {
  const features = rows.map(row => {
    const geom = row[geomField];
    const { [geomField]: _, ...properties } = row.toJSON();

    return {
      type: "Feature",
      geometry: geom,
      properties,
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}




exports.streamAllGeo = async (req, res) => {
  const reg_model = req.query.model;

  // Check if geometry should be excluded from associated models
  const excludeGeoFromAssociations = req.query.excludeGeoFromAssociations === 'true';

  // Get the array of models to associate, passed in the request (optional)
  const associatedModels = req.query.associatedModels ? req.query.associatedModels.split(',') : [];

  // Define the base query to retrieve geometries (already adapted from previous example)
  let qry2 =
    "SELECT row_to_json(fc) AS json_build_object FROM (SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(ST_ConvexHull(geom))::json AS geometry, (SELECT json_strip_nulls(row_to_json(" +
    reg_model +
    ")) FROM (SELECT id) t) AS properties FROM " +
    reg_model +
    " WHERE ST_IsEmpty(geom) = false AND geom IS NOT NULL) AS f) AS fc";

  // Set up the Sequelize model and options
  let modelOptions = {
    include: [], // Here we will include associated models dynamically if present
    // attributes: {
    //   exclude: ['geom'], // Exclude the `geom` field from the main model if necessary
    // },
  };

  // Dynamically include models based on the array of associated models passed in the request (if provided)
  if (associatedModels.length > 0) {
    associatedModels.forEach(modelName => {
      // Check if the model exists in the db models and then include it
      const model = db.models[modelName];
      if (model) {
        modelOptions.include.push({
          model: model,
        attributes: excludeGeoFromAssociations ? { exclude: ['geom'] } : ['id', 'name', 'geom'], // Include or exclude the `geom` field
        });
      }
    });
  }

  // Cache logic

  console.log('modelOptions',modelOptions)


  if (req.query.cache_key && req.query.cache_key !== '') {
    const cache_key = req.query.cache_key;
    const cacheDuration = 3600; // Cache duration in seconds

    const lastRow = await db.models[reg_model].findOne({
      attributes: ['updatedAt'],
      order: [['updatedAt', 'DESC']],
    });

    const lastModified = lastRow ? lastRow.updatedAt : Date.now();

    try {
      const cacheResults = await redisClient.get(cache_key);

      if (cacheResults) {
        const result = JSON.parse(cacheResults);

        if (lastModified && lastModified > result.lastModified) {
          const response = await db.models[reg_model].findAll(modelOptions);

          await redisClient.set(cache_key, JSON.stringify({
            data: response,
            lastModified: Date.now(),
          }), {
            EX: cacheDuration,
            NX: true,
          });

          res.status(200);
          const readableStream = new Readable();
          readableStream.push(JSON.stringify({
            fromCache: false,
            cache_key: cache_key,
            data: response,
            code: '0000',
          }));
          readableStream.push(null);
          readableStream.pipe(res);
        } else {
          res.status(200);
          const readableStream = new Readable();
          readableStream.push(JSON.stringify({
            fromCache: true,
            cache_key: cache_key,
            data: result.data,
            code: '0000',
          }));
          readableStream.push(null);
          readableStream.pipe(res);
        }
      } else {
        const response = await db.models[reg_model].findAll(modelOptions);


        const geojson = toGeoJSONFeatureCollection(response);



        await redisClient.set(cache_key, JSON.stringify({
          data: response,
          lastModified: Date.now(),
        }), {
          EX: cacheDuration,
          NX: true,
        });

        res.status(200);
        const readableStream = new Readable();
        readableStream.push(JSON.stringify({
          fromCache: false,
          cache_key: cache_key,
          data: geojson,
          code: '0000',
        }));
        readableStream.push(null);
        readableStream.pipe(res);
      }
    } catch (error) {
      res.status(500);
      const readableStream = new Readable();
      readableStream.push(JSON.stringify({
        message: 'Internal server error',
        code: 'SERVER_ERROR',
      }));
      readableStream.push(null);
      readableStream.pipe(res);
    }
  } else {
    const result_geo = await db.models[reg_model].findAll(modelOptions);


    const geojson = toGeoJSONFeatureCollection(result_geo);


    res.status(200);
    const readableStream = new Readable();
    readableStream.push(JSON.stringify({
      data: geojson,
      code: '0000',
    }));
    readableStream.push(null);
    readableStream.pipe(res);
  }
};


exports.streamMinimalGeo = async (req, res) => {
  console.log('Minimal GEO', req.query.model);
  try {
    const reg_model = req.query.model;

    // Validate model parameter
    if (!reg_model || typeof reg_model !== 'string') {
      res.status(400);
      const readableStream = new Readable();
      readableStream.push(JSON.stringify({
        message: 'Model parameter is required and must be a string',
        code: 'INVALID_MODEL'
      }));
      readableStream.push(null);
      readableStream.pipe(res);
      return;
    }

    // Check if the model exists
    if (!db.models[reg_model]) {
      res.status(404);
      const readableStream = new Readable();
      readableStream.push(JSON.stringify({
        message: `Model ${reg_model} not found`,
        code: 'MODEL_NOT_FOUND'
      }));
      readableStream.push(null);
      readableStream.pipe(res);
      return;
    }

    // Dynamically build attributes based on model schema
    const modelAttributes = db.models[reg_model].rawAttributes;
    const attributes = [
      'id',
      [db.sequelize.fn('ST_AsGeoJSON', db.sequelize.col('geom')), 'geometry']
    ];
    const optionalFields = ['ward_id', 'subcounty_id', 'county_id'];
    optionalFields.forEach(field => {
      if (modelAttributes[field]) {
        attributes.push([db.sequelize.col(field), field]);
      }
    });

    // Query the model for id, geometry, and available admin IDs
    const records = await db.models[reg_model].findAll({
      attributes: attributes,
      where: {
        geom: { [db.Sequelize.Op.ne]: null },
        [db.Sequelize.Op.and]: db.sequelize.literal('ST_IsEmpty(geom) = false')
      }
    });

    // Convert to GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: records.map(record => {
        const properties = { id: record.id };
        optionalFields.forEach(field => {
          if (modelAttributes[field]) {
            properties[field] = record.get(field);
          }
        });
        return {
          type: 'Feature',
          geometry: JSON.parse(record.get('geometry')),
          properties: properties
        };
      })
    };

    // Stream the GeoJSON FeatureCollection directly
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    const readableStream = new Readable();
    readableStream.push(JSON.stringify(geojson));
    readableStream.push(null);
    readableStream.pipe(res);

  } catch (error) {
    console.error('Error in streamMinimalGeo:', error);
    res.status(500);
    const readableStream = new Readable();
    readableStream.push(JSON.stringify({
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    }));
    readableStream.push(null);
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

 
 

exports.xmodelSelectGeo = async (req, res) => {
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
                 ST_AsGeoJSON(geom, 5)::json AS geometry,
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
                 ST_AsGeoJSON(geom, 5)::json AS geometry,
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

const { QueryTypes } = require('sequelize');

exports.modelSelectGeo = async (req, res) => {
  console.log('modelSelectGeo--------->');
  try {
    const reg_model = req.body.model;
    const columnFilterField = req.body.columnFilterField;

    if (!reg_model || !columnFilterField) {
      return res.status(400).send({
        status: 'error',
        code: 'INVALID_INPUT',
        message: 'Missing required fields: model or columnFilterField',
        data: null,
        meta: {},
      });
    }

    let arr;
    if (req.body.selectedParents?.length > 0) {
      arr = req.body.selectedParents;
    } else if (req.body.filtredGeoIds?.length > 0) {
      arr = Array.isArray(req.body.filtredGeoIds) ? req.body.filtredGeoIds : [req.body.filtredGeoIds];
    } else if (req.body.id) {
      arr = [req.body.id];
    } else {
      return res.status(400).send({
        status: 'error',
        code: 'INVALID_IDENTIFIERS',
        message: 'No valid identifiers provided (selectedParents, filtredGeoIds, or id)',
        data: null,
        meta: {},
      });
    }

    // Get column names excluding 'geom'
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = :table
        AND column_name != 'geom'
    `;
    const columnResults = await sequelize.query(columnsQuery, {
      replacements: { table: reg_model },
      type: QueryTypes.SELECT,
    });

    const columns = columnResults.map(row => row.column_name);
    const selectedColumns = columns.map(col => `"${col}"`).join(', ');

    const propertiesClause = `
      json_strip_nulls(
        row_to_json((SELECT x FROM (SELECT ${selectedColumns}) x))
      ) AS properties
    `;

    // Base query template with dynamic WHERE clause
    let whereClause = 'WHERE geom IS NOT NULL';

    if (arr[0] && arr.length > 0) {
      const filterValues = Array.isArray(columnFilterField) ? columnFilterField : [columnFilterField];
      const escapedArr = arr.map(val => `'${val}'`).join(', ');
      const filterClause = filterValues
        .map(value => `"${value}" IN (${escapedArr})`)
        .join(' OR ');

      whereClause += ` AND (${filterClause})`;
    }

    const fullQuery = `
      SELECT row_to_json(fc) AS json_build_object
      FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(geom, 8)::json AS geometry,
                 ${propertiesClause}
          FROM ${reg_model}
          ${whereClause}
        ) AS f
      ) AS fc
    `;

    const result_geo = await sequelize.query(fullQuery, {
      mapToModel: false,
    });

    res.status(200).send({
      status: 'success',
      code: '0000',
      message: 'Geospatial data retrieved successfully',
      data: result_geo,
      meta: {
        timestamp: new Date().toISOString(),
        recordCount: result_geo.length,
      },
    });
  } catch (error) {
    console.error('Error in modelSelectGeo:', error);
    res.status(500).send({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'An error occurred while processing the request',
      data: null,
      meta: { errorDetails: error.message },
    });
  }
};



 
exports.modelSelectParcelGeo = async (req, res) => {
  try {
    const reg_model = req.body.model;
    const columnFilterField = req.body.columnFilterField;

    if (!reg_model || !columnFilterField) {
      return res.status(400).send({
        code: 'INVALID_INPUT',
        message: 'Model and columnFilterField are required.',
      });
    }

    // Determine the array of identifiers
    let arr = [];
    if (req.body.selectedParents?.length > 0) {
      arr = req.body.selectedParents;
    } else if (req.body.filtredGeoIds?.length > 0) {
      arr = Array.isArray(req.body.filtredGeoIds)
        ? req.body.filtredGeoIds
        : [req.body.filtredGeoIds];
    } else if (req.body.id) {
      arr = [req.body.id];
    }

    // Fetch column names except 'geom'
    const columnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = :table 
        AND column_name != 'geom'
    `;
    const columns = await sequelize.query(columnQuery, {
      replacements: { table: reg_model },
      type: QueryTypes.SELECT,
    });

    const columnList = columns.map(col => `"${col.column_name}"`).join(', ');

    const propertiesClause = `
      json_strip_nulls(
        row_to_json((
          SELECT x FROM (
            SELECT ${columnList}
          ) x
        ))
      ) AS properties
    `;

    // Build filter clause
    let filterClause = '';
    if (arr.length > 0) {
      const fields = Array.isArray(columnFilterField) ? columnFilterField : [columnFilterField];
      const clauses = fields.map(field => `"${field}" IN (:values)`);
      filterClause = `AND (${clauses.join(' OR ')})`;
    }

    const qry2 = `
      SELECT row_to_json(fc) AS json_build_object
      FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(geom, 8)::json AS geometry,
                 ${propertiesClause}
          FROM ${reg_model}
          WHERE geom IS NOT NULL
          ${filterClause}
        ) AS f
      ) AS fc
    `;

    const result_geo = await sequelize.query(qry2, {
      replacements: { values: arr },
      type: QueryTypes.SELECT,
    });

    res.status(200).send({
      data: result_geo,
      code: '0000',
    });
  } catch (error) {
    console.error('Error in modelSelectParcelGeo:', error);
    res.status(500).send({
      code: 'SERVER_ERROR',
      message: error.message,
    });
  }
};





exports.xmodelSelectParcelGeo = async (req, res) => {
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
     
      if (reg_model === 'settlement' ) { 

        updateHistory(result.id,req.body,req.thisUser.id,'Edit')
        updateSettlementDataInODK(result)
      }


      console.log("Edit", result);
      if (result) {
        result.set(req.body);
        await result.save(); // Wait for the record to be saved

       

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

       // Ignore settlement_history associations
      if (associationName === 'settlement_histories') {
 
        continue;
      }


      
      let dependentRowsCount = 0;
      const associationType = association.associationType;
    
      if (associationType === 'HasMany') {
        const mdl = association.target; // Get the associated model's class reference
    
        dependentRowsCount = await mdl.count({
          where: {
            [association.foreignKey]: id
          }
        });
    
        console.log('dependentRowsCount', dependentRowsCount,associationName);
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
      updateHistory(record.id, record, req.thisUser.id, 'Delete');

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
          where: whereCondition,
        });

        deletedRecords.forEach((record) => {
          // Delete the settlement data from ODK
          deleteSettlementDataFromODK(record);

          // Update history for each record
          updateHistory(record.id, req.body, req.thisUser.id, 'Delete');
        });
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
 
 

 


exports.modelPaginatedDatafilterByColumn = async (req, res) => {
  try {
    const {
      model: modelName,
      filters = [],
      filterValues = [],
      associated_multiple_models = [],
      nested_models = [],
      nested_filter = [],
      dateRange = [], // Changed to expect array [date1, date2]
      limit = 10,
      page = 1,
      cache_key,
    } = req.body;

    if (!modelName) {
      return res.status(400).json({ message: 'Model name is required', code: 'INVALID_INPUT' });
    }

    const Model = db.models[modelName];
    if (!Model) {
      return res.status(400).json({ message: `Model "${modelName}" not found`, code: 'MODEL_NOT_FOUND' });
    }

     // Decryption setup for households model
    const isHouseholdsModel = modelName === 'households';
    const decryptKey = '***REDACTED***';


    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({ message: 'Invalid limit or page number', code: 'INVALID_PAGINATION' });
    }

    const baseQuery = { where: {} };

    const hasGeomColumn = Object.keys(Model.rawAttributes).includes('geom');

    // Handle column filters
    if (filters.length > 0 && filterValues.length === filters.length) {
      const modelAttributes = Object.keys(Model.rawAttributes).filter(attr => !hasGeomColumn || attr !== 'geom');
      const validFilters = filters
        .map((filter, i) => ({
          field: filter,
          value: filterValues[i],
        }))
        .filter(({ field }) => modelAttributes.includes(field));

      if (validFilters.length === 0) {
        return res.status(400).json({ message: 'No valid filter fields provided', code: 'INVALID_FILTERS' });
      }

      baseQuery.where = {
        [Op.and]: validFilters.map(({ field, value }) => ({ [field]: value })),
      };
    }

    // Handle date range filter for createdAt
    if (Array.isArray(dateRange) && dateRange.length === 2) {
      const [startDate, endDate] = dateRange.map(date => new Date(date));

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format in dateRange', code: 'INVALID_DATE_RANGE' });
      }

      if (startDate > endDate) {
        return res.status(400).json({ message: 'First date must be before second date', code: 'INVALID_DATE_RANGE' });
      }

      // Add date range to where clause
      baseQuery.where.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    } else if (dateRange.length !== 0) {
      return res.status(400).json({ message: 'dateRange must be an array with two dates', code: 'INVALID_DATE_RANGE' });
    }

    const total = await Model.count(baseQuery);

    const includeModels = [];

    for (const assocModel of associated_multiple_models) {
      const RelatedModel = db.models[assocModel];
      if (!RelatedModel) {
       

 return res.status(400).json({ message: `Associated model "${assocModel}" not found`, code: 'INVALID_ASSOCIATION' });
      }

      const relatedHasGeom = Object.keys(RelatedModel.rawAttributes).includes('geom');
      const modelIncl = { 
        model: RelatedModel,
        attributes: relatedHasGeom ? { exclude: ['geom'] } : undefined
      };
      if (assocModel === 'users') {
        modelIncl.attributes = ['name', 'email', 'phone'];
      }
      includeModels.push(modelIncl);
    }

    if (nested_models.length >= 2) {
      const childModel = db.models[nested_models[0]];
      const grandChildModel = db.models[nested_models[1]];
      if (!childModel || !grandChildModel) {
        return res.status(400).json({ message: 'Invalid nested model names', code: 'INVALID_NESTED_MODELS' });
      }

      const childHasGeom = Object.keys(childModel.rawAttributes).includes('geom');
      const grandChildHasGeom = Object.keys(grandChildModel.rawAttributes).includes('geom');
      const nestedQuery = nested_filter.length === 2 ? { [nested_filter[0]]: nested_filter[1] } : null;
      includeModels.push({
        model: childModel,
        attributes: childHasGeom ? { exclude: ['geom'] } : undefined,
        include: [{
          model: grandChildModel,
          attributes: grandChildHasGeom ? { exclude: ['geom'] } : undefined,
          ...(nestedQuery && { where: nestedQuery }),
        }],
      });
    }

    if (Model.associations.children && Model.associations.parent) {
      // Get the actual field names from the model attributes
      const nameField = Object.keys(Model.rawAttributes).includes('name') ? 'name' : 
                       Object.keys(Model.rawAttributes).includes('title') ? 'title' : 'id';
      
      includeModels.push(
        { 
          model: Model, 
          as: 'children', 
          attributes: ['id', nameField], 
          required: false 
        },
        { 
          model: Model, 
          as: 'parent', 
          attributes: ['id', nameField], 
          required: false 
        }
      );
    }

    const query = {
      where: baseQuery.where,
      include: includeModels,
      order: [['createdAt', 'DESC']],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      distinct: true,
      attributes: hasGeomColumn ? {
      //  exclude: ['geom'],
        include: [
          [db.sequelize.literal(`CASE WHEN "${Model.tableName}"."geom" IS NOT NULL THEN true ELSE false END`), 'hasGeom']
        ]
      } : undefined
    };


  // Handle attribute selection (no decryption)
if (isHouseholdsModel) {
  query.attributes = {
    exclude: hasGeomColumn ? ['geom'] : [],
    include: [
      // just pull the raw column values
      'respondents_name',
      'telephone',
      // if you still want the hasGeom flag:
      ...(hasGeomColumn
        ? [[
            db.sequelize.literal(
              `CASE WHEN "${Model.tableName}"."geom" IS NOT NULL THEN true ELSE false END`
            ),
            'hasGeom',
          ]]
        : []),
    ],
  };
} else if (hasGeomColumn) {
  // Default: exclude geom and include hasGeom flag
  query.attributes = {
  //  exclude: ['geom'],
    include: [
      [
        db.sequelize.literal(
          `CASE WHEN "${Model.tableName}"."geom" IS NOT NULL THEN true ELSE false END`
        ),
        'hasGeom',
      ],
    ],
  };
}






    if (cache_key) {
      const cacheDuration = 3600;
      const lastRow = await Model.findOne({
        attributes: ['updatedAt'],
        order: [['updatedAt', 'DESC']],
      });
      const lastModified = lastRow?.updatedAt?.getTime() ?? Date.now();

      const cacheResults = await redisClient.get(cache_key);
      if (cacheResults) {
        const result = JSON.parse(cacheResults);
        if (lastModified <= result.lastModified) {
          return res.status(200).json({
            fromCache: true,
            cache_key,
            data: result.data,
            total,
            code: '0000',
          });
        }
      }

      const response = await Model.findAndCountAll(query);
      const cacheData = {
        data: response.rows,
        total,
        lastModified: Date.now(),
      };
      await redisClient.set(cache_key, JSON.stringify(cacheData), { EX: cacheDuration });

      return res.status(200).json({
        fromCache: false,
        cache_key,
        data: response.rows,
        total,
        code: '0000',
      });
    }

    const response = await Model.findAndCountAll(query);
    return res.status(200).json({
      fromCache: false,
      data: response.rows,
      total,
      code: '0000',
    });

  } catch (error) {
    console.error('Error in modelPaginatedDatafilterByColumn:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
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

 
 
 


 

 

exports.modelPaginatedDatafilterBykeyWord = async (req, res) => {
  try {
    console.log('/api/v1/data/paginated/filter --- Keyword', req.body);

    const {
      model: reg_model,
      searchField: field,
      searchKeyword,
      associated_multiple_models: associatedModels = [],
      nested_models: nestedModels = [],
      filters = [],
      filterValues = [],
      limit = 20,
      page = 1,
      returnAll = false,
    } = req.body;

    // Validate model existence
    const Model = db.models[reg_model];
    if (!Model) {
      return res.status(400).json({ message: `Model "${reg_model}" not found`, code: 'MODEL_NOT_FOUND' });
    }

    // Check if geom exists in the main model
    const hasGeomColumn = Object.keys(Model.rawAttributes).includes('geom');

    // Build include array for associations
    const includeModels = [];

    // Handle associated models
    if (associatedModels.length > 0) {
      associatedModels.forEach(modelName => {
        const model = db.models[modelName];
        if (!model) {
          return res.status(400).json({ message: `Associated model "${modelName}" not found`, code: 'INVALID_ASSOCIATION' });
        }
        const relatedHasGeom = Object.keys(model.rawAttributes).includes('geom');
        includeModels.push({
          model: model,
          raw: true,
          nested: true,
          attributes: relatedHasGeom ? { exclude: ['geom'] } : undefined,
        });
      });
    }

    // Handle nested models
    const [childModel, grandChildModel] = nestedModels.map(nested => db.models[nested]);
    if (childModel && grandChildModel) {
      const childHasGeom = Object.keys(childModel.rawAttributes).includes('geom');
      const grandChildHasGeom = Object.keys(grandChildModel.rawAttributes).includes('geom');
      includeModels.push({
        model: childModel,
        include: [{
          model: grandChildModel,
          raw: true,
          nested: true,
          attributes: grandChildHasGeom ? { exclude: ['geom'] } : undefined,
        }],
        raw: true,
        nested: true,
        attributes: childHasGeom ? { exclude: ['geom'] } : undefined,
      });
    }

    // Build query
    const queryCondition = {};

    // Sanitize and apply filters
    if (filters.length > 0 && filterValues.length === filters.length) {
      const modelAttributes = Object.keys(Model.rawAttributes) ;
      const validFilters = filters
        .map((filter, i) => ({
          field: filter,
          value: filterValues[i],
        }))
        .filter(({ field }) => modelAttributes.includes(field));

      if (validFilters.length === 0) {
        return res.status(400).json({ message: 'No valid filter fields provided', code: 'INVALID_FILTERS' });
      }

      validFilters.forEach(({ field, value }) => {
        queryCondition[field] = value;
      });
    }

    // Apply keyword search
    if (field && searchKeyword) {
      if (!Object.keys(Model.rawAttributes).includes(field)) {
        return res.status(400).json({ message: `Search field "${field}" not found in model`, code: 'INVALID_SEARCH_FIELD' });
      }
      queryCondition[field] = {
        [Op.iLike]: `%${searchKeyword.toLowerCase()}%`,
      };
    }

    const qry = {
      where: queryCondition,
      include: includeModels,
      attributes: hasGeomColumn ? {
       // exclude: ['geom'],
        include: [
          [db.sequelize.literal(`CASE WHEN "${Model.tableName}"."geom" IS NOT NULL THEN true ELSE false END`), 'hasGeom']
        ]
      } : undefined,
    };

    // Only add pagination if returnAll is NOT true
    if (!returnAll) {
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedPage) || parsedPage < 1) {
        return res.status(400).json({ message: 'Invalid limit or page number', code: 'INVALID_PAGINATION' });
      }
      qry.limit = parsedLimit;
      qry.offset = (parsedPage - 1) * parsedLimit;
    }

    console.log('The xQuery----->', qry);

    const list = await Model.findAndCountAll(qry);

    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000',
    });
  } catch (error) {
    console.error('Error in modelPaginatedDatafilterBykeyWord:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
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
const settlement_history = require('../models/settlement_history')

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
    fileSize: 10 * 1024 * 1024 * 1024, // 1GB limit
  },
});


exports.xbatchDocumentsUpload = (req, res) => {
      // The uploaded files can be accessed using `req.files`
      console.log('files:', req.body);
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

    if (!Array.isArray(myFiles)) {
      myFiles = [myFiles]; // Convert to an array with one element
    }
 
    
    for (let i = 0; i < myFiles.length; i++) {
      
 
       var obj = {}
     // var column = req.body.field_id[i]
     // obj[column] = req.body[column][i]

        // Check if 'field_id' exists in 'req.body' before adding 'column' property to 'obj'
      if (req.body.field_id) {
        var column = req.body.field_id[i]
        obj[column] = req.body[column][i];
      }

      obj.category = req.body.category[i]
      obj.format = req.body.format[i]
      obj.size = req.body.size[i]
      obj.createdBy = req.body.createdBy[i] 
      obj.protectedFile = req.body.protected[i] 
      obj.name = myFiles[i].originalname
      obj.code = crypto.randomUUID()
      obj.location = myFiles[i].path
       objs.push(obj)
      console.log(obj)
  
   



      try {
         await db.models[reg_model].create(obj)
        // for (const obj of objs) {
        //   await db.models[reg_model].create(obj);
        // }

      }
            
      catch (error) {
        console.log(error)

        
      res.status(500).send({
        message: 'Upload failed. ' + error + ' errors',
        code: '0000'
      })
      }


    }
  

    res.status(200).send({
      message: 'Batch Upload Successful',
      code: '0000'
    })
  

    // Other form fields (if any) can be accessed using `req.body`
  //  console.log('other form fields:', req.body);

    // Process the files or respond to the client accordingly
   // res.json({ message: 'Form submission and file upload successful!' });
  });
};


exports._newbatchDocumentsUpload = (req, res) => {
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

exports.batchDocumentsUpload = (req, res) => {
  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send({
        message: 'Upload failed.',
        code: '0000'
      });
    }

    var reg_model = 'document';
    let myFiles = req.files;
    let objs = [];
    let uploadStats = {
      uploaded: 0,
      skipped: 0,
      failed: 0
    };

    if (!Array.isArray(myFiles)) {
      myFiles = [myFiles];
    }

    for (let i = 0; i < myFiles.length; i++) {
      var obj = {};
      
      if (req.body.field_id) {
        var column = Array.isArray(req.body.field_id) ? req.body.field_id[i] : req.body.field_id;
        if (myFiles.length > 1) {
          obj[column] = req.body[column][i];
          obj.category = req.body.category[i];
          obj.format = req.body.format[i];
          obj.size = req.body.size[i];
          obj.createdBy = req.body.createdBy[i];
          obj.protectedFile = req.body.protected[i];
          obj.name = myFiles[i].originalname;
          obj.location = myFiles[i].path;
          obj.code = crypto.randomUUID();
        } else {
          obj[column] = req.body[column];
          obj.format = req.body.format;
          obj.size = req.body.size;
          obj.createdBy = req.body.createdBy[i];
          obj.protectedFile = req.body.protected[i];
          obj.name = myFiles[i].originalname;
          obj.location = myFiles[i].path;
          obj.code = crypto.randomUUID();
          obj.category = req.body.category;
        }
      } else {
        if (myFiles.length > 1) {
          obj.category = req.body.category[i];
          obj.format = req.body.format[i];
          obj.size = req.body.size[i];
          obj.createdBy = req.body.createdBy[i];
          obj.protectedFile = req.body.protected[i];
          obj.name = myFiles[i].originalname;
          obj.location = myFiles[i].path;
          obj.code = crypto.randomUUID();
        } else {
          obj.format = req.body.format;
          obj.size = req.body.size;
          obj.createdBy = req.body.createdBy[i];
          obj.protectedFile = req.body.protected[i];
          obj.name = myFiles[i].originalname;
          obj.location = myFiles[i].path;
          obj.code = crypto.randomUUID();
          obj.category = req.body.category;
        }
      }

      objs.push(obj);
    }

    try {
      for (const nobj of objs) {
        const existingDoc = await db.models[reg_model].findOne({
          where: {
            name: nobj.name,
            location: nobj.location
          }
        });

        if (existingDoc) {
          console.log(`Skipping existing document: ${nobj.name}`);
          uploadStats.skipped++;
          continue;
        }

        try {
          await db.models[reg_model].create(nobj);
          uploadStats.uploaded++;
          console.log(`Inserted document: ${nobj.name}`);
        } catch (error) {
          console.log(`Failed to insert document: ${nobj.name}`, error);
          uploadStats.failed++;
        }
      }

      res.status(200).send({
        message: `Batch Upload Completed: ${uploadStats.uploaded} uploaded, ${uploadStats.skipped} skipped, ${uploadStats.failed} failed`,
        code: '0000',
        stats: {
          uploaded: uploadStats.uploaded,
          skipped: uploadStats.skipped,
          failed: uploadStats.failed
        }
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: `Upload process failed: ${uploadStats.uploaded} uploaded, ${uploadStats.skipped} skipped, ${uploadStats.failed} failed. Error: ${error.message}`,
        code: '0000',
        stats: uploadStats
      });
    }
  });
};

 

exports.checkDocuments = async (req, res) => {

  console.log('---------------------check Docs ------------------------', req.body)
  try {
    const { documents } = req.body;
    const reg_model = 'document';

    console.log(req.body)

    // Validate input
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).send({
        message: 'No documents provided. Refresh your page to start again',
        code: '0001'
      });
    }

    // Prepare results
    const results = [];

    // Check each document
    for (const doc of documents) {
      const { name, hash } = doc;

      // Validate document name
      if (!name) {
        results.push({
          name: null,
          exists: false,
          message: 'Document name is required'
        });
        continue;
      }

      // Build query conditions
      const conditions = { name };
      if (hash) {
        conditions.hash = hash; // Assumes document model has a hash field
      }

      // Check if document exists
      const existingDoc = await db.models[reg_model].findOne({
        where: conditions
      });

      results.push({
        name,
        exists: !!existingDoc,
        message: existingDoc ? 'Document already exists' : 'Document does not exist'
      });
    }

    // Check for existing documents and build message
    const existingDocs = results.filter(result => result.exists).map(result => result.name);
    let message = `Checked ${documents.length} documents. Preparing to upload...`;
    if (existingDocs.length > 0) {
      message = `The following documents already exist: ${existingDocs.join(', ')}`;
    }

    // Respond with results
    res.status(200).send({
      message,
      code: '0000',
      results
    });
  } catch (error) {
    console.error('Error in document pre-check:', error);
    res.status(500).send({
      message: 'Failed to check documents: ' + error.message,
      code: '0002',
      results: []
    });
  }
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
              "deleted": 'false',
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
async function xdeleteSettlementDataFromODK(settToDelete) {

  console.log("here to delete the settlement from ODK",)
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
         // console.log(body)
          let entities = JSON.parse(body);

        //  console.log(entities)

          const targetCode =settToDelete.code; // The code you want to filter by

 
          const filteredEntity = entities.value.filter(item => item.code === targetCode);
         // console.log("filteredEntity",filteredEntity,settToDelete.code )

          
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
              //  console.log(response)
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

 

async function deleteSettlementDataFromODK(settToUpdate) {

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
          "deleted": 'true',
       
      
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


 
exports.xgetAllListforDownload = async (req, res) => {
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


 
exports.getAllListforDownload = async (req, res) => {
  console.log('Req-body:', req.body);

  const reg_model = req.body.model;

  // Base query with conditional decryption
  const baseQuery = {
    where: {},
    attributes: reg_model === 'grievance'
      ? {
          include: [
            [
              sequelize.fn(
                'PGP_SYM_DECRYPT',
                sequelize.cast(sequelize.col(`${reg_model}.name`), 'bytea'),
                '***REDACTED***'
              ),
              'name'
            ],
            [
              sequelize.fn(
                'PGP_SYM_DECRYPT',
                sequelize.cast(sequelize.col(`${reg_model}.national_id`), 'bytea'),
                '***REDACTED***'
              ),
              'national_id'
            ]
          ],
          exclude: ['latitude', 'longitude', 'coordinates', 'name'] // exclude encrypted name
        }
      : {
          exclude: ['latitude', 'longitude', 'coordinates']
        }
  };

  // Filtering
  if (
    req.body.filters &&
    req.body.filters.length > 0 &&
    req.body.filterValues.length > 0 &&
    req.body.filterValues.length === req.body.filters.length
  ) {
    const lstQueries = req.body.filters.map((filter, i) => ({
      [filter]: req.body.filterValues[i]
    }));
    baseQuery.where = { [Op.and]: lstQueries };
  }

  // Associated Models
  const associated_multiple_models = req.body.associated_multiple_models || [];

  // Nested Models
  const nested_models = req.body.nested_models || [];
  const nestedQuery = req.body.nested_filter
    ? { [req.body.nested_filter[0]]: req.body.nested_filter[1] }
    : {};

  const includeModels = [];

  // Handle associated models
  if (associated_multiple_models.length > 0) {
    for (const modelName of associated_multiple_models) {
      const model = db.models[modelName];
      const attributes = model.rawAttributes;

      const modelAttributes = ['id'];
      for (const attributeKey in attributes) {
        if (attributeKey.toLowerCase().includes('name')) {
          modelAttributes.push(attributeKey);
        }
        if (attributeKey.toLowerCase().includes('title')) {
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

  // Handle nested models
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
      include: [
        {
          model: grand_child_model,
          where: nestedQuery,
          attributes: grandChildAttributes,
          raw: true,
          nested: true
        }
      ],
      attributes: childAttributes
    };

    includeModels.push(nestedModels);
  }

  // Final query
  const qry = {
    ...baseQuery,
    include: includeModels.length > 0 ? includeModels : undefined,
    order: [['createdAt', 'DESC']]
  };

  console.log('Final Query:', qry);

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

 
 

exports.xfindPotentialDuplicates = async (req, res) => {
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

 

async function xupdateHistory(settlementId, updatedData, userId,change_type) {
  const settlement = await db.models.settlement.findByPk(settlementId);
  if (!settlement) {
    throw new Error('Settlement not found');
  }

  const originalData = settlement.toJSON();

  // Save changes in history
  await db.models.settlement_history.create({
    settlement_id: settlementId,
    changed_by: userId,
    change_type: change_type,
    changes: {
      before: originalData,
      after: updatedData
    }
  });

  // Update the settlement record
  return await settlement.update(updatedData);
}

async function updateHistory(settlementId, updatedData, userId, change_type) {
  let originalData;

  if (change_type === 'Delete') {
    // Use updatedData as both "before" and "after" since the settlement won't be found
    originalData = updatedData;
  } else {
    const settlement = await db.models.settlement.findByPk(settlementId);
    if (!settlement) {
      throw new Error('Settlement not found');
    }
    originalData = settlement.toJSON();
  }

  // Save changes in history
  await db.models.settlement_history.create({
    settlement_id:  change_type === 'Delete' ? null : settlementId,
    changed_by: userId,
    change_type: change_type,
    changes: {
      before: originalData,
      after: change_type === 'Delete' ? originalData : updatedData,
    },
  });

  // Update the settlement record if not a delete operation
  if (change_type !== 'Delete') {
    return await db.models.settlement.update(updatedData, { where: { id: settlementId } });
  }
}


exports.xrevertEdits = async (req, res) => {
  const {history_id } = req.body;
  try {
    const history = await db.models.settlement_history.findByPk(history_id);
    if (!history) {
      throw new Error('History record not found');
    }
  
    const { settlement_id, changes } = history;

     // Revert to previous state
  const settlement = await db.models.settlement.findByPk(settlement_id);
  if (!settlement) {
    throw new Error('Settlement not found');
  }
   
    await settlement.update(changes.before);
 

    res.status(200).send({
      message: "Changes reverted successfully.",
      code: '0000'

  });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.revertEdits = async (req, res) => {
  const { history_id } = req.body;

  try {
    // Find the history record by primary key
    const history = await db.models.settlement_history.findByPk(history_id);
    if (!history) {
      throw new Error('History record not found');
    }

    const { settlement_id, changes } = history;

    // Check if the settlement exists
    let settlement = await db.models.settlement.findByPk(settlement_id);
    if (!settlement) {
      // If the settlement was deleted, recreate it using the "before" data
      settlement = await db.models.settlement.create({
        id: settlement_id, // Preserve the original settlement ID if necessary
        ...changes.before, // Use the "before" data from the history
      });

      await history.update({ status: 'Reverted' }); // Update history status
      console.log('history.update')

      
      return res.status(200).send({
        message: 'Deleted settlement restored successfully.',
        code: '0000',
      });
    }

    // If the settlement exists, update it to its previous state
    await settlement.update(changes.before);
    console.log('settlement.update')
 
    await history.update({ status: 'Reverted' }); // Update history status
    console.log('history.update')

    res.status(200).send({
      message: 'Changes reverted successfully.',
      code: '0000',
    });
  } catch (error) {
    // console.log(error)
   // res.status(500).json({ error: error.message });
    res.status(500).send({
      message: 'An error occurred while reverting edits.' +  error.message ,
      code: '0004',
    });

  }
};



exports.deleteCascade = async (req, res) => {
  try {
    const { model, id } = req.body;

    console.log("Deleting", model, "with ID", id);

    // Validate input
    if (!model || !id) {
      return res.status(400).send({
        message: "Model name and record ID are required.",
      });
    }

    // Get the model dynamically
    const Model = db.models[model];

    if (!Model) {
      return res.status(404).send({
        message: "Invalid model name.",
      });
    }

    // Find the record by ID
    const record = await Model.findByPk(id);

    if (!record) {
      return res.status(404).send({
        message: `${model} record not found.`,
      });
    }

    // Get all associations for the model
    const associations = Model.associations;

    // Delete all associated records iteratively
    for (const assocName in associations) {
      const association = associations[assocName];

      if (association.target) {
        const relatedModel = association.target;

        switch (association.associationType) {
          case "HasMany":
          case "HasOne":
            await relatedModel.destroy({
              where: { [association.foreignKey]: id },
            });
            break;
          case "BelongsToMany":
            const throughTable = association.throughModel || association.through;
            await throughTable.destroy({
              where: { [association.foreignKey]: id },
            });
            break;
          case "BelongsTo":
            await relatedModel.update(
              { [association.foreignKey]: null },
              { where: { [association.foreignKey]: id } }
            );
            break;
          default:
            console.log(`Unhandled association type: ${association.associationType}`);
        }
      }
    }

    // Delete the main record
    await record.destroy();

    

    res.status(200).send({
      message: `${model} record and associated records deleted successfully.`,
      data: record,
      code: "0000",
    });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).send({
      message: "An error occurred while deleting the record.",
      error: error.message,
    });
  }
};


exports.listModels = async (req, res) => {
  try {
    const modelsInfo = [];

    for (const [modelName, model] of Object.entries(db.models)) {
      const attributes = model.rawAttributes;
      const fields = [];

      for (const [attrName, attrDetails] of Object.entries(attributes)) {
        fields.push({
          name: attrName,
          type: attrDetails.type.key || attrDetails.type.toSql()
        });
      }

      modelsInfo.push({
        model: modelName,
        attributes: fields
      });
    }

    res.status(200).send({
      message: 'Models and their attributes fetched successfully',
      code: '0000',
      models: modelsInfo
    });

  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).send({
      message: 'Failed to list models: ' + error.message,
      code: '0001',
      models: []
    });
  }
};


 


 exports._intersectGeometryWithModel = async (req, res) => {
  try {
    const { model, geometry, srid = 4326 } = req.body;

    if (!model || !Array.isArray(geometry) || geometry.length === 0) {
      return res.status(400).json({ message: 'Model name and an array of geometries are required' });
    }

    const Model = db.models[model];
    if (!Model) {
      return res.status(400).json({ message: `Model "${model}" not found` });
    }

    const targetSrid =  4326;
 

    const intersectionQuery = `
      SELECT *
      FROM "${Model.tableName}"
      WHERE ST_Intersects(
        geom,
        ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(:geojson), ${srid}), :targetSrid)
      )
    `;

    const data = await Promise.all(
      geometry.map(async (geom, i) => {
        const geojson = JSON.stringify(geom);
        const records = await db.sequelize.query(
          intersectionQuery,
          {
            replacements: { geojson, targetSrid },
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        return {
          geometry_index: i,
          records: records || [],
        };
      })
    );

    const totalCount = data.reduce((sum, d) => sum + d.records.length, 0);

    return res.status(200).json({
      message: `Found ${totalCount} intersecting records.`,
      count: totalCount,
      data,
      code: '0000',
    });

  } catch (err) {
    console.error('Intersection error:', err);
    return res.status(500).json({
      message: 'Failed to perform geometry intersection',
      error: err.message,
      code: '0002',
    });
  }
};

exports.intersectGeometryWithModel = async (req, res) => {
  try {
    const { model, geometry, srid = 4326 } = req.body;
    if (!model || !Array.isArray(geometry) || geometry.length === 0) {
      return res.status(400).json({ message: 'Model name and an array of geometries are required' });
    }

    const Model = db.models[model];
    if (!Model) {
      return res.status(400).json({ message: `Model "${model}" not found` });
    }

    // stringify the array once
    const geometriesJson = JSON.stringify(geometry);
    const targetSrid = 4326;

    const intersectionQuery = `
      WITH input_geoms AS (
        SELECT
          row_number() OVER () - 1 AS geometry_index,
          value::json AS geom_json
        FROM jsonb_array_elements(:geometries::jsonb)
      )
      SELECT
        ig.geometry_index,
        t.*
      FROM input_geoms ig
      JOIN "${Model.tableName}" t
        ON ST_Intersects(
             t.geom,
             ST_Transform(
               ST_SetSRID(
                 ST_GeomFromGeoJSON(ig.geom_json),
                 ${srid}
               ),
               :targetSrid
             )
           );
    `;

    // run one big query
    const flatResults = await db.sequelize.query(
      intersectionQuery,
      {
        replacements: { geometries: geometriesJson, targetSrid },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // regroup by geometry_index
    const buckets = {};
    for (const row of flatResults) {
      const idx = row.geometry_index;
      if (!buckets[idx]) buckets[idx] = [];
      buckets[idx].push(row);
    }

    // turn into the same shape as before
    const data = Object.entries(buckets).map(([geometry_index, records]) => ({
      geometry_index: Number(geometry_index),
      records,
    }));

    const totalCount = flatResults.length;

    return res.status(200).json({
      message: `Found ${totalCount} intersecting records.`,
      count: totalCount,
      data,
      code: '0000',
    });
  } catch (err) {
    console.error('Intersection error:', err);
    return res.status(500).json({
      message: 'Failed to perform geometry intersection',
      error: err.message,
      code: '0002',
    });
  }
};


 

 
exports.modelManyRecordsByCodes = (req, res) => {
  const reg_model   = req.body.model;
  const assocModel  = req.body.assocModel;
  const codes       = req.body.codes;   // expect an array of codes

  if (!Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({
      message: '`codes` must be a non‐empty array',
      code: '00001'
    });
  }

  const Assoc = db.models[assocModel];
  const qry = {
    where: { code: { [Op.in]: codes } },
    include: Assoc ? [{ model: Assoc }] : []
  };

  db.models[reg_model]
    .findAll(qry)
    .then(records => {
      res.status(200).json({
        data: records,     // your array of matching records
        code: '00000'      // success code
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        message: err.message,
        code: '00002'
      });
    });
};

// Returns the fields for a given model
exports.getModelFields = (req, res) => {
  try {
    const { model } = req.body;
    if (!model) {
      return res.status(400).json({ error: 'Model name is required.' });
    }
    // Try to require the model file
    let modelFile;
    try {
      modelFile = require(`../models/${model}.js`);
    } catch (e) {
      return res.status(404).json({ error: `Model file for '${model}' not found.` });
    }
    // Try to get fields
    const fields = modelFile.fields || (modelFile.default && modelFile.default.fields);
    if (!fields) {
      return res.status(404).json({ error: `Fields not found for model '${model}'.` });
    }
    return res.json({ fields });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};


// Consolidated settlement map data endpoint
 // Consolidated settlement map data endpoint
exports.xxgetSettlementMapData = async (req, res) => {
  try {
    const { settlementId } = req.body;
    
    if (!settlementId) {
      return res.status(400).json({
        message: 'Settlement ID is required',
        code: 'MISSING_SETTLEMENT_ID',
      });
    }

    console.log('🔄 Fetching consolidated map data for settlement:', settlementId);

    const models = [
      'settlement',
      'parcel', 
      'structure',
      'road',
      'streetlight',
      'crime_hotspot',
      'community_project',
      'health_facility',
      'education_facility',
      'water_point',
      'sewer',
      'piped_water',
      'powerline',
      'community_hall',
      'police_station',
      'mast',
      'dumping_site',
      'hazard_zone',
    ];

    const dataPromises = models.map(async (model) => {
      try {
        let query;
        
        if (model === 'structure') {
          // Explicitly list structure fields to avoid composite type error
          query = `
            SELECT row_to_json(fc) AS json_build_object
            FROM (
              SELECT 'FeatureCollection' AS type,
                     array_to_json(array_agg(f)) AS features
              FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(s.geom, 8)::json AS geometry,
                       json_strip_nulls(json_build_object(
                         'id', s.id,
                         'structure_id', s.structure_id,
                         'owner', s.owner,
                         'settlement_id', s.settlement_id,
                         'structure_typology', s.structure_typology,
                         'type_of_structure', s.type_of_structure,
                         'wall_material', s.wall_material,
                         'roof_material', s.roof_material,
                         'floor_material', s.floor_material,
                         'number_floors', s.number_floors,
                         'structure_room_use', s.structure_room_use,
                         'number_owners', s.number_owners,
                         'number_tenants', s.number_tenants,
                         'createdAt', s."createdAt",
                         'updatedAt', s."updatedAt"
                       )) AS properties
                FROM structure s
                WHERE s.geom IS NOT NULL AND s.settlement_id = :settlementId
              ) AS f
            ) AS fc
          `;
        } else if (model === 'settlement') {
          query = `
            SELECT row_to_json(fc) AS json_build_object
            FROM (
              SELECT 'FeatureCollection' AS type,
                     array_to_json(array_agg(f)) AS features
              FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(s.geom, 8)::json AS geometry,
                       json_strip_nulls(row_to_json(s)) AS properties
                FROM ${model} s
                WHERE s.geom IS NOT NULL AND s.id = :settlementId
              ) AS f
            ) AS fc
          `;
        } else {
          query = `
            SELECT row_to_json(fc) AS json_build_object
            FROM (
              SELECT 'FeatureCollection' AS type,
                     array_to_json(array_agg(f)) AS features
              FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(s.geom, 8)::json AS geometry,
                       json_strip_nulls(row_to_json(s)) AS properties
                FROM ${model} s
                WHERE s.geom IS NOT NULL AND s.settlement_id = :settlementId
              ) AS f
            ) AS fc
          `;
        }

        const result = await db.sequelize.query(query, {
          replacements: { settlementId },
          type: db.sequelize.QueryTypes.SELECT,
        });

        return {
          model,
          data: result[0]?.json_build_object || { type: 'FeatureCollection', features: [] },
          success: true,
        };
      } catch (error) {
        console.error(`❌ Error fetching ${model}:`, error.message);
        return {
          model,
          data: { type: 'FeatureCollection', features: [] },
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(dataPromises);
    
    const mapData = {};
    const errors = [];

    results.forEach((result) => {
      if (result.success) {
        mapData[result.model] = result.data;
      } else {
        errors.push(`${result.model}: ${result.error}`);
      }
    });

    console.log(`✅ Successfully fetched data for ${results.filter((r) => r.success).length}/${models.length} models`);

    return res.status(200).json({
      message: 'Settlement map data fetched successfully',
      data: mapData,
      errors: errors.length > 0 ? errors : undefined,
      code: '0000',
    });
  } catch (error) {
    console.error('❌ Error in getSettlementMapData:', error);
    return res.status(500).json({
      message: 'Failed to fetch settlement map data',
      error: error.message,
      code: 'SERVER_ERROR',
    });
  }
};


exports.getSettlementMapData = async (req, res) => {
  try {
    const { settlementId } = req.body;

    if (!settlementId) {
      return res.status(400).json({
        message: 'Settlement ID is required',
        code: 'MISSING_SETTLEMENT_ID',
      });
    }

    console.log('🔄 Fetching consolidated map data for settlement:', settlementId);

    const models = [
      'settlement',
      'parcel',
      'structure',
      'road',
      'streetlight',
      'crime_hotspot',
      'community_project',
      'health_facility',
      'education_facility',
      'water_point',
      'sewer',
      'piped_water',
      'powerline',
      'community_hall',
      'police_station',
      'mast',
      'dumping_site',
      'hazard_zone',
    ];

    const dataPromises = models.map(async (model) => {
      try {
        let result;

        if (model === 'structure') {
          // Fetch raw geometry as text, post-process into GeoJSON manually
          const rows = await db.sequelize.query(
            `
              SELECT ST_AsGeoJSON(geom, 8) AS geometry
              FROM structure
              WHERE geom IS NOT NULL AND settlement_id = :settlementId
            `,
            {
              replacements: { settlementId },
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          const geojson = {
            type: 'FeatureCollection',
            features: rows.map(row => ({
              type: 'Feature',
              geometry: JSON.parse(row.geometry),
              properties: {} // intentionally empty
            }))
          };

          return {
            model,
            data: geojson,
            success: true,
          };
        }

        // Use SQL-based GeoJSON for other models
        let query;
        if (model === 'settlement') {
          query = `
            SELECT row_to_json(fc) AS json_build_object
            FROM (
              SELECT 'FeatureCollection' AS type,
                     array_to_json(array_agg(f)) AS features
              FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(s.geom, 8)::json AS geometry,
                       json_strip_nulls(row_to_json(s)) AS properties
                FROM ${model} s
                WHERE s.geom IS NOT NULL AND s.id = :settlementId
              ) AS f
            ) AS fc
          `;
        } else {
          query = `
            SELECT row_to_json(fc) AS json_build_object
            FROM (
              SELECT 'FeatureCollection' AS type,
                     array_to_json(array_agg(f)) AS features
              FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(s.geom, 8)::json AS geometry,
                       json_strip_nulls(row_to_json(s)) AS properties
                FROM ${model} s
                WHERE s.geom IS NOT NULL AND s.settlement_id = :settlementId
              ) AS f
            ) AS fc
          `;
        }

        const queryResult = await db.sequelize.query(query, {
          replacements: { settlementId },
          type: db.sequelize.QueryTypes.SELECT,
        });

        return {
          model,
          data: queryResult[0]?.json_build_object || { type: 'FeatureCollection', features: [] },
          success: true,
        };
      } catch (error) {
        console.error(`❌ Error fetching ${model}:`, error.message);
        return {
          model,
          data: { type: 'FeatureCollection', features: [] },
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(dataPromises);

    const mapData = {};
    const errors = [];
    
    results.forEach(result => {
      if (result.success) {
        mapData[result.model] = result.data;
      } else {
        errors.push(`${result.model}: ${result.error}`);
      }
    });

    console.log(`✅ Successfully fetched data for ${results.filter(r => r.success).length}/${models.length} models`);

    return res.status(200).json({
      message: 'Settlement map data fetched successfully',
      data: mapData,
      errors: errors.length > 0 ? errors : undefined,
      code: '0000',
    });
  } catch (error) {
    console.error('❌ Error in getSettlementMapData:', error);
    return res.status(500).json({
      message: 'Failed to fetch settlement map data',
      error: error.message,
      code: 'SERVER_ERROR',
    });
  }
};
