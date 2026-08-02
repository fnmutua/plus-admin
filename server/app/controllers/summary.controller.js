const db = require('../models')
const config = require('../config/db.config.js')
///const config = require("../config/db.config.js");
const Sequelize = require('sequelize')
const { QueryTypes } = require('sequelize')
const op = Sequelize.Op
const Op = Sequelize.Op
const { authJwt } = require("../middleware");
const { expandProgrammeIds } = require('../utils/projectListScope')

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

/**
 * If the group field is a date/createdAt column, return [literal, alias] that strips time and
 * timezone (UTC date only) so counts group by calendar day. The alias preserves the key the
 * frontend expects (e.g. "createdAt"). Otherwise return the field as-is.
 * @param {string} field - e.g. "indicator_category_report.createdAt" or "model.date"
 * @returns {[object, string]|string} [sequelize.literal, alias] for date-only, or original field
 */
function formatGroupFieldAsDateOnly(field) {
  const lower = (field || '').toString().toLowerCase();
  const isCreatedAt = lower === 'createdat' || lower.endsWith('.createdat');
  const isDate = lower === 'date' || lower.endsWith('.date');
  if (!isCreatedAt && !isDate) return field;
  const parts = field.split('.');
  const col = parts.pop();
  const tableRef = parts.length ? parts.join('.') : null;
  const quotedCol = `"${col}"`;
  const quotedRef = tableRef ? `"${tableRef}".${quotedCol}` : quotedCol;
  const literal = sequelize.literal(`TO_CHAR(${quotedRef} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`);
  return [literal, col];
}

/** For group by: use the expression only (literal), not the alias. */
function groupByExpr(g) {
  return Array.isArray(g) ? g[0] : g;
}

function summaryFieldAlias(fieldPath) {
  const parts = String(fieldPath || '').split('.');
  return parts[parts.length - 1] || 'value';
}

function resolveSummaryFieldPaths(body) {
  if (Array.isArray(body.summaryFields) && body.summaryFields.length > 0) {
    return body.summaryFields;
  }
  if (body.summaryField) {
    return [body.summaryField];
  }
  return [];
}

function appendSummaryAttributes(qry, body) {
  const summaryFunction = body.summaryFunction;
  const unique_counts = body.uniqueCounts ? body.uniqueCounts : false;
  const fieldPaths = resolveSummaryFieldPaths(body);
  const multiMetric = fieldPaths.length > 1;

  for (const fieldPath of fieldPaths) {
    // Single-metric charts expect the aggregation name (e.g. sum); multi-metric uses field aliases.
    const alias = multiMetric ? summaryFieldAlias(fieldPath) : summaryFunction;
    if (summaryFunction === 'count' && unique_counts) {
      qry.attributes.push([
        Sequelize.fn(summaryFunction, Sequelize.fn('DISTINCT', Sequelize.col(fieldPath))),
        alias,
      ]);
    } else if (summaryFunction && fieldPath) {
      qry.attributes.push([Sequelize.fn(summaryFunction, Sequelize.col(fieldPath)), alias]);
    }
  }
}

function buildIgnoreEmptyConditions(body, operatorMappings) {
  const ignoreEmpty = body.ignoreEmpty !== undefined ? body.ignoreEmpty : false;
  if (!ignoreEmpty) return [];

  return resolveSummaryFieldPaths(body).map((fieldPath) => ({
    [summaryFieldAlias(fieldPath)]: { [operatorMappings.notEmpty]: null },
  }));
}

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
    const formattedGroup = groupField.map((f) => formatGroupFieldAsDateOnly(f));
    qry.attributes = [...formattedGroup, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]];
    qry.group = formattedGroup.map(groupByExpr);
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

/**
 * Return quick counts for a county: settlements, projects, grievances
 * Body: { county_id: number, cache_key?: string }
 */
exports.countsByCounty = async (req, res) => {
  try {
    const countyId = req.body.county_id;
    if (!countyId && countyId !== 0) {
      return res.status(400).send({ message: 'county_id is required', code: '4001' });
    }

    const cacheKey = req.body.cache_key || `county_counts_${countyId}`;

    // Try cache first
    let cached;
    try {
      cached = await redisClient.get(cacheKey);
    } catch (e) {
      // ignore cache errors
    }
    if (cached) {
      return res.status(200).send({ fromCache: true, counts: JSON.parse(cached), code: '0000' });
    }

    // Basic counts
    const settlementsPromise = db.models.settlement.count({ where: { county_id: countyId } });
    const grievancesPromise = db.models.grievance.count({ where: { county_id: countyId } });
    // Projects are tied to county via project_location
    const projectsPromise = db.models.project_location.count({
      where: { county_id: countyId },
      distinct: true,
      col: 'project_id'
    });

    // Settlement statistics
    const totalPopulationPromise = db.models.settlement.sum('population', {
      where: { 
        county_id: countyId,
        population: { [Op.ne]: null }
      }
    });

    const slumsCountPromise = db.models.settlement.count({
      where: {
        county_id: countyId,
        settlement_type: { [Op.iLike]: '%slum%' }
      }
    });

    const informalSettlementsCountPromise = db.models.settlement.count({
      where: {
        county_id: countyId,
        settlement_type: { [Op.iLike]: '%informal%' }
      }
    });

    // Roads - calculate length from geometry using PostGIS (km)
    const roadsLengthPromise = sequelize.query(
      `SELECT COALESCE(SUM(ST_Length(geom::geography) / 1000), 0) AS total_length_km
       FROM road
       WHERE county_id = :countyId AND geom IS NOT NULL`,
      {
        replacements: { countyId },
        type: QueryTypes.SELECT
      }
    );

    // Floodlights count
    const floodlightsCountPromise = db.models.floodlight.count({
      where: { county_id: countyId }
    });

    // Schools count (education_facility)
    const schoolsCountPromise = db.models.education_facility.count({
      where: { county_id: countyId }
    });

    // Health facilities count
    const healthFacilitiesCountPromise = db.models.health_facility.count({
      where: { county_id: countyId }
    });

    // Powerlines - calculate length from geometry using PostGIS
    const powerlinesLengthPromise = sequelize.query(
      `SELECT COALESCE(SUM(ST_Length(geom::geography) / 1000), 0) as total_length_km 
       FROM powerline 
       WHERE county_id = :countyId AND geom IS NOT NULL`,
      {
        replacements: { countyId },
        type: QueryTypes.SELECT
      }
    );

    const [
      settlements,
      grievances,
      projects,
      totalPopulation,
      slumsCount,
      informalSettlementsCount,
      roadsLengthResult,
      floodlightsCount,
      schoolsCount,
      healthFacilitiesCount,
      powerlinesLengthResult
    ] = await Promise.all([
      settlementsPromise,
      grievancesPromise,
      projectsPromise,
      totalPopulationPromise,
      slumsCountPromise,
      informalSettlementsCountPromise,
      roadsLengthPromise,
      floodlightsCountPromise,
      schoolsCountPromise,
      healthFacilitiesCountPromise,
      powerlinesLengthPromise
    ]);

    // Extract powerline length from query result
    const powerlinesLengthKm = powerlinesLengthResult && powerlinesLengthResult[0] 
      ? parseFloat(powerlinesLengthResult[0].total_length_km || 0) 
      : 0;

    const roadsLengthKm = roadsLengthResult && roadsLengthResult[0]
      ? parseFloat(roadsLengthResult[0].total_length_km || 0)
      : 0;

    const result = {
      settlements,
      projects,
      grievances,
      total_population: totalPopulation || 0,
      slums: slumsCount || 0,
      informal_settlements: informalSettlementsCount || 0,
      roads_length_km: isNaN(roadsLengthKm) ? 0 : roadsLengthKm,
      floodlights: floodlightsCount || 0,
      schools: schoolsCount || 0,
      health_facilities: healthFacilitiesCount || 0,
      powerlines_length_km: powerlinesLengthKm || 0
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300, NX: true });
    } catch (e) {
      // ignore cache set errors
    }

    return res.status(200).send({ fromCache: false, counts: result, code: '0000' });
  } catch (error) {
    console.error('countsByCounty error', error);
    return res.status(500).send({ message: 'Failed to get counts', code: '5000' });
  }
};

/**
 * Return counts for all key facilities per county.
 * Used by the mobile app ListPage to show totals on landing.
 *
 * Body: { county_id: number, cache_key?: string }
 */
exports.countsByCountyFacilities = async (req, res) => {
  try {
    const countyId = req.body.county_id;
    if (!countyId && countyId !== 0) {
      return res.status(400).send({ message: 'county_id is required', code: '4001' });
    }

    const cacheKey = req.body.cache_key || `county_facility_counts_${countyId}`;

    // Try cache first
    let cached;
    try {
      cached = await redisClient.get(cacheKey);
    } catch (e) {
      // ignore cache errors
    }
    if (cached) {
      return res.status(200).send({ fromCache: true, counts: JSON.parse(cached), code: '0000' });
    }

    // Core settlement & amenities
    const settlementsPromise = db.models.settlement.count({ where: { county_id: countyId } });
    const schoolsPromise = db.models.education_facility
      ? db.models.education_facility.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const healthFacilitiesPromise = db.models.health_facility
      ? db.models.health_facility.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    // Water & sewer
    const pipedWaterPromise = db.models.piped_water
      ? db.models.piped_water.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const waterPointPromise = db.models.water_point
      ? db.models.water_point.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const sewerPromise = db.models.sewer
      ? db.models.sewer.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    // Other amenities
    const otherFacilityPromise = db.models.other_facility
      ? db.models.other_facility.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const communityHallPromise = db.models.community_hall
      ? db.models.community_hall.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    // Electricity & lighting
    const powerlinePromise = db.models.powerline
      ? db.models.powerline.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const floodlightPromise = db.models.floodlight
      ? db.models.floodlight.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const mastPromise = db.models.mast
      ? db.models.mast.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const streetlightPromise = db.models.street_light
      ? db.models.street_light.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    // Security
    const policePromise = db.models.police_station
      ? db.models.police_station.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const crimeHotspotPromise = db.models.crime_hotspot
      ? db.models.crime_hotspot.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const grievancesPromise = db.models.grievance
      ? db.models.grievance.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    // Environment
    const hazardZonePromise = db.models.hazard_zone
      ? db.models.hazard_zone.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const dumpingSitePromise = db.models.dumping_site
      ? db.models.dumping_site.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    // Infrastructure
    const roadsPromise = db.models.road
      ? db.models.road.count({ where: { county_id: countyId } })
      : Promise.resolve(0);
    const railwayPromise = db.models.railway
      ? db.models.railway.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    // Monitoring reports (indicator_category_report)
    const reportsPromise = db.models.indicator_category_report
      ? db.models.indicator_category_report.count({ where: { county_id: countyId } })
      : Promise.resolve(0);

    const [
      settlements,
      schools,
      healthFacilities,
      pipedWater,
      waterPoints,
      sewer,
      otherFacilities,
      communityHalls,
      powerlines,
      floodlights,
      masts,
      streetlights,
      police,
      crimeHotspots,
      grievances,
      hazardZones,
      dumpingSites,
      roads,
      railways,
      reports,
    ] = await Promise.all([
      settlementsPromise,
      schoolsPromise,
      healthFacilitiesPromise,
      pipedWaterPromise,
      waterPointPromise,
      sewerPromise,
      otherFacilityPromise,
      communityHallPromise,
      powerlinePromise,
      floodlightPromise,
      mastPromise,
      streetlightPromise,
      policePromise,
      crimeHotspotPromise,
      grievancesPromise,
      hazardZonePromise,
      dumpingSitePromise,
      roadsPromise,
      railwayPromise,
      reportsPromise,
    ]);

    const result = {
      settlements,
      schools,
      health_facilities: healthFacilities,
      piped_water: pipedWater,
      water_points: waterPoints,
      sewer,
      other_facilities: otherFacilities,
      community_halls: communityHalls,
      powerlines,
      floodlights,
      masts,
      streetlights,
      police,
      crime_hotspots: crimeHotspots,
      grievances,
      hazard_zones: hazardZones,
      dumping_sites: dumpingSites,
      roads,
      railways,
      reports,
    };

    try {
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300, NX: true });
    } catch (e) {
      // ignore cache set errors
    }

    return res.status(200).send({ fromCache: false, counts: result, code: '0000' });
  } catch (error) {
    console.error('countsByCountyFacilities error', error);
    return res.status(500).send({ message: 'Failed to get facility counts', code: '5000' });
  }
};

exports._sumModelAssociatedMultipleModels = async (req, res) => {

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
  let ignoreEmpty = req.body.ignoreEmpty !== undefined ? req.body.ignoreEmpty : false;

  
  
 // -------------------------------------------------------------------------------
// if (req.body.model == 'settlement') {
  console.log('---------------------Sum unique_counts-----4---',req.body.model,  unique_counts ,'-------------------------------------')
  console.log('Ignore Null Records.....',ignoreEmpty )

//}

  
  // Build the query based on the parameters
  var qry = {
    attributes: [],
    include: [],
    where: {},
  };


  let groupfields = []

  if (req.body.groupFields && Array.isArray(req.body.groupFields)) {
    for (let i = 0; i < req.body.groupFields.length; i++) {
      const field = req.body.groupFields[i];
      groupfields.push(formatGroupFieldAsDateOnly(field));
    }
  }

  // Only set GROUP BY when there are real group fields — empty array groups by PK (~71k rows).
  if (groupfields.length > 0) {
    qry.attributes = [...groupfields];
    qry.group = groupfields.map(groupByExpr);
    qry.raw = true;
  } else {
    qry.raw = true;
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

 

  const operatorMappings = {
    eq: op.eq,
    gt: op.gt,
    gte: op.gte,
    lt: op.lt,
    in: op.in,
    lte: op.lte, // Added lte mapping
    or: op.or, // Added lte mapping
     notEmpty: op.not, // Added lte mapping

    // Add more operator mappings as needed
  };

  const filterConditions = [];

// if ignoring empty is enabled

const inputString = summaryField;
const parts = inputString.split('.');
//console.log(parts);  


if (ignoreEmpty) {
  filterConditions.push({ [parts[1]]: { [operatorMappings['notEmpty']]: null } });

  }
  console.log('filterConditions',filterConditions )
 
if (req.body.filterField && req.body.filterValue && req.body.filterOperator && req.body.filterField.length > 0 && req.body.filterValue.length > 0) {
  let filterCols = req.body.filterField;
  let filterValues = req.body.filterValue;
  let filterOperators = req.body.filterOperator;

  if (!Array.isArray(filterCols)) {
    filterCols = [filterCols];
    filterValues = [filterValues];
    filterOperators = [filterOperators];
  }

  const eqGroups    = new Map();
  const neqNullSeen = new Set();

  for (let i = 0; i < filterCols.length; i++) {
    const filterCol = filterCols[i];
    const filterVal = filterValues[i];
    const operator  = filterOperators[i];
    operators.push(operator);

    if (operator === 'all') {
      continue;
    } else if (operator === 'or') {
      const orConditions = filterVal.map((v) => ({ [filterCol]: { [operatorMappings['eq']]: v } }));
      filterConditions.push({ [op.or]: orConditions });
    } else if (operator === 'between' && Array.isArray(filterVal) && filterVal.length === 2) {
      const a = filterVal[0] instanceof Date ? filterVal[0] : new Date(filterVal[0]);
      const b = filterVal[1] instanceof Date ? filterVal[1] : new Date(filterVal[1]);
      if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
        filterConditions.push({ [filterCol]: { [op.between]: [a, b] } });
      }
    } else if (operator === 'is_null') {
      filterConditions.push({ [filterCol]: null });
    } else if (operator === 'is_not_null') {
      filterConditions.push({ [filterCol]: { [op.not]: null } });
    } else if (operator === 'eq') {
      const nullVal = filterVal === null || filterVal === undefined ||
        (Array.isArray(filterVal) && filterVal.length === 1 && (filterVal[0] === null || filterVal[0] === undefined));
      if (nullVal) {
        filterConditions.push({ [filterCol]: null });
      } else {
        if (!eqGroups.has(filterCol)) eqGroups.set(filterCol, []);
        const vals = Array.isArray(filterVal) ? filterVal : [filterVal];
        eqGroups.get(filterCol).push(...vals);
      }
    } else if (operator === 'neq' || operator === 'ne') {
      const nullVal = filterVal === null || filterVal === undefined ||
        (Array.isArray(filterVal) && filterVal.length === 1 && (filterVal[0] === null || filterVal[0] === undefined));
      if (nullVal) {
        if (!neqNullSeen.has(filterCol)) { neqNullSeen.add(filterCol); filterConditions.push({ [filterCol]: { [op.not]: null } }); }
      } else {
        const val = Array.isArray(filterVal) && filterVal.length === 1 ? filterVal[0] : filterVal;
        filterConditions.push({ [filterCol]: { [op.ne]: val } });
      }
    } else if (operatorMappings[operator] && filterVal) {
      if (Array.isArray(filterVal)) {
        if (operator === 'in' || operator === 'not_in' || operator === 'notIn') {
          if (filterVal.length) filterConditions.push({ [filterCol]: { [operatorMappings[operator]]: filterVal } });
        } else {
          const nestedConditions = filterVal.map((v) => ({ [filterCol]: { [operatorMappings[operator]]: v } }));
          filterConditions.push({ [op.or]: nestedConditions });
        }
      } else {
        filterConditions.push({ [filterCol]: { [operatorMappings[operator]]: filterVal } });
      }
    }
  }
  for (const [field, values] of eqGroups) {
    if (values.length === 1) {
      filterConditions.push({ [field]: { [op.eq]: values[0] } });
    } else {
      filterConditions.push({ [field]: { [op.in]: values } });
    }
  }
  }
  
 
  // console.log('operators',summaryFunction,unique_counts)
  // if (summaryFunction =='count' && unique_counts ) {
  //   console.log("The array contains the string.");
  //   qry.distinct = true; // Add the distinct option to the query

  // } else {
  //   console.log("The array does not contain the string.");
  // }

  if (filterConditions.length > 0) {
    qry.where = { [op.and]: filterConditions };
  }

  // if (operator === "all") {
  //   // No filters, retrieve all records
  //   qry.where = {}; // or qry.where = true;
  // }
  console.log("The array contains the string.",qry);

  try {
    // Check if the model exists
    if (!reg_model || !db.models[reg_model]) {
      console.error('Model not found:', reg_model);
      return res.status(400).send({
        error: 'Model not found',
        message: `Model '${reg_model}' does not exist`,
        code: '4001'
      });
    }

    db.models[reg_model].findAll(qry).then(async (list) => {
      try {
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
      } catch (innerError) {
        console.error('Error processing data:', innerError);
        res.status(500).send({
          error: 'Data processing error',
          message: innerError.message,
          code: '5001'
        });
      }
    }).catch((dbError) => {
      console.error('Database query error:', dbError);
      res.status(500).send({
        error: 'Database query error',
        message: dbError.message,
        code: '5002'
      });
    });
  } catch (error) {
    console.error('Unexpected error in _sumModelAssociatedMultipleModels:', error);
    res.status(500).send({
      error: 'Unexpected error',
      message: error.message,
      code: '5000'
    });
  }

};


exports.sumModelAssociatedMultipleModels = async (req, res) => {
  var reg_model = req.body.model;
  var summaryField = req.body.summaryField;
  var summaryFunction = req.body.summaryFunction;
  var calculationType = req.body.calculationType; // 'absolute' or 'proportion'
  var assoc_models = req.body.assoc_models;
 // var groupFields = req.body.groupFields;
  var nested_models = req.body.nested_models;
   let unique_counts = req.body.uniqueCounts?req.body.uniqueCounts:false;
  let operators = [] // to be used to check for unik results
  let ignoreEmpty = req.body.ignoreEmpty !== undefined ? req.body.ignoreEmpty : false;

  

let groupfields = []




  // Build the query based on the parameters
  var qry = {
    attributes: [],
    include: [],
    where: {},
  };

  if (req.body.groupFields && Array.isArray(req.body.groupFields)) {
    for (let i = 0; i < req.body.groupFields.length; i++) {
      const field = req.body.groupFields[i];
      groupfields.push(formatGroupFieldAsDateOnly(field));
    }
  }

  /// overwrite groupinng for production
 if(reg_model == 'production' &&  req.body.summaryField =='production.product_type_id'){
  //  groupfields = ['product_type.title']

    // Find the index of the item to be replaced
      const indexToReplace = groupfields.indexOf('production.product_type_id');

      if (indexToReplace !== -1) {
          // Replace the item at the specified index
          groupfields[indexToReplace] = 'product_type.title';
      }


    
  }
  

  // Only set GROUP BY when there are real group fields — empty array groups by PK (~71k rows).
  if (groupfields.length > 0) {
    qry.attributes = [...groupfields];
    qry.group = groupfields.map(groupByExpr);
    qry.raw = true;
  } else {
    qry.raw = true;
  }

  console.log('-----------*************---------------');
  console.log(groupfields);

  // Add summary calculation to the query attributes (single or multiple metrics)
  appendSummaryAttributes(qry, req.body);

  // Add associated models to the query
  if (assoc_models &&  req.body.assoc_models.length > 0 && Array.isArray(assoc_models) ) {
    assoc_models.forEach(assocModel => {
      // Check if the associated model exists
      if (!db.models[assocModel]) {
        console.error('Associated model not found:', assocModel);
        return res.status(400).send({
          error: 'Associated model not found',
          message: `Associated model '${assocModel}' does not exist`,
          code: '4002'
        });
      }
      qry.include.push({
        model: db.models[assocModel],
        attributes: [],
      });
    });
  }


  
  if(reg_model == 'production' &&  req.body.summaryField =='production.product_type_id'){
    qry.include.push({
    model: db.models.product_type,
    attributes: [],
  });

  
}


  // Add nested include models to the query
  if (nested_models &&  req.body.nested_models.length > 0  && Array.isArray(nested_models)) {
    nested_models.forEach(nestedModel => {
      // Check if the nested model exists
      if (!db.models[nestedModel.model]) {
        console.error('Nested model not found:', nestedModel.model);
        return res.status(400).send({
          error: 'Nested model not found',
          message: `Nested model '${nestedModel.model}' does not exist`,
          code: '4003'
        });
      }
      qry.include.push({
        model: db.models[nestedModel.model],
        as: nestedModel.alias,
        attributes: [],
      });
    });
  }

 

  const operatorMappings = {
    eq: op.eq,
    ne: op.ne,
    neq: op.ne,
    gt: op.gt,
    gte: op.gte,
    lt: op.lt,
    lte: op.lte,
    in: op.in,
    not_in: op.notIn,
    notIn: op.notIn,
    contains: op.iLike,
    not_contains: op.notILike,
    starts_with: op.iLike,
    ends_with: op.iLike,
    or: op.or,
    notEmpty: op.not,
    like: op.like,
    iLike: op.iLike,
    is_null: null,
    is_not_null: null,
  };

  const filterConditions = buildIgnoreEmptyConditions(req.body, operatorMappings);

if (req.body.filterField && req.body.filterValue && req.body.filterOperator && req.body.filterField.length > 0 && req.body.filterValue.length > 0) {
  let filterCols = req.body.filterField;
  let filterValues = req.body.filterValue;
  let filterOperators = req.body.filterOperator;

  if (!Array.isArray(filterCols)) {
    filterCols = [filterCols];
    filterValues = [filterValues];
    filterOperators = [filterOperators];
  }

  const eqGroups    = new Map();
  const neqNullSeen = new Set();

  for (let i = 0; i < filterCols.length; i++) {
    const filterCol = filterCols[i];
    const filterVal = filterValues[i];
    const operator  = filterOperators[i];
    operators.push(operator);

    // component_id / programme_id aren't columns on project_location or
    // indicator_category_report — they live on project (component_id) and
    // component (programme_id). Resolve via project_id subquery.
    if (
      (reg_model === 'project_location' || reg_model === 'indicator_category_report') &&
      (filterCol === 'component_id' || filterCol === 'programme_id') &&
      operator !== 'all'
    ) {
      const rawVals = Array.isArray(filterVal) ? filterVal : [filterVal];
      if (filterCol === 'component_id') {
        const ids = rawVals.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
        if (ids.length) {
          filterConditions.push(
            Sequelize.literal(`project_id IN (SELECT id FROM project WHERE component_id IN (${ids.join(', ')}))`)
          );
        }
      } else {
        const rootIds = rawVals.map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
        const ids = rootIds.length ? await expandProgrammeIds(rootIds) : [];
        if (ids.length) {
          filterConditions.push(
            Sequelize.literal(`project_id IN (SELECT p.id FROM project p INNER JOIN component c ON p.component_id = c.id WHERE c.programme_id IN (${ids.join(', ')}))`)
          );
        }
      }
      continue;
    }

    if (operator === 'all') {
      continue;
    } else if (operator === 'or') {
      const orConditions = filterVal.map((v) => ({ [filterCol]: { [operatorMappings['eq']]: v } }));
      filterConditions.push({ [op.or]: orConditions });
    } else if (operator === 'between' && Array.isArray(filterVal) && filterVal.length === 2) {
      const a = filterVal[0] instanceof Date ? filterVal[0] : new Date(filterVal[0]);
      const b = filterVal[1] instanceof Date ? filterVal[1] : new Date(filterVal[1]);
      if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
        filterConditions.push({ [filterCol]: { [op.between]: [a, b] } });
      }
    } else if (operator === 'is_null') {
      filterConditions.push({ [filterCol]: null });
    } else if (operator === 'is_not_null') {
      filterConditions.push({ [filterCol]: { [op.not]: null } });
    } else if (operator === 'eq') {
      const nullVal = filterVal === null || filterVal === undefined ||
        (Array.isArray(filterVal) && filterVal.length === 1 && (filterVal[0] === null || filterVal[0] === undefined));
      if (nullVal) {
        filterConditions.push({ [filterCol]: null });
      } else {
        if (!eqGroups.has(filterCol)) eqGroups.set(filterCol, []);
        const vals = Array.isArray(filterVal) ? filterVal : [filterVal];
        eqGroups.get(filterCol).push(...vals);
      }
    } else if (operator === 'neq' || operator === 'ne') {
      const nullVal = filterVal === null || filterVal === undefined ||
        (Array.isArray(filterVal) && filterVal.length === 1 && (filterVal[0] === null || filterVal[0] === undefined));
      if (nullVal) {
        if (!neqNullSeen.has(filterCol)) { neqNullSeen.add(filterCol); filterConditions.push({ [filterCol]: { [op.not]: null } }); }
      } else {
        const val = Array.isArray(filterVal) && filterVal.length === 1 ? filterVal[0] : filterVal;
        filterConditions.push({ [filterCol]: { [op.ne]: val } });
      }
    } else if (operatorMappings[operator] && filterVal) {
      if (Array.isArray(filterVal)) {
        if (operator === 'in' || operator === 'not_in' || operator === 'notIn') {
          if (filterVal.length) filterConditions.push({ [filterCol]: { [operatorMappings[operator]]: filterVal } });
        } else {
          const nestedConditions = filterVal.map((v) => ({ [filterCol]: { [operatorMappings[operator]]: v } }));
          filterConditions.push({ [op.or]: nestedConditions });
        }
      } else {
        filterConditions.push({ [filterCol]: { [operatorMappings[operator]]: filterVal } });
      }
    }
  }
  for (const [field, values] of eqGroups) {
    if (values.length === 1) {
      filterConditions.push({ [field]: { [op.eq]: values[0] } });
    } else {
      filterConditions.push({ [field]: { [op.in]: values } });
    }
  }
  }
  
  // Store search info for later application
  let searchInfo = null;
  if (req.body.searchField && req.body.searchString) {
    searchInfo = {
      field: req.body.searchField,
      string: req.body.searchString
    };
    
    // Search functionality enabled
  }
  
  if (filterConditions.length > 0) {
    qry.where = { [op.and]: filterConditions };
  }

  // Apply search functionality after other conditions are set
  if (searchInfo && reg_model === 'grievance') {
    const searchField = searchInfo.field;
    const searchString = searchInfo.string;
    
    console.log('Applying search to query...');
    console.log('Current qry.where before search:', JSON.stringify(qry.where, null, 2));
    
    if (searchField === 'name') {
      // For encrypted name field, try the same approach as getGrievancesByKeyword
      const nameSearchCondition = sequelize.where(
        sequelize.fn('PGP_SYM_DECRYPT', sequelize.cast(sequelize.col('grievance.name'), 'bytea'), process.env.AES_KEY),
        { [op.iLike]: `%${searchString}%` }
      );
      
      console.log('Using encrypted search with sequelize.where for name field');
      
      // Instead of combining complex conditions, add it as an OR with multiple searchable fields
      // This mimics how getGrievancesByKeyword works
      const multiFieldSearch = {
        [op.or]: [
          nameSearchCondition,
          { code: { [op.iLike]: `%${searchString}%` } },
          { description: { [op.iLike]: `%${searchString}%` } },
          { phone: { [op.iLike]: `%${searchString}%` } }
        ]
      };
      
      // Combine with existing where conditions
      if (qry.where) {
        qry.where = { [op.and]: [qry.where, multiFieldSearch] };
      } else {
        qry.where = multiFieldSearch;
      }
      console.log('Applied multi-field search including encrypted name');
    } else if (['code', 'description', 'phone', 'plea', 'nature'].includes(searchField)) {
      // For non-encrypted fields
      const searchCondition = { [searchField]: { [op.iLike]: `%${searchString}%` } };
      
      console.log('Search condition:', JSON.stringify(searchCondition, null, 2));
      
      // Combine with existing where conditions
      if (qry.where) {
        qry.where = { [op.and]: [qry.where, searchCondition] };
      } else {
        qry.where = searchCondition;
      }
      console.log('Applied regular search for', searchField);
    }
    
    console.log('Final qry.where after search:', JSON.stringify(qry.where, null, 2));
  }

  // Special handling for indicator_category_report - filter + exclude rejected rows
  if (reg_model === 'indicator_category_report') {
    filterConditions.push(Sequelize.literal(`COALESCE(LOWER(status), '') <> 'rejected'`));

    let indicatorCategoryId = null;
    
    // Check if indicator_category_id is provided in the request body
    if (req.body.indicator_category_id) {
      indicatorCategoryId = req.body.indicator_category_id;
    }
    // Also check if it's provided in the card configuration
    else if (req.body.card_config && req.body.card_config.indicator_category_id) {
      indicatorCategoryId = req.body.card_config.indicator_category_id;
    }
    
    if (indicatorCategoryId) {
      console.log('Adding automatic filter for indicator_category_id:', indicatorCategoryId);
      
      // Add the indicator_category_id filter to existing conditions
      if (filterConditions.length > 0) {
        filterConditions.push({ indicator_category_id: indicatorCategoryId });
      } else {
        filterConditions.push({ indicator_category_id: indicatorCategoryId });
      }
    }
    
    // Update the where clause if we have conditions
    if (filterConditions.length > 0) {
      qry.where = { [op.and]: filterConditions };
    }
  }

  console.log('=== FINAL QUERY DEBUG ===');
  console.log('qry',JSON.stringify(qry, null, 2) );
  console.log('calculationType',calculationType );
  console.log('Model:', reg_model);
  console.log('Summary Field:', summaryField);
  console.log('Search Info:', req.body.searchField, req.body.searchString);



try {
  // Check if the model exists
  if (!reg_model || !db.models[reg_model]) {
    console.error('Model not found:', reg_model);
    return res.status(400).send({
      error: 'Model not found',
      message: `Model '${reg_model}' does not exist`,
      code: '4001'
    });
  }

  db.models[reg_model].findAll(qry).then(async (list) => {
    try {
      let totalValue;
      if (Array.isArray(list) && list.length > 50) {
        console.log('list length', list.length, 'sample', list[0]);
      } else {
        console.log('list', list);
      }

      if (calculationType === 'proportion') {
        console.log("The array contains the string.", qry);
        console.log("proportion ----------------.", qry);

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
    } catch (innerError) {
      console.error('Error processing data:', innerError);
      res.status(500).send({
        error: 'Data processing error',
        message: innerError.message,
        code: '5001'
      });
    }
  }).catch((dbError) => {
    console.error('Database query error:', dbError);
    res.status(500).send({
      error: 'Database query error',
      message: dbError.message,
      code: '5002'
    });
  });
} catch (error) {
  console.error('Unexpected error in sumModelAssociatedMultipleModels:', error);
  res.status(500).send({
    error: 'Unexpected error',
    message: error.message,
    code: '5000'
  });
}

};


exports.dsumModelAssociatedMultipleModels = async (req, res) => {
   
  var reg_model = req.body.model
  var summaryField = req.body.summaryField
  var summaryFunction = req.body.summaryFunction
  var calculationType = req.body.calculationType; // 'absolute' or 'proportion'

  let groupfields = []
  
  if (req.body.groupFields) {
    for (let i = 0; i < req.body.groupFields.length; i++) {
      const field = req.body.groupFields[i];
      groupfields.push(formatGroupFieldAsDateOnly(field));
    }

    console.log("groupfields, ", groupfields);
    console.log("summaryFunction, ", summaryFunction);
    console.log("FilterValues, ", req.body.filterValue);

    var qry = {
      attributes: [...groupfields, [sequelize.fn(summaryFunction, sequelize.col(summaryField)), summaryFunction]],
      group: groupfields.map(groupByExpr),
      raw: true
    };
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

/**
 * Run many /summary/byfield/multiple payloads in one request (parallel on server).
 * Body: { items: [ { id: string, payload: object }, ... ] }
 * Each payload is identical to POST /api/v1/summary/byfield/multiple body.
 */
exports.batchSumModelAssociatedMultipleModels = async (req, res) => {
  try {
    const items = req.body.items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send({
        error: 'items must be a non-empty array',
        message: 'Provide items: [{ id, payload }, ...]',
        code: '4000',
      })
    }
    const MAX_ITEMS = 50
    if (items.length > MAX_ITEMS) {
      return res.status(400).send({
        error: 'too many items',
        message: `At most ${MAX_ITEMS} summaries per batch`,
        code: '4000',
      })
    }

    const runOne = (payload) =>
      new Promise((resolve) => {
        const mockReq = { body: payload }
        let settled = false
        const mockRes = {
          statusCode: 200,
          status(code) {
            this.statusCode = code
            return this
          },
          send(body) {
            if (settled) return
            settled = true
            const code = mockRes.statusCode || 200
            if (code >= 400) {
              resolve({ ok: false, statusCode: code, body })
            } else {
              resolve({ ok: true, data: body })
            }
          },
        }
        try {
          exports.sumModelAssociatedMultipleModels(mockReq, mockRes)
        } catch (err) {
          if (!settled) {
            settled = true
            resolve({ ok: false, statusCode: 500, body: { message: err.message } })
          }
        }
        setTimeout(() => {
          if (!settled) {
            settled = true
            resolve({ ok: false, statusCode: 504, body: { message: 'Summary sub-request timed out' } })
          }
        }, 120000)
      })

    const results = await Promise.all(
      items.map(async (item) => {
        const id = item.id != null ? String(item.id) : ''
        if (!id) {
          return { id: 'unknown', ok: false, code: '4004', error: 'each item must have id' }
        }
        if (!item.payload || typeof item.payload !== 'object') {
          return { id, ok: false, code: '4005', error: 'each item must have payload object' }
        }
        const out = await runOne(item.payload)
        if (!out.ok) {
          return {
            id,
            ok: false,
            code: (out.body && out.body.code) || String(out.statusCode),
            error: (out.body && (out.body.message || out.body.error)) || 'request failed',
          }
        }
        return { id, ok: true, data: out.data }
      }),
    )

    return res.status(200).send({ code: '0000', results })
  } catch (err) {
    console.error('batchSumModelAssociatedMultipleModels', err)
    return res.status(500).send({ error: err.message, code: '5000' })
  }
}

/**
 * Axis-based chart data endpoint.
 * POST /api/v1/chart/data
 *
 * Body:
 *   model        {string}  Sequelize model name (e.g. "settlement")
 *   x_axis       {object}  { field: string, label?: string }
 *   y_axis       {object}  { field: string, aggregation: "count"|"sum"|"avg"|"min"|"max", label?: string }
 *   series_field {object?} { field: string, label?: string } — optional breakdown
 *   filters      {array?}  [{ field, operation, value }]
 *   ignore_empty {boolean?}
 *
 * Returns:
 *   { categories: string[], series: [{ name: string, data: number[] }], code: "0000" }
 */
exports.getChartData = async (req, res) => {
  try {
    const { model: modelName, x_axis, y_axis, series_field, filters, ignore_empty } = req.body;

    if (!modelName || !x_axis?.field || !y_axis?.field || !y_axis?.aggregation) {
      return res.status(400).send({ message: 'model, x_axis.field, y_axis.field and y_axis.aggregation are required', code: '4001' });
    }
    if (!db.models[modelName]) {
      return res.status(400).send({ message: `Model '${modelName}' not found`, code: '4002' });
    }

    const xField = x_axis.field;
    const yField = y_axis.field;
    const yAgg   = (y_axis.aggregation || 'count').toLowerCase();
    const yLabel = y_axis.label || yAgg;
    const sField = series_field?.field || null;

    // Build GROUP BY fields
    const groupFieldPaths = [xField];
    if (sField) groupFieldPaths.push(sField);

    const groupAttrs = groupFieldPaths.map(f => formatGroupFieldAsDateOnly(f));

    // Build query
    const qry = {
      attributes: [...groupAttrs],
      group: groupAttrs.map(groupByExpr),
      raw: true,
      where: {},
    };

    // Y aggregation
    const aggAlias = 'agg_value';
    if (yAgg === 'count' && yField === 'id') {
      qry.attributes.push([Sequelize.fn('COUNT', Sequelize.col(`${modelName}.id`)), aggAlias]);
    } else {
      qry.attributes.push([Sequelize.fn(yAgg.toUpperCase(), Sequelize.col(yField)), aggAlias]);
    }

    // Filters
    const filterConditions = [];
    if (ignore_empty) {
      filterConditions.push({ [yField]: { [op.not]: null } });
    }
    if (Array.isArray(filters)) {
      const opMap = {
        eq: op.eq, ne: op.ne, neq: op.ne,
        gt: op.gt, gte: op.gte, lt: op.lt, lte: op.lte,
        in: op.in, not_in: op.notIn, notIn: op.notIn,
        like: op.like, iLike: op.iLike,
        contains: op.iLike, not_contains: op.notILike,
        starts_with: op.iLike, ends_with: op.iLike,
      };
      // Group eq rows by field so multiple eq on same field → IN (OR semantics)
      const eqGroups = new Map();
      const neqNullSeen = new Set();

      for (const f of filters) {
        if (!f.field || !f.operation || f.operation === 'all') continue;
        if (f.operation === 'is_null') {
          filterConditions.push({ [f.field]: null }); continue;
        }
        if (f.operation === 'is_not_null') {
          filterConditions.push({ [f.field]: { [op.not]: null } }); continue;
        }
        if (f.operation === 'eq') {
          const val = Array.isArray(f.value) && f.value.length === 1 ? f.value[0] : f.value;
          if (val === null || val === undefined || val === '') {
            filterConditions.push({ [f.field]: null });
          } else {
            if (!eqGroups.has(f.field)) eqGroups.set(f.field, []);
            eqGroups.get(f.field).push(val);
          }
          continue;
        }
        if (f.operation === 'neq' || f.operation === 'ne') {
          const val = Array.isArray(f.value) && f.value.length === 1 ? f.value[0] : f.value;
          if (val === null || val === undefined || val === '') {
            if (!neqNullSeen.has(f.field)) {
              neqNullSeen.add(f.field);
              filterConditions.push({ [f.field]: { [op.not]: null } });
            }
          } else {
            filterConditions.push({ [f.field]: { [op.ne]: val } });
          }
          continue;
        }
        const sqOp = opMap[f.operation];
        if (!sqOp) continue;
        if (f.operation === 'in' || f.operation === 'not_in' || f.operation === 'notIn') {
          const arr = Array.isArray(f.value) ? f.value : [f.value];
          if (!arr.length) continue;
          filterConditions.push({ [f.field]: { [sqOp]: arr } });
        } else if (f.operation === 'contains' || f.operation === 'not_contains' ||
                   f.operation === 'starts_with' || f.operation === 'ends_with') {
          const raw = Array.isArray(f.value) ? f.value[0] : f.value;
          if (raw === null || raw === undefined || raw === '') continue;
          if (f.operation === 'contains')          filterConditions.push({ [f.field]: { [sqOp]: `%${raw}%` } });
          else if (f.operation === 'not_contains') filterConditions.push({ [f.field]: { [sqOp]: `%${raw}%` } });
          else if (f.operation === 'starts_with')  filterConditions.push({ [f.field]: { [sqOp]: `${raw}%` } });
          else if (f.operation === 'ends_with')    filterConditions.push({ [f.field]: { [sqOp]: `%${raw}` } });
        } else {
          const val = Array.isArray(f.value) && f.value.length === 1 ? f.value[0] : f.value;
          if (val !== null && val !== undefined && val !== '') {
            filterConditions.push({ [f.field]: { [sqOp]: val } });
          }
        }
      }
      // Emit grouped eq: 1 value → eq, multiple → IN
      for (const [field, values] of eqGroups) {
        if (values.length === 1) {
          filterConditions.push({ [field]: { [op.eq]: values[0] } });
        } else {
          filterConditions.push({ [field]: { [op.in]: values } });
        }
      }
    }
    if (filterConditions.length > 0) {
      qry.where = { [op.and]: filterConditions };
    }

    const rows = await db.models[modelName].findAll(qry);

    // Transform rows → { categories, series }
    let categories = [];
    let series = [];

    if (!sField) {
      // Simple: one series
      for (const row of rows) {
        const xVal = row[xField] != null ? String(row[xField]) : '(empty)';
        const yVal = parseFloat(row[aggAlias]) || 0;
        categories.push(xVal);
        series.push(yVal);
      }
      series = [{ name: yLabel, data: series }];
    } else {
      // Pivot by series field
      const catSet = new Map();   // xVal → index
      const seriesMap = new Map(); // sVal → { name, dataByX: Map<xVal, number> }

      for (const row of rows) {
        const xVal = row[xField] != null ? String(row[xField]) : '(empty)';
        const sVal = row[sField] != null ? String(row[sField]) : '(other)';
        const yVal = parseFloat(row[aggAlias]) || 0;

        if (!catSet.has(xVal)) catSet.set(xVal, catSet.size);
        if (!seriesMap.has(sVal)) seriesMap.set(sVal, { name: sVal, dataByX: new Map() });
        const existing = seriesMap.get(sVal).dataByX.get(xVal) || 0;
        seriesMap.get(sVal).dataByX.set(xVal, existing + yVal);
      }

      categories = [...catSet.keys()];
      series = [...seriesMap.values()].map(s => ({
        name: s.name,
        data: categories.map(c => s.dataByX.get(c) || 0),
      }));
    }

    return res.status(200).send({ categories, series, code: '0000' });
  } catch (err) {
    console.error('getChartData error:', err);
    return res.status(500).send({ message: 'Failed to fetch chart data', error: err.message, code: '5000' });
  }
};