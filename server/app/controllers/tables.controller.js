const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
 const op = Sequelize.Op
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')
const crypto = require('crypto');
const Activity = db.activity

// for enabling storage of files outside public...
const path = require('path')
const fs = require('fs');
const User = db.user;
const redis = require("redis");

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
 
 
   /// use the multpiple filters
   
   // if (req.body.filters) {
   //   if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
   //     for (let i = 0; i < req.body.filters.length; i++) {
   //       queryFields[req.body.filters[i]] = req.body.filterValues[i]
   //     }
   //     console.log('Final-object------------>', queryFields)
   //     qry.where = queryFields
   //   }
   // }
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
     
               let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('household.name'), 'bytea'),'maluini'),'name']
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


exports.modelAllDataNoGeo = (req, res) => {
  var reg_model = req.query.model;
  var field = req.query.searchField;
  var searchKeyword = req.query.searchKeyword;

  var ass_model = db.models[req.query.assocModel];

  //console.log('All Model Data-----> 30/10', req)

  var includeQuery = {};
  if (ass_model) {
    includeQuery.include = [{ model: ass_model, attributes: { exclude: ['geom'] } }];
  } else {
    console.log('No Associated Model');
  }
  console.log('the Query', includeQuery);
  includeQuery.attributes = { exclude: ['geom'] }; // will be applicable to users only

  if (field && searchKeyword && searchKeyword !== '' && field !== '') {
    console.log('Filtered with no GEO');

    includeQuery.where = {
      [field]: Number.isInteger(parseInt(searchKeyword)) ? parseInt(searchKeyword) : { [Op.iLike]: `%${searchKeyword.toLowerCase()}%` }
    };

    db.models[reg_model]
      .findAndCountAll(includeQuery)
      .then((list) => {
        //console.log(list.rows);
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
        message: 'Import Successful',
        total: req.body.count,
        code: '0000'
      })
    })
    .catch(function (err) {
      // handle error;
      console.log('error0---------->', err)

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
  var reg_model = req.body.model
  let data = req.body.data

   let errors = []
 console.log(req.body)

  
  if (reg_model ==='project') {

    await Promise.all(data.map(async (item) => {
      item.createdBy=req.thisUser.id

      try {
        await db.models[reg_model]
        .create(item)
        .then(async function (prj) {
          // Special for projects where we store the project-activty relation 
          if (reg_model ==='project') {
            const list_activities =item.activities
             const arr = JSON.parse(list_activities);
              
  
           // coonsole.log(arr)
             const activties = await db.models.activity.findAll({
              where: {
                id: arr
              }
            });
            
            prj.addActivities(activties)
          }
    
  
        })
      } 
      catch (err) {
        errors.push(err.original);
        console.log('error-01', err)
      }
     
    }));
    
    
  } else {


    await Promise.all(data.map(async (item) => {
      item.createdBy=req.thisUser.id

      try {
        const data = await db.models[reg_model].upsert(item);
        //console.log(data);
      } catch (err) {
        console.log(err)
        errors.push(err.original);
      }
    }));
    

  }



  console.log("Upsert Errors ---->", errors)
  if (errors.length > 0) {
    let errorCodes = [...new Set(errors)];
    if (errorCodes.includes("42P10")) {
      var errorMsg = 'There are one or more duplicate records'
    }

    res.status(500).send({ message: 'Import/Update failed for:'+errors.length + " Records ("+errors[0]+')'})
  } else {
    res.status(200).send({
      message: 'Import/Update Successful......',
      code: '0000'
    })
  }


}



exports.modelCreateOneRecord = (req, res) => {


  console.log(req.thisUser.id)

  let token = req.headers["x-access-token"];
 

  console.log('creating......')
  var reg_model = req.body.model

  console.log('model... ----', req.body.model)
  console.log('geom... ----', req.body.geom)

  var obj = req.body
  obj.createdBy=req.thisUser.id
  delete obj.model // or delete person["age"];
  
  if (JSON.stringify(req.body.geom ) ===  "{}" ) {
    delete obj.geom // or delete person["age"];

  }

  console.log('One record... Edited----', obj)



  // insert
  db.models[reg_model]
    .create(obj)
    .then(async function (item) {
      // Special for projects where we store the project-activty relation 
      if (reg_model ==='project') {
        var activity_list =req.body.activities
         const list_activities = await db.models.activity.findAll({
          where: {
            id: activity_list
          }
        });
        
        item.addActivities(list_activities)
      }
      else if (reg_model === 'dashboard_section_chart') {
        var indicator_list =req.body.indicator_id
         const list_indicators = await db.models.indicator.findAll({
          where: {
            id: indicator_list
          }
        });
        
        item.addIndicators(list_indicators)
      }

      res.status(200).send({
        message: 'Import Successful',
        total: req.body.count,
        data: item,
        code: '0000'
      })
    })
    .catch(function (err) {
      // handle error;
      console.log('error0---------->', err)

      if (err.name == 'SequelizeUniqueConstraintError') {
        var message = 'One or more table constraints are violated. Check your id columns'
      } else {
        var message = 'The uploaded file does not match the required fields'
      }
      return res.status(500).send({ message: message })
    })
}

exports.modelAllGeo = async (req, res) => {
  var reg_model = req.body.model
  var xqry2 =
    " SELECT json_build_object( 'type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json) ) FROM " +
    reg_model +
    ' AS t where geom is not null'
  
  	
	var qry2 =
  " select row_to_json(fc)  as json_build_object from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features  from ( select 'Feature' as type, ST_AsGeoJSON(geom):: json as geometry,( select json_strip_nulls(row_to_json(" +reg_model+ " )) from ( select id) t ) as properties  from  " +
  reg_model + ' where geom is not null ) as f ) as fc'
  
  
  
  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  res.status(200).send({
    data: result_geo,
    code: '0000'
  })
}

exports.modelOneGeo = async (req, res) => {
  var reg_model = req.body.model
  var id = req.body.id
  var msg = ''
  var xqry2 =
    " SELECT json_build_object( 'type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json) ) FROM " +
    reg_model +
    ' AS t where geom is not null and id=' +
    id
  
  
  
  	var xxqry2 =
  " select row_to_json(fc)  as json_build_object from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features  from ( select 'Feature' as type, ST_AsGeoJSON(geom):: json as geometry  from  " +
  reg_model +    ' where geom is not null and id= '+ id +' ) as f ) as fc'
  
  var qry2 =
  " select row_to_json(fc)  as json_build_object from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features  from ( select 'Feature' as type, ST_AsGeoJSON(geom):: json as geometry,( select json_strip_nulls(row_to_json(" +reg_model+ " )) from ( select id) t ) as properties  from  " +
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

  console.log('Geoid arrays ----------------------------------->',  req.body)


  var reg_model = req.body.model
  var columnFilterField = req.body.columnFilterField

  if (req.body.selectedParents.length > 0) {
    var arr = req.body.selectedParents //req.body // [80,64] }

  } else if (req.body.filtredGeoIds.length >0) {
    var arr = [req.body.filtredGeoIds] //req.body // [80,64] }
  }
  else {
    var arr = [req.body.id] //req.body // [80,64] }
  }
 
 // console.log('Geoid arrays  length----------------------------------->', arr[0].length)
  //if (arr[0].length > 0) { // Fixed bug where the query fails when the array is null
    
    if (arr[0] === undefined || arr[0].length == 0) {

    var qry2 =
    " select row_to_json(fc)  as json_build_object from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features  from ( select 'Feature' as type, ST_AsGeoJSON(geom):: json as geometry,( select json_strip_nulls(row_to_json(" +reg_model+ " )) from ( select id) t ) as properties  from  " +
    reg_model  + ' where geom is not null  ' + ' ) as f ) as fc'
      

  } else {
   
    var qry2 =
    " select row_to_json(fc)  as json_build_object   from ( select 'FeatureCollection' as type, array_to_json(array_agg(f)) as features  from ( select 'Feature' as type, ST_AsGeoJSON(geom):: json as geometry,( select json_strip_nulls(row_to_json(" +reg_model+ " )) from ( select id) t ) as properties  from  " +
    reg_model  + ' where geom is not null and   '+ columnFilterField +  ' IN (' +  arr + ')' + ' ) as f ) as fc'
     
    
  }

  

   

  const result_geo = await sequelize.query(qry2, {
    model: db.models[reg_model],
    mapToModel: false // pass true here if you have any mapped fields
  })

  res.status(200).send({
    data: result_geo,
    code: '0000'
  })
}

exports.modelOneRecord = (req, res) => {
  var reg_model = req.body.model

  var ass_model = db.models[req.body.assocModel]

  if (ass_model) {
    var qry = {
      include: [{ model: ass_model }]
    }
  } else {
    var qry = {}
  }
  qry.where = { id: { [op.eq]: req.body.id } } // Exclude the logged in user returing in the list

  // console.log("ID:----->", req.body.id)
  // get records based on ID
  db.models[reg_model].findOne(qry).then((thisRecord) => {
    //    console.log(thisRecord.dataValues)
    //res.status(200).send(thisRecord.dataValues)

    res.status(200).send({
      data: thisRecord,
      code: '0000'
    })
  })
}

exports.modelEditOneRecord = (req, res) => {
  var reg_model = req.body.model;

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

      console.log("Edit", result);
      if (result) {
        result.set(req.body);
        await result.save(); // Wait for the record to be saved
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
    .catch(error => {
      console.error(error);
      res.status(500).send({
        message: "Internal server error",
        code: "0002"
      });
    });
};


exports.modelActivateUser = (req, res) => {
  var reg_model = req.query.model

  console.log('Request:----->', req.body)

  // get this one  record and update it by replacing the whole docuemnt
  db.models[reg_model].findAll({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // Result is array because we have used findAll. We can use findOne as well if you want one row and update that.
      result[0].set(req.body)
      result[0].save() // This is a promise
      // res.status(200).send(result);

      if (req.body.isactive) {
        var msg =
          'Your account has been activated. Please login using the credentials you signed up with.'
      } else {
        var msg =
          'Your account has been deactivated. Please reach out to the systems administrator should you require to use the system again.'
      }

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kisip.mis@gmail.com',
          pass: 'ycoxaqavmfiqljjg'
        }
      }) // initialize create Transport service

      const mailOptions = {
        from: 'kisip.mis@gmail.com',
        to: `${req.body.email}`,
        subject: 'Account Status',
        text: 'Dear ' + `${req.body.name}` + '. \n\n' + msg + '\n\n' + 'Systems Administrator.'
      }

      console.log('sending mail')

      transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
          console.error('there was an error: ', err)
        } else {
          console.log('here is the res: ', response)
          //  res.status(200).json('recovery email sent');
          res.status(200).send({
            message: 'Activation Email Sent',
            data: result,
            code: "0000"
          })
        }
      })
    }
  })
}



exports.xmodelDeleteOneRecord = (req, res) => {
  var reg_model = req.body.model
  // get this one  record and update it by replacing the whole docuemnt

  
  
  db.models[reg_model].destroy({ where: { id: req.body.id } }).then((result) => {
    if (result) {
      // res.status(200).send(result);
      res.status(200).send({
        message: 'Delete successful',
        code: '0000'
      })
    }
  })
}

exports.modelDeleteOneRecord = async (req, res) => {
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


    for (let i = 0; i < associations.length; i++) {
      const associationName = associations[i];

      const association = model.associations[associationName];

     // const association = model.associations;
      let dependentRowsCount =0
      const associationType = association.associationType;
      if (associationType === 'HasMany') {
        console.log('check assocatiation..', association.target, association.foreignKey,id )
        let mdl = association.target
     
         dependentRowsCount = await mdl.count({
          where: {
            [association.foreignKey]: id
          }
         });
        
      
      } else {
        
        dependentRowsCount = 0
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

    res.status(200).send({
      message: 'Delete successful',
      code: '0000'
    });
  } catch (err) {
    console.error(err);
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
 console.log('Req-body 002', req.body)
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
    
              let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('household.name'), 'bytea'),'maluini'),'name']
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
     
               let encrytpedField = [sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('household.name'), 'bytea'),'maluini'),'name']
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

exports.modelPaginatedDatafilterBykeyWord = (req, res) => {
  console.log('/api/v1/data/paginated/filter --- Keyword', req.body)

  var reg_model = req.body.model
  var field = req.body.searchField
  var searchKeyword = req.body.searchKeyword
  // Associated Models
  var associated_multiple_models = req.body.associated_multiple_models
  console.log('associated_multiple_models', associated_multiple_models.length)

  // nested Models
  // here me limit to two nesting levels only
  var nested_models = req.body.nested_models
  if (req.body.nested_models) {
    var child_model = db.models[req.body.nested_models[0]]
    var grand_child_model = db.models[req.body.nested_models[1]]
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

  if (associated_multiple_models) {
    if (nested_models) {
      var nestedModels = { model: child_model, include: grand_child_model, raw: true, nested: true }
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

 

  qry.limit = req.body.limit
  qry.offset = (req.body.page - 1) * req.body.limit

  /// use the multpiple filters
  var queryCondition = {}
  if (req.body.filters) {
    if (req.body.filters.length > 0 && req.body.filterValues.length > 0) {
      for (let i = 0; i < req.body.filters.length; i++) {
        queryCondition[req.body.filters[i]] = req.body.filterValues[i]
      }
      console.log('Final-Condition------------>', queryCondition)

    }
  }


  if (req.body.searchField) {

   // var searchCond = { [field]: { [op.iLike]: '%' + searchKeyword + '%' } }
    const searchCond = { [field]: { [Op.iLike]: `%${searchKeyword.toLowerCase()}%` } }; // use iLike with lowercase search term

    const mergedObject = {
      ...queryCondition,
      ...searchCond
    }
  
    console.log('--------------search Condition-----------', mergedObject)
  
    qry.where = mergedObject
  } else {

    qry.where = queryCondition
  }

 



  console.log('The xQuerry----->', qry)

  db.models[reg_model].findAndCountAll(qry).then((list) => {
    res.status(200).send({
      data: list.rows,
      total: list.count,
      code: '0000'
    })
  })
}

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

exports.modelUpload = (req, res) => {
  console.log(req.files)
  if (!req.files) {
    return res.status(500).send({ msg: 'file is not found' })
  }
  console.log('In upload express.....', req.body.DocTypes)
  // accessing the file
  var arr = req.body.DocTypes
  let ftypes = arr.split(',')

  const myFiles = req.files.file
  const settlement_name = req.body.settlement_name

  console.log('myFiles', myFiles.length)

  // Run for more than one document

  if (myFiles.length > 0) {
    var objs = []

    for (let i = 0; i < myFiles.length; i++) {
      //  mv() method places the file inside public directory
      console.log('Myfiles', i, myFiles[i].name)
      var fname = settlement_name + '_' + myFiles[i].name.replace(/\s/g, '_')
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
        file_path: `./public/${fname}`,
        settlement_id: req.body.settlement_id,
        group: group
      }
      objs.push(thisFile)
    }

    console.log('Multiple Files:', objs)

    db.models.settlement_uploads
      .bulkCreate(objs)
      .then(function () {
        for (let i = 0; i < myFiles.length; i++) {
          // var fname = settlement_name + '_' + myFiles[i].name
          var fname = settlement_name + '_' + myFiles[i].name.replace(/\s/g, '_')

          myFiles[i].mv(`./public/${fname}`)
          //  myFiles[i].mv(`./public/${settlement_name}_${myFiles[i].name}`);
          console.log(myFiles[i])
        }

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
    var fname = settlement_name + '_' + myFiles.name.replace(/\s/g, '_')
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
        myFiles.mv(`./public/${fname}`)

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
}

exports.batchDocumentsUpload = async (req, res) => {


  //const uploadsDir = path.join( './../../../../', 'uploads'); // path to the uploads folder outside the app directory
  //const uploadsDir = './../../../../'; // path to the uploads folder outside the app directory

  const uploadsDir = path.join(__dirname, '../../../..', 'uploads');

  if (!req.files) {
    return res.status(500).send({ msg: 'file is not found' })
  }

  var myFiles = []
  if (Array.isArray(req.files.file)) {

    myFiles = req.files.file
    console.log('In upload  multiple express.....', req.files.file)

  } else {
    // var myFiles = [req.files.file]
    myFiles.push(req.files.file)
    console.log('In upload single.....', req.files.file)
  
  }
 

    
  var errors = []

  for (let i = 0; i < myFiles.length; i++) {
    // Sin
    var obj = {}
    if (myFiles.length > 1) {
      var column = req.body.field_id[i]
      obj[column] = req.body[column][i]
      obj.category = req.body.category[i]
      obj.format = req.body.format[i]
      obj.size = req.body.size[i]


    } else {
      var column = req.body.field_id
      obj[column] = req.body[column]
      obj.category = req.body.category
      obj.format = req.body.format
      obj.size = req.body.size

      console.log("KEY>>>",column, obj[column])

    }
    if (obj[column] === '' ||  obj.category  === 'undefined' ) {
      errors.push('The field' + column + ' is required')

    } else {
      let fname = myFiles[i].name.replace(/\s/g, '_')
      //let location = `./public/${fname}`
      let location = uploadsDir + '/' + fname
      
      
      console.log(i, '----', column)
      obj.name = fname
      obj.location = location
   //   obj.location = `./public/${fname}`
   //   obj.location = `./../../../../${fname}`
      obj.code = crypto.randomUUID()
      var thisFile = {
        type: req.body.format,
        name: fname,
   //     file_path: `./public/${fname}`,
     //   file_path: `./../../../../${fname}`,   
         file_path:location,   
    }
      console.log('Thisfile', thisFile)
      var reg_model = 'document'
      console.log("insert Object", obj)
  
      try {
        await db.models[reg_model].create(obj)
          .then(function (item) {
            console.log("Moving to public...", location)
            myFiles[i].mv(location)
          })
      }
            
      catch (error) {
        // handle error;
        if (error.name === 'SequelizeUniqueConstraintError') {
           error.errors.map((err) => {
              errors.push(err.message)
          });
         // errors.push(validationErrors)
        } else {
           errors.push('Check your files again')
        }
      }

    }
  
  }

 // Send message

  if (errors.length === 0) {
    res.status(200).send({
      message: 'Upload Successful',
      code: '0000'
    })
  

  } else {

    res.status(500).send({
      message: 'Upload failed. '+errors  + ' errors',
      code: '0000'
    })
  }
}
  

exports.downloadFile = (req, res) => {
  console.log("Received files:", req.body )

   const uploadedFile = path.join(__dirname, '../../../..', 'uploads', req.body.filename);

  console.log(uploadedFile)
  //console.log(path.join(__dirname, filePath))

 // res.send('Message to send along with the file');

  //res.sendFile(uploadedFile);

  res.status(200).sendFile(uploadedFile, function(err){
    if (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });

 }
 

exports.xReportDocumentationUpload = (req, res) => {
  console.log(req.files)

  if (!req.files) {
    return res.status(500).send({ msg: 'file is not found' })
  }
  console.log('In upload express.....', req.body.DocTypes)
  // accessing the file
  var arr = req.body.DocTypes
  let ftypes = arr.split(',')

  const myFiles = req.files.file
  const report_code = req.body.report_code

  console.log('myFiles', myFiles.length)

  // Run for more than one document

  if (myFiles.length > 0) {
    var objs = []

    for (let i = 0; i < myFiles.length; i++) {
      //  mv() method places the file inside public directory
      console.log('Myfiles', i, myFiles[i].name)
      var fname = report_code + '_' + myFiles[i].name.replace(/\s/g, '_')
      var doctype = ftypes[i]
      console.log(ftypes[i])
 
      var thisFile = {
        type: doctype,
        name: fname,
        file_path: `./public/${fname}`,
        report_code: req.body.report_code,
        group: 'M&E Documentation'
      }
      objs.push(thisFile)
    }

    console.log('Multiple Files:', objs)

    res.status(500).send('Multiple uploads  coming soon')

  } else {
    // Sin
    var objs = []
    var fname = report_code + '_' + myFiles.name.replace(/\s/g, '_')
    var doctype = ftypes
    console.log('ftypes:', ftypes[0])

      var thisFile = {
      type: ftypes[0],
      name: fname,
      file_path: `./public/${fname}`,
      report_code: req.body.report_code,
      group:  req.body.grp
    }
    objs.push(thisFile)

    console.log('Thisfile', thisFile, req.body.model)

    var reg_model = req.body.model
 
    //db.models[reg_model].findAll
    db.models[reg_model].update(
      { documentation: thisFile.name},
      { where: { code: thisFile.report_code } }
    )
      .then(function () {
        // var fname = settlement_name+"_"+myFiles.name
        myFiles.mv(`./public/${fname}`)

        // return models.DiscoverySource.findAll();
        res.status(200).send({
          message: 'One File Saved succesfully',
          code: '0000'
        })
      })
      .catch(err =>
        res.status(500).send(err)
      )


    // db.models.settlement_uploads
    //   .bulkCreate(objs)
    //   .then(function () {
    //     // var fname = settlement_name+"_"+myFiles.name
    //     myFiles.mv(`./public/${fname}`)

    //     // return models.DiscoverySource.findAll();
    //     res.status(200).send({
    //       message: 'One File Saved succesfully',
    //       code: '0000'
    //     })
    //   })
    //   .catch(function (error) {
    //     res.send(error.errors[0])
    //     console.log('Error during Post: ' + error)
    //   })
  }
}
exports.ReportDocumentationUpload = async (req, res) => {
  console.log(req.files)
  var column = req.body.column

  if (!req.files) {
    return res.status(500).send({ msg: 'file is not found' })
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
      let location= `./public/${fname}`
         var thisFile = {
              type: req.body.DocType[i],
              name: fname,
              file_path: `./public/${fname}`,
              group:  req.body.grp
            }
        console.log('Thisfile', thisFile, req.body.model)
        var reg_model = 'document'   
        var obj = {}
        obj.name = fname
        obj.category= req.body.grp
        obj.format=req.body.DocType[i]
        obj.location= `./public/${fname}`
        obj[column]=req.body.parent_code
        obj.code=crypto.randomUUID()

        console.log("kinsert Object",obj )
      // insert
      await db.models[reg_model].create(obj)
        .then(function (item) {
          console.log("Movig to public...",location)
          myFiles[i].mv(location)
        
      })
      .catch(function (err) {
        // handle error;
        console.log('error0---------->', err)
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
      message: 'Upload failed. There are '+errors.length  + ' errors',
      code: '0000'
    })
  }


  
}




exports.RemoveDocument = (req, res) => {
  var reg_model = 'document'  
  let errors =[]
  console.log("Removing files:", req.body.filesToDelete )
 
  for (let i = 0; i < req.body.filesToDelete.length; i++) {

    if (typeof(req.body.filesToDelete[i]) == 'object') { 

    //  var filePath = './public/' + req.body.filesToDelete[i].name;

      const filePath = path.join(__dirname, '../../../..', 'uploads', req.body.filesToDelete[i].name);

      fs.unlinkSync(filePath);
    
      db.models[reg_model].destroy({ where: { name: req.body.filesToDelete[i].name } })
        .then((result) => {
       console.log('succeed')
      }) 
      .catch(function (err) {
        // handle error;
        console.log('error0---------->', err)
        errors.push(err)
  
      })
    } else {

     // var filePath = './public/' + req.body.filesToDelete[i];
      const filePath = path.join(__dirname, '../../../..', 'uploads', req.body.filesToDelete[i]);

      fs.unlinkSync(filePath);
    
      db.models[reg_model].destroy({ where: { name: req.body.filesToDelete[i] } })
        .then((result) => {
       console.log('succeed')
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

