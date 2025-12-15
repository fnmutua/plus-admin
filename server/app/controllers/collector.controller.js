const db = require('../models')
 

const Sequelize = require('sequelize')
  var request = require('request');
const FormData = require('form-data');

 const { XMLParser } = require('fast-xml-parser');
 
 
 
exports.modelGetProjects = (req, res) => {
 // console.log('get projects')
  
  res.status(200).send({
    data: "Projects",
      code: '0000'
  })

}


exports.modelLoginCollector =  (req, res) => {
 // console.log('Body', req.body);

  // Extract email and password from req.body
  const { email, password } = req.body;

  // Construct the request body as a JSON object
  const requestBody = {
    email: email,
    password: password
  };

  let projects
  
  // Login and get a token 
  request({
    method: 'POST',
    url: 'https://collector.kesmis.go.ke/v1/sessions',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody) // Convert the object to a JSON string
  }, function (error, response, body) {
   

    if (!error && response.statusCode === 200) {
      // Parse the JSON response
      const responseBody = JSON.parse(body);

      // Extract the token from the response
      const token = responseBody.token;

      // Do something with the token (e.g., store it, send it in the response, etc.)
     // console.log('Token:', token);


        // Define your bearer token
 
      // Set up the options for the HTTP request, including the 'Authorization' header
      const requestOptions = {
        url: 'https://collector.kesmis.go.ke/v1/projects?forms=true',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      // Send the HTTP request
      request(requestOptions, async function (error, response, body) {

     //   projects = body;
        let projects = await JSON.parse(body);
        // const filteredProjects = projects.filter((project) => {
        //   return (
        //     !project.archived
        //   );
        // });
        const filteredProjectsSorted = projects
        .filter((project) => !project.archived) // Filter out archived projects
        .map((project) => ({
          ...project,
          description: project.description ? project.description : 'Unspecified' // Set 'Unspecified' if description is null or empty
        }))
        .sort((a, b) => new Date(b.lastSubmission) - new Date(a.lastSubmission)); // Sort by date (latest first)

        
     // console.log(filteredProjectsSorted)
        res.status(200).send({
          data: JSON.stringify(filteredProjectsSorted),
          code: '0000',
          token: token // Include the token in the response
        });

      });


 
    } else {
      // Handle errors here
      console.error('Error:', error);
      res.status(500).send({
        error: 'Internal Server Error'
      });
    }
  });
}


exports.modelGetSubmitters = (req, res) => {
  console.log('Body - modelGetSubmitters', req.body);

  // Extract email and password from req.body
  const { form, token, project_id } = req.body;

  
   let submitters
       // Set up the options for the HTTP request, including the 'Authorization' header
       const requestOptions = {
        url: 'https://collector.kesmis.go.ke/v1/projects/'+project_id+'/forms/'+form+'/submissions/submitters',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

    //https://collector.kesmis.go.ke/v1/projects/1/forms/{form_name}/submissions/submitters
  
      // Send the HTTP request
      request(requestOptions, function (error, response, body) {
        submitters = body;
      // // console.log(submitters)
        res.status(200).send({
          data: submitters,
          code: '0000',
          token: token // Include the token in the response
        });

      });
  
  
}


exports.modelDataCollector = (req, res) => {
 //// console.log('Body', req.body);

  // Extract email and password from req.body
  const { project, form, token } = req.body;
 

  let projects
  //https://private-anon-3f136944c0-odkcentral.apiary-mock.com/v1/projects/7/forms/simple.svc/Submissions
  
  let url = 'https://collector.kesmis.go.ke/v1/projects/' + project + '/forms/' + form + '.svc/Submissions'
   
  // Login and get a token 
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,

    },
  }, function (error, response, body) {
   

   // console.log('------>', error)

    if (!error && response.statusCode === 200) {
       
   
        projects = body;
       // console.log(projects)
        res.status(200).send({
          data: projects,
          code: '0000',
          token: token // Include the token in the response
        });
 


 
    } else {
      // Handle errors here
      console.error('Error:', error);
      res.status(500).send({
        error: 'Internal Server Error'
      });
    }
  });
}

 

async function removeDot(item) { 
  const keys = Object.keys(item);
  let modifiedItem = {}
   //console.log('keys', keys)
 //// console.log(item, keys.length)
  if (keys&& keys.length > 0) {
    for (const key of keys) {
      let  lastKeyPart = key.includes('.') ? key.split('.').pop() : key;
   
      // Create a new object with the modified key
      modifiedItem[lastKeyPart] =  item[key] ;
     //// console.log( item[key])
     

    }
  }
 // console.log(modifiedItem)
  return modifiedItem
}


function hasNavigationProperty(xmlString) {
  // Parse the XML string
  const options = {
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
  };
  const parser = new XMLParser();

 
  const jsonObj = parser.parse(xmlString, options);
   
 

  
  try {
  
    jsonObj['edmx:Edmx']['edmx:DataServices'].Schema[1].EntityType[0].NavigationProperty
   // console.log("In")
    return true;
    
  } catch (error) {
   // console.log("OUT")
      // Handle the TypeError (e.g., log an error message)
       return false;
   
  }
 
}

 


 async function flattenArray(arr) {
  let flattenedArray = [];

  for (const obj of arr) {
    let result = {};
    let hasChildren = false 
    let tmp = []

    async function recurse(current, parentKey = '') {
      for (const key in current) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        
        if (Array.isArray(current[key])) {
          if (current[key].length > 0 && typeof current[key][0] === 'object') {
            //// console.log('KEY', current[key],current[key].length )
            hasChildren = true
           // let tmp = []
            // If it's an array of objects, get child details and append as a new outer object
            current[key].forEach(async (item) => {
              const nestedResult = { ...result }; // Copy the parent object
              recurse(item, newKey); // Recurse into the nested object
              const res = await removeDot(result) 
            //// console.log('-----', res )
              tmp.push(res); // Add the flattened object to the result array
            });

          }
          else {
            // If it's an array of primitive values, add it to the result object
            result[newKey] = current[key];
          }
        }
        else if (typeof current[key] === 'object' && current[key] !== null) {
          await recurse(current[key], newKey);
        }
        else {
          result[newKey] = current[key];
          //console.log("XXX--XXX_--")
          //console.log(result[newKey] )
        }
      }
    }

    await recurse(obj);
    if (hasChildren) {
        
        
      // remove the first array thats before the children
      //console.log(tmp.slice(1))
     flattenedArray.push(...tmp);

    } else {
    }

  }

  return flattenedArray;
}

 
 
 
function flattenPlainArray(arr) {
  const flattenedData = [];

  for (const obj of arr) {
    const processedObj = flattenPlain(obj);
    flattenedData.push(processedObj);
  }

  return flattenedData;
}

function flattenPlain(obj, parentKey = '') {

  let result = {};

  for (const key in obj) {
    if (obj[key] !== null && typeof obj[key] === 'object') {
      const flattened = flattenPlain(obj[key], parentKey ? `${parentKey}_${key}` : key);
      result = { ...result, ...flattened };
    } else {
     // result[parentKey ? `${parentKey}_${key}` : key] = obj[key];
      result[ key] = obj[key];
    }
  }

  return result;
}



 




async function getEntities(token, project) {
  console.log('getEntities',project )
  return new Promise((resolve, reject) => {
    //const url = 'https://collector.kesmis.go.ke/v1/projects/' + project + '/datasets/settlements.svc/Entities';
    const url = 'https://collector.kesmis.go.ke/v1/projects/1/datasets/settlements.svc/Entities'; // get entites from Project 1

    request({
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (response.statusCode === 200) {
        const dataset = JSON.parse(body);
          resolve(dataset);
         

      } else {
        reject(`Error: Status Code ${response.statusCode}`);
      }
    });
  });
}



async function checkifhasRepeats(token,project,  form) {
  return new Promise((resolve, reject) => {
    //const url = 'https://collector.kesmis.go.ke/v1/projects/' + project + '/datasets/settlements.svc/Entities';
     const url = 'https://collector.kesmis.go.ke/v1/projects/'+project+ '/forms/'+form+'.svc/$metadata'


    request({
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, (error, response, body) => {
      if (error) {
        reject(error);
      } else if (response.statusCode === 200) {
        const dataset = body;

        resolve(dataset);
 
         

         

      } else {
        reject(`Error: Status Code ${response.statusCode}`);
      }
    });
  });
}

 
function mergeObjectsByKeys(arr1, arr2, key1, key2) {
  const mergedArray = [];

  for (const obj1 of arr1) {
    for (const obj2 of arr2) {
      if (obj1[key1] === obj2[key2]) {
        // Merge the properties of obj1 and obj2
        const mergedObject = { ...obj1, ...obj2 };
        mergedArray.push(mergedObject);
      }
    }
  }

  return mergedArray;
}


 

 
exports.modelDataCollectorGetFlattened = async (req, res) => {
  // Extract email and password from req.body
  const { project, form, token, submitter_filter } = req.body;

  console.log('modelDataCollectorGetFlattened', req.body);

  let url;
 
  if (submitter_filter != 0) {
    url = 'https://collector.kesmis.go.ke/v1/projects/'+project+'/forms/'+form+'.svc/Submissions?$expand=*&$filter=(__system%2FsubmitterId eq '+submitter_filter+')'
   
  } else {
    url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}.svc/Submissions?$expand=*`;
  }

  console.log(url);

  try {
    const response = await makeRequest(url, token);

    //console.log('response',response.body)

    if (response && response.body) {
      const objResults = JSON.parse(response.body);
      const objs = objResults.value;

      console.log(objResults.length)

      const settlements = await getEntities(token, project);

      let subsetEntities = [];
      if (settlements) {
        for (const sett of settlements.value) {
          const selectedProperties = {
            settlement_id: sett.__id,
            county_name: sett.county_name,
            settlement_name: sett.sett_name,
            settlement_code: sett.code,
            // Add more properties as needed
          };
          subsetEntities.push(selectedProperties);
        }
      } else {
        console.error('Error: Received empty or invalid dataset from API');
      }

      let flattenedObject;
      const xmlData = await checkifhasRepeats(token, project, form);
      const hasProperty = hasNavigationProperty(xmlData);

      if (hasProperty) {
        console.log('has repeats..')
        flattenedObject = await flattenArray(objs);
      } else {
        console.log('No repeats..')
        flattenedObject = flattenPlainArray(objs);
      }

      let mergedArray;

      if (flattenedObject[0] && flattenedObject[0].hasOwnProperty('pcode')) {
        mergedArray = mergeObjectsByKeys(flattenedObject, subsetEntities, 'pcode', 'settlement_code');
      } else {
        mergedArray = flattenedObject;
      }

      res.status(200).send({
        data: mergedArray,
        code: '0000',
        token: token, // Include the token in the response
      });
    } else {
      console.error(`Error: Failed to fetch data from API. Status code: ${response}`);
      res.status(500).send({
        error: 'Internal Server Error',
      });
    }
  } catch (error) {
    console.error('Error during request:', error);
    res.status(500).send({
      error: 'Internal Server Error',
    });
  }
};


 

// Helper function to deduplicate array
function deduplicateArray(arr, uniqueKey) {
  const seen = new Set();
  return arr.filter(item => {
    const key = item[uniqueKey];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}


 
 
async function makeRequest(url, token) {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, (error, response, body) => {
      if (error) {
        reject({
          message: error.message,
          statusCode: response ? response.statusCode : null,
          response: response,
        });
      } else if (response.statusCode >= 400) {
        reject({
          message: `Request failed with status code ${response.statusCode}`,
          statusCode: response.statusCode,
          response: response,
          body: body
        });
      } else {
        resolve(response);
      }
    });
  });
}





function createGeoJSONFeatures(dataArray) {
  const features = [];

  for (const data of dataArray) {
      // Find the key containing the GeoJSON geometry dynamically
      let geojsonGeometry = null;
      for (const key in data) {
          if (data[key] && data[key].type && data[key].coordinates) {
              geojsonGeometry = data[key];
              break;
          }
      }

      if (geojsonGeometry) {
          // Create a GeoJSON Feature object with the dynamic geometry
          const geojsonFeature = {
              type: "Feature",
              geometry: geojsonGeometry,
              properties: data
          };
          
          features.push(geojsonFeature);
      } else {
          console.error("No valid GeoJSON geometry found in the data.");
      }
  }

  // Create a GeoJSON FeatureCollection
  const geojsonCollection = {
      type: "FeatureCollection",
      features: features
  };

  return geojsonCollection;
}
 
 

exports.modelDataCollectorGetGeoJSON= (req, res) => {
 // console.log('Body', req.body);

  // Extract email and password from req.body
  const { project, form, token } = req.body;
 

    
  let url = 'https://collector.kesmis.go.ke/v1/projects/' + project + '/forms/' + form + '.svc/Submissions?%24expand=*'
 
  // Login and get a token 
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,

    },
  }, async function (error, response, body) {
   

   // console.log('------>', error)

    if (!error && response.statusCode === 200) {
       
      let objResults = JSON.parse(body)
       // console.log(objResults.value )
      let objs = objResults.value

      const  setlements =   await getEntities(token, project)


     //// console.log(setlements)

     let subsetEntities=[]       
      if (setlements) {
           
            // Select the properties you want
            for (const sett of setlements.value) { 
              const selectedProperties = {
                settlement_id: sett.__id,
                county_name: sett.county_name,
                settlement_name: sett.sett_name,
                settlement_code: sett.code,
  
                // Add more properties as needed
              };
             //// console.log(sett)
             //// console.log(selectedProperties);
              subsetEntities.push(selectedProperties)
            }
        
          } else {
            console.error('Error: Received empty or invalid dataset from API');
          }

     
              // Call the function to create the GeoJSON Feature
          const geojsonFeature = createGeoJSONFeatures(objs);

          if (geojsonFeature) {
              // Convert the GeoJSON object to a string if needed
            const geojsonString = JSON.stringify(geojsonFeature);
           // console.log('geojsonString',geojsonString)

              // You can use the `geojsonFeature` or `geojsonString` as needed in your application.
          }
   
        res.status(200).send({
          data: geojsonFeature,
          code: '0000',
          token: token // Include the token in the response
        });
 


 
    } else {
      // Handle errors here
      console.error('Error:', error);
      res.status(500).send({
        error: 'Internal Server Error'
      });
    }
  });
}



 exports.modelDataCollectorCSV = (req, res) => {
 // console.log('Body', req.body);

  // Extract email and password from req.body
  const { project, form, token,submitter_filter } = req.body;

  //let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=false`;

   
  let url 
  if (submitter_filter != 0) { 
    //url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=true`;
    url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=true&%24filter=(__system%2FsubmitterId eq ${submitter_filter})`;

  }
  else {
    url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=false`;


   }
  // console.log(url)

   
  // Login and get a token
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    encoding: null, // This option ensures that the response is treated as binary data
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const filename = 'submissions.csv.zip';

      // Set the response headers for a zip file
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send the binary data as the response
      //res.status(200).send(body);
      const responseData = {
        message: 'Data acquired Successfully',
        code: '0000',
        data: body.toString('base64'), // Convert binary data to base64
      };

      res.status(200).json(responseData);
      
    }
    else {
      // Handle errors here
      console.error('Error:', error);
      res.status(500).send({
        error: 'Internal Server Error'
      });
    }
  });
};


exports.modelDataCollectorCSVWithMedia = (req, res) => {
 // console.log('Body', req.body);

  // Extract email and password from req.body
  const { project, form, token, submitter_filter } = req.body;

  let url 
  if (submitter_filter != 0) { 
    //url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=true`;
    url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=true&%24filter=(__system%2FsubmitterId eq 1)`;

  }
  else {
    url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=true`;


  }


  // Login and get a token
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    encoding: null, // This option ensures that the response is treated as binary data
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const filename = 'submissions.csv.zip';

      // Set the response headers for a zip file
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send the binary data as the response
      //res.status(200).send(body);
      const responseData = {
        message: 'Data acquired Successfully',
        code: '0000',
        data: body.toString('base64'), // Convert binary data to base64
      };

      res.status(200).json(responseData);
      
    }
    else {
      // Handle errors here
      console.error('Error:', error);
      res.status(500).send({
        error: 'Internal Server Error'
      });
    }
  });
};

 

exports.modelGetSubmissions = async (req, res) => {
 
   // Extract email and password from req.body
   const { project, form, token } = req.body;

   // Get user info for filtering
   let userFilter = null;
   let userCountyName = null;
   let userSettlementCode = null;
   let userSettlementName = null;
   
   if (req.userid) {
     try {
       const User = db.user;
       const user = await User.findByPk(req.userid);
       if (user) {
         const roles = await user.getRoles();
         // Check if user has national level access
         const hasNationalAccess = roles.some(role => {
           return role.user_roles?.location_level === 'national' || 
                  ['super_admin', 'root_admin', 'admin', 'staff'].includes(role.name);
         });

         if (!hasNationalAccess) {
           // Find the first non-national role to determine filter
           const locationRole = roles.find(role => {
             const locationLevel = role.user_roles?.location_level;
             return locationLevel === 'county' || locationLevel === 'settlement';
           });

           if (locationRole && locationRole.user_roles) {
             userFilter = {
               location_level: locationRole.user_roles.location_level,
               county_id: locationRole.user_roles.county_id,
               settlement_id: locationRole.user_roles.settlement_id
             };

             // Get county name if filtering by county
             if (userFilter.location_level === 'county' && userFilter.county_id) {
               try {
                 const County = db.models.county || db.county;
                 const userCounty = await County.findByPk(userFilter.county_id);
                 if (userCounty) {
                   userCountyName = userCounty.name;
                 }
               } catch (countyError) {
                 console.error('Error getting county info:', countyError);
               }
             }

             // Get settlement info if filtering by settlement
             if (userFilter.location_level === 'settlement' && userFilter.settlement_id) {
               try {
                 const Settlement = db.models.settlement || db.settlement;
                 const userSettlement = await Settlement.findByPk(userFilter.settlement_id);
                 if (userSettlement) {
                   userSettlementCode = userSettlement.code;
                   userSettlementName = userSettlement.name;
                 }
               } catch (settlementError) {
                 console.error('Error getting settlement info:', settlementError);
               }
             }
           }
         }
       }
     } catch (userError) {
       console.error('Error getting user info for filtering:', userError);
       // Continue without filtering if there's an error
     }
   }

  // let url 
 //  url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions`;
 const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}.svc/Submissions?%24expand=*`;

 
  //const baseUrl = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}.svc/Submissions`;
  //const url = `${baseUrl}?%24expand=*&%24filter=year(__system/createdAt) lt year(now())`;


   // Login and get a token
    // Login and get a token 
    request({
      method: 'GET',
      url: url,
    // url: `${url}?%24expand=*&$select=sec_officials`,  // Add query parameter here
    // url: `${url}?%24expand=*&%24count=true&%24top=1`,  // Add query parameter here
   // http://services.odata.org/V4/OData/OData.svc/Suppliers?$select=Name, ID, &$filter=ID eq 1

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
  
      },
    }, async function (error, response, body) {
     

     // console.log('------>', error)
  
      if (!error && response.statusCode === 200) {
         
        let objResults = JSON.parse(body)
     //   console.log(objResults.value )
        let tmp_objs = objResults.value 

        const objs = tmp_objs.filter(submission => {
        // Handle null or undefined values for reviewState
        const reviewState = submission.__system?.reviewState?.toLowerCase();
        return reviewState !== 'rejected';
      });


          //console.log('SEC data....',objs)
          // Retrieve entities
          let entities = await getEntities(token, project);
         // console.log(entities)

          // Convert entities to a lookup map for quick access
          let entitiesMap = new Map();
          let entitiesCountyMap = new Map(); // Map settlement code to county
          entities.value.forEach(entity => {
            entitiesMap.set(entity.code, entity.sett_name);
            entitiesCountyMap.set(entity.code, entity.county_name);
          });



 

        // Select only the desired fields and map settlements
        let filteredData = objs.map(submission => {
          return {
            id: submission.id,
            date: submission.today,
            group_location: submission.group_location,
            grp_certification: submission.grp_certification,
            pcode: submission.group_location?.pcode,
            sec_officials: submission.sec_officials,
            grc_officials: submission.grc_officials,
            meta_instanceID: submission.meta?.instanceID,
            meta : submission.__system,
            settlement_name: entitiesMap.get(submission.group_location?.pcode) || 'Unknown', // Append settlement name
            county_name: entitiesCountyMap.get(submission.group_location?.pcode) || 'Unknown', // Append county name
          };
        });

        // Apply user-based filtering if user is not national level
        if (userFilter) {
          filteredData = filteredData.filter(submission => {
            if (userFilter.location_level === 'county' && userCountyName) {
              // Filter by county name
              const submissionCounty = submission.county_name || submission.group_location?.county;
              return submissionCounty === userCountyName;
            } else if (userFilter.location_level === 'settlement') {
              // Filter by settlement code or name
              const submissionPcode = submission.pcode;
              const submissionSettlementName = submission.settlement_name;
              return (userSettlementCode && submissionPcode === userSettlementCode) ||
                     (userSettlementName && submissionSettlementName === userSettlementName);
            }
            return true;
          });
        }

   

     
          res.status(200).send({
            data: filteredData,
            code: '0000',
            token: token // Include the token in the response
          });
   
  
  
   
      } else {
        // Handle errors here
        console.error('Error:', error);
        res.status(500).send({
          error: 'Internal Server Error'
        });
      }
    });
 };
 
 
 /**
 * Recursively search for GeoJSON geometry in the data.
 * @param {Object|Array} data - Object or array that might contain GeoJSON geometry.
 * @return {Object|null} The GeoJSON geometry (or null if not found).
 */
function findGeometry(data) {
  if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null) {
              if ('type' in value && 'coordinates' in value) {
                  return value;
              }
              const geometry = findGeometry(value);
              if (geometry) {
                  return geometry;
              }
          }
      }
  } else if (Array.isArray(data)) {
      for (const item of data) {
          const geometry = findGeometry(item);
          if (geometry) {
              return geometry;
          }
      }
  }
  return null;
}

/**
* Flatten a nested object to extract leaf nodes only.
* @param {Object} obj - Object to flatten.
* @return {Object} Flattened object.
*/
function flattenProperties(obj) {
  const leaves = {};

  for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(leaves, flattenProperties(value));
      } else if (!Array.isArray(value)) { // Skip lists
          leaves[key] = value;
      }
  }

  return leaves;
}

/**
* Convert a list of data dictionaries into a GeoJSON FeatureCollection.
* Handles cases with and without nesting.
* @param {Array} dataArray - List of dictionaries containing 'geometry' and 'properties'.
* @param {string} outputFile - The output file to save the GeoJSON data.
* @return {Object} GeoJSON FeatureCollection.
*/
function convertToGeoJSON(dataArray, outputFile) {
  const features = [];

  for (const data of dataArray) {
      // Flatten all parent-level properties
      const parentProperties = flattenProperties(data);
      const foundGeometry = findGeometry(data);

      // If geometry is found at the root level, create a feature
      if (foundGeometry) {
          const geojsonFeature = {
              type: 'Feature',
              geometry: foundGeometry,
              properties: parentProperties,
          };
          features.push(geojsonFeature);
          continue;
      }

      // If no root-level geometry, look for nested data structures
      for (const [key, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
              for (const item of value) {
                  // Flatten each nested structure and find geometry
                  const nestedGeometry = findGeometry(item);
                  const nestedProperties = flattenProperties(item);

                  // Combine parent properties with nested properties
                  const combinedProperties = { ...parentProperties, ...nestedProperties };

                  if (nestedGeometry) {
                      const geojsonFeature = {
                          type: 'Feature',
                          geometry: nestedGeometry,
                          properties: combinedProperties,
                      };
                      features.push(geojsonFeature);
                  }
              }
          }
      }
  }

  // Create a GeoJSON FeatureCollection
  const geojsonCollection = {
      type: 'FeatureCollection',
      features: features,
  };

  // Save GeoJSON data to the specified file
   
//console.log(geojsonCollection)
  return geojsonCollection;
}



 



 exports.modelGetAllSubmissions = (req, res) => {
 
  // Extract email and password from req.body
  const { project, form, token } = req.body;

   // let url 
//  url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions`;
const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}.svc/Submissions?%24expand=*`;

 //const baseUrl = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}.svc/Submissions`;
 //const url = `${baseUrl}?%24expand=*&%24filter=year(__system/createdAt) lt year(now())`;


  // Login and get a token
   // Login and get a token 
   request({
     method: 'GET',
     url: url,
   // url: `${url}?%24expand=*&$select=sec_officials`,  // Add query parameter here
   // url: `${url}?%24expand=*&%24count=true&%24top=1`,  // Add query parameter here
  // http://services.odata.org/V4/OData/OData.svc/Suppliers?$select=Name, ID, &$filter=ID eq 1

     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`,
 
     },
   }, async function (error, response, body) {
    
 
    // console.log('------>', error)
 
     if (!error && response.statusCode === 200) {
        
       let objResults = JSON.parse(body)
    //   console.log(objResults.value )
       let tmp_objs = objResults.value 

       const objs = tmp_objs.filter(submission => {
       // Handle null or undefined values for reviewState
       const reviewState = submission.__system?.reviewState?.toLowerCase();
       return reviewState !== 'rejected';
     });
 
     const converted = convertToGeoJSON(objs)
     const responseData = converted.features.length > 0? converted : objs;

     console.log(converted)
    
         res.status(200).send({
           data: responseData,
           code: '0000',
           result:converted  && converted.features.length >0 ? 'geojson' : 'array',
           token: token // Include the token in the response
         });
  
 
 
  
     } else {
       // Handle errors here
       console.error('Error:', error);
       res.status(500).send({
         error: 'Internal Server Error'
       });
     }
   });
};

exports.modelCreateSubmission = (req, res) => {
  const { project, form, token, xml, deviceId } = req.body;
  let responded = false;

  if (!project || !form || !token || !xml) {
    return res.status(400).send({
      error: 'Missing required fields: project, form, token, xml'
    });
  }

  const qs = deviceId ? `?deviceID=${encodeURIComponent(deviceId)}` : '';
  const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions${qs}`;

  // Ensure the submission XML has the form id attribute on the root <data> node
  let xmlBody = xml;
  try {
    // Ensure the root element has id=<form>. Works for <data> or any root tag.
    // Find first non-XML-declaration tag.
    const rootMatch = xmlBody.match(/<(?!\?xml)([a-zA-Z0-9_-]+)([^>]*)>/);
    if (rootMatch) {
      const fullMatch = rootMatch[0];
      const tagName = rootMatch[1];
      const attrs = rootMatch[2] || '';
      const withoutId = attrs.replace(/\sid="[^"]*"/i, '');
      const rebuilt = `<${tagName} id="${form}"${withoutId}>`;
      xmlBody = xmlBody.replace(fullMatch, rebuilt);
    }

    // If pcode exists, resolve settlement/county from Central entities and inject names into XML.
    const pcodeMatch = xmlBody.match(/<pcode>([^<]*)<\/pcode>/i);
    const pcodeVal = pcodeMatch && pcodeMatch[1] ? pcodeMatch[1].trim() : '';
    if (pcodeVal) {
      getEntities(token, project)
        .then((ents) => {
          const entity = ents?.value?.find((e) => e.code === pcodeVal);
          if (entity) {
            if (entity.sett_name) {
              xmlBody = xmlBody.replace(/<settlement>[^<]*<\/settlement>/i, `<settlement>${entity.sett_name}</settlement>`);
            }
            if (entity.county_name) {
              xmlBody = xmlBody.replace(/<county>[^<]*<\/county>/i, `<county>${entity.county_name}</county>`);
            }
          }
          submitToCentral(xmlBody);
        })
        .catch((err) => {
          console.warn('Settlement entity lookup failed, submitting as-is', err);
          submitToCentral(xmlBody);
        });
      return; // submit inside callbacks above
    }
  } catch (e) {
    console.warn('Unable to enforce form id on XML, using provided XML', e);
  }

  // default flow if no async entity lookup is needed
  submitToCentral(xmlBody);

  function submitToCentral(bodyXml) {
    const qs = deviceId ? `?deviceID=${encodeURIComponent(deviceId)}` : '';
    const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions${qs}`;

    request(
      {
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/xml',
          'X-OpenRosa-Version': '1.0',
          Authorization: `Bearer ${token}`
        },
        body: bodyXml
      },
      (err, response, body) => {
        if (responded) return;
        if (err) {
          responded = true;
          console.error('Create submission error:', err);
          return res.status(500).send({
            error: 'Failed to create submission',
            message: err.message
          });
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          responded = true;
          return res.status(200).send({
            message: 'Submission created successfully',
            data: body
          });
        }

        responded = true;
        console.error('Create submission failed:', response.statusCode, body);
        return res.status(response.statusCode).send({
          error: 'Failed to create submission',
          status: response.statusCode,
          body
        });
      }
    );
  }

};

exports.modelGetSettlements = async (req, res) => {
  const { project, token } = req.body;

  if (!project || !token) {
    return res.status(400).send({
      error: 'Missing required fields: project, token'
    });
  }

  try {
    const settlements = await getEntities(token, project);
    if (!settlements || !settlements.value) {
      return res.status(500).send({ error: 'Failed to fetch settlements' });
    }
    const mapped = settlements.value.map(s => ({
      id: s.__id,
      code: s.code,
      sett_name: s.sett_name,
      county_name: s.county_name
    }));
    return res.status(200).send({
      data: mapped,
      code: '0000'
    });
  } catch (error) {
    console.error('Get settlements error:', error);
    return res.status(500).send({
      error: 'Failed to fetch settlements',
      message: error.message
    });
  }
};




 
// Function to get CSV submissions and send as a downloadable file
exports.modelGetCsvSubmissions = (req, res) => {
  // Extract project, form, and token from req.body
  const { project, form, token } = req.body;

  // Validate required fields
  if (!project || !form || !token) {
    return res.status(400).send({
      error: 'Missing required fields: project, form, or token',
    });
  }

  // Construct the CSV export URL
  const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv?groupPaths=false&xmlFormId=${encodeURIComponent(form)}`;
 //POST /v1/projects/{projectId}/forms/{xmlFormId}/submissions.csv


  // Make the request to the CSV endpoint
  request({
    method: 'POST',
    url: url,
    headers: {
      'Content-Type': 'text/csv',
      'Authorization': `Bearer ${token}`,
    },
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      try {
        // Parse CSV data if needed (optional, depending on your needs)
        // For simplicity, we'll assume the body is raw CSV text
        const csvData = body;
 

        // Optional: Filter out rejected submissions
        // Note: CSV parsing is complex; if filtering is needed, use a library like 'csv-parse'
        // Here, we'll assume the API handles filtering or you accept all submissions
        // If you need to filter, you can parse CSV with 'csv-parse' and filter rows

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="submissions_${form}_${Date.now()}.csv"`);

        // Send the CSV data as the response
        res.status(200).send(csvData);

      } catch (parseError) {
        console.error('Error processing CSV:', parseError);
        res.status(500).send({
          error: 'Failed to process CSV data',
        });
      }
    } else {
      // Handle API errors
      console.error('Error fetching CSV:', error || `Status code: ${response.statusCode}`);
      res.status(500).send({
        error: 'Failed to retrieve CSV submissions',
      });
    }
  });
};




 

 
exports.modelGetGeoJsonSubmissions = (req, res) => {
  // Extract project, form, and token from req.body
  const { project, form, token } = req.body;

  // Validate required fields
  if (!project || !form || !token) {
    return res.status(400).send({
      error: 'Missing required fields: project, form, or token',
    });
  }

  // Construct the OData endpoint URL for ODK Central API
  const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}.svc/Submissions?%24expand=*`;

  // Make the request to the OData endpoint
  request(
    {
      method: 'GET',
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        try {
          // Parse the OData JSON response
          const data = JSON.parse(body);
          const submissions = data.value;

          // Filter out rejected submissions
          const filteredSubmissions = submissions.filter(sub => {
            const reviewState = sub.__system?.reviewState?.toLowerCase();
            return reviewState !== 'rejected';
          });

          console.log(submissions)
          // Convert to GeoJSON
          const geojsonData = convertToGeoJSON2(filteredSubmissions);

          // Validate GeoJSON structure
          if (!geojsonData || geojsonData.type !== 'FeatureCollection') {
            throw new Error('Failed to generate valid GeoJSON');
          }

          // Set headers for GeoJSON file download
          res.setHeader('Content-Type', 'application/geo+json');
          res.setHeader('Content-Disposition', `attachment; filename="submissions_${form}_${Date.now()}.geojson"`);

          // Send the GeoJSON data as the response
          res.status(200).send(geojsonData);
        } catch (parseError) {
          console.error('Error processing GeoJSON:', parseError);
          res.status(500).send({
            error: 'Failed to process GeoJSON data',
          });
        }
      } else {
        console.error('Error fetching submissions:', error || `Status code: ${response.statusCode}`);
        res.status(500).send({
          error: 'Failed to retrieve GeoJSON submissions',
        });
      }
    }
  );
};

 // Convert OData submissions to GeoJSON, dynamically detecting GeoJSON geometry field and type
function convertToGeoJSON2(submissions) {
  // Valid GeoJSON geometry types
  const validGeometryTypes = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
  ];

  return {
    type: 'FeatureCollection',
    features: submissions
      .filter(sub => {
        // Find the GeoJSON geometry field (e.g., location, geopoint, etc.)
        const geometryField = Object.keys(sub).find(
          key =>
            sub[key] &&
            typeof sub[key] === 'object' &&
            validGeometryTypes.includes(sub[key].type) &&
            Array.isArray(sub[key].coordinates) &&
            isValidCoordinates(sub[key].type, sub[key].coordinates)
        );
        return !!geometryField; // Only include submissions with a valid GeoJSON geometry
      })
      .map(sub => {
        // Initialize properties object
        const properties = {};

        // Find the GeoJSON geometry field
        const geometryField = Object.keys(sub).find(
          key =>
            sub[key] &&
            typeof sub[key] === 'object' &&
            validGeometryTypes.includes(sub[key].type) &&
            Array.isArray(sub[key].coordinates) &&
            isValidCoordinates(sub[key].type, sub[key].coordinates)
        );

        // Define reserved keys to exclude (include the geometry field dynamically)
        const reservedKeys = ['meta', '__system', 'photos', geometryField].filter(Boolean);

        // Dynamically include all top-level properties (non-objects or non-reserved)
        Object.keys(sub).forEach(key => {
          if (!reservedKeys.includes(key) && (typeof sub[key] !== 'object' || sub[key] === null)) {
            properties[key] = sub[key];
          }
        });

        // Dynamically flatten all nested objects (excluding reserved keys)
        Object.keys(sub).forEach(key => {
          if (
            !reservedKeys.includes(key) &&
            sub[key] &&
            typeof sub[key] === 'object' &&
            !Array.isArray(sub[key])
          ) {
            Object.assign(properties, sub[key]);
          }
        });

        // Include relevant fields from meta
        if (sub.meta && typeof sub.meta === 'object') {
          properties.instanceID = sub.meta.instanceID;
        }

        // Include relevant fields from __system
        if (sub.__system && typeof sub.__system === 'object') {
          Object.assign(properties, {
            submissionDate: sub.__system.submissionDate,
            submitterId: sub.__system.submitterId,
            submitterName: sub.__system.submitterName,
            attachmentsPresent: sub.__system.attachmentsPresent,
            attachmentsExpected: sub.__system.attachmentsExpected,
            status: sub.__system.status,
            reviewState: sub.__system.reviewState,
            deviceId: sub.__system.deviceId,
            edits: sub.__system.edits,
            formVersion: sub.__system.formVersion,
          });
        }

        // Include photos as an array of photo names (if needed)
        if (sub.photos && Array.isArray(sub.photos)) {
          properties.photos = sub.photos.map(photo => photo.photo);
        }

        // Include geometry properties (e.g., accuracy)
        if (sub[geometryField]?.properties?.accuracy) {
          properties.location_accuracy = sub[geometryField].properties.accuracy;
        }

        return {
          type: 'Feature',
          geometry: sub[geometryField], // Use the detected GeoJSON geometry
          properties,
        };
      }),
  };
}

// Validate coordinates based on geometry type
function isValidCoordinates(type, coordinates) {
  if (!Array.isArray(coordinates)) return false;

  switch (type) {
    case 'Point':
      return coordinates.length >= 2 && coordinates.every(c => typeof c === 'number');
    case 'LineString':
      return coordinates.length >= 2 && coordinates.every(c => Array.isArray(c) && c.length >= 2);
    case 'Polygon':
      return (
        Array.isArray(coordinates) &&
        coordinates.every(ring => Array.isArray(ring) && ring.length >= 4 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1])
      );
    case 'MultiPoint':
      return coordinates.every(c => Array.isArray(c) && c.length >= 2);
    case 'MultiLineString':
      return coordinates.every(line => Array.isArray(line) && line.length >= 2 && line.every(c => Array.isArray(c) && c.length >= 2));
    case 'MultiPolygon':
      return coordinates.every(polygon => Array.isArray(polygon) && polygon.every(ring => Array.isArray(ring) && ring.length >= 4));
    default:
      return false;
  }
}


 exports.xmodelDeleteSubmission = (req, res) => {
  // Extract necessary fields from the request body
  const { project, form, token, submissionId } = req.body;

  let id='uuid:abf3aa08-33b0-4801-8f15-119a1e8fa42a'
  // Construct the URL for deleting a specific submission
  let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${id}`;

  
  console.log(url)
  
  // PUT /v1/projects/{projectId}/forms/{xmlFormId}/submissions/{instanceId}
  // Make the DELETE request to the ODK Central API
  request({
    method: 'DELETE',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Auth token from the request
    },
  }, function (error, response, body) {
    // Handle response
    if (!error && response.statusCode === 200) {
      res.status(200).send({
        message: 'Submission deleted successfully',
        code: '0000',
      });
    } else {
      // Log and handle errors
      console.error('Error:', error || body);
      res.status(500).send({
        error: 'Internal Server Error',
        message: body || error,
      });
    }
  });
};
 
exports.modelDeleteSubmission = (req, res) => {
  // Extract necessary fields from the request body
  const { project, form, token, submissionID } = req.body;

  console.log( req.body)
  let id='uuid:abf3aa08-33b0-4801-8f15-119a1e8fa42a'
  // Construct the URL for deleting a specific submission
  let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${submissionID}`;

  // Construct the URL for updating the submission
  //let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${submissionId}`;

  // Prepare the data to update the review status
  const reviewStates = ["approved", "hasIssues", "rejected"];

//data.__system.reviewStatus='rejected'
  // Make the PATCH request to the ODK Central API to update the reviewStatus
  request({
    method: 'PATCH',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Auth token from the request
    },
   // body: JSON.stringify(data), // Send the review status update in the body
    body: JSON.stringify({ reviewState: reviewStates[2] }), // Set reviewState to 'rejected'

  }, function (error, response, body) {
    // Handle the response
    if (!error && response.statusCode === 200) {
   //   console.log(response)
      res.status(200).send({
        message: 'Submission review status updated to rejected',
        code: '0000',
      });
    } else {
      // Log and handle errors
      console.error('Error:', error || body);
      res.status(500).send({
        error: 'Internal Server Error',
        message: body || error,
      });
    }
  });
};


 
exports.modelEditSubmission = (req, res) => {
  // Extract necessary fields from the request body
  const { project, form, token, submissionID } = req.body;

  console.log( req.body)
 
  // Construct the URL for deleting a specific submission
  let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${submissionID}?$expand=*&`;

   // Make the PATCH request to the ODK Central API to update the reviewStatus
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Auth token from the request
    },
  
  }, async function (error, response, body) {
    // Handle the response
    if (!error && response.statusCode === 200) {
   //   console.log(response)

   const submissionData = await  JSON.parse(body);

   // Modify the specific field
   console.log(submissionData)
   // submissionData[fieldName] = newValue;



      res.status(200).send({
        message: 'Submission review status updated to rejected',
        code: '0000',
      });
    } else {
      // Log and handle errors
      console.error('Error:', error || body);
      res.status(500).send({
        error: 'Internal Server Error',
        message: body || error,
      });
    }
  });
};


 
exports.getSubmissionAttachments = (req, res) => {
  // Extract necessary fields from the request body
  const { project, form, token, submissionID } = req.body;

  console.log(req.body);

  // Construct the URL for retrieving a specific submission's attachments
  let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${submissionID}/attachments`;

  // Make the GET request to the ODK Central API to retrieve the list of attachments
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Auth token from the request
    },

  }, async function (error, response, body) {
    // Handle the response
    if (!error && response.statusCode === 200) {
      const attachments = await JSON.parse(body); // Parse the attachments list

      console.log(attachments);

      // Check if there are any attachments
      if (attachments.length > 0) {
        // Send the list of attachments
        res.status(200).send({
          message: 'Attachments retrieved successfully',
          code: '0000',
          attachments: attachments, // Return the list of attachments
        });
      } else {
        // No attachments found
        res.status(404).send({
          message: 'No attachments found for this submission',
          code: '4040',
        });
      }
    } else {
      // Log and handle errors
      console.error('Error:', error || body);
      res.status(500).send({
        error: 'Internal Server Error',
        message: body || error,
      });
    }
  });
};

 
const path = require('path');

exports.xdownloadSubmissionAttachment = (req, res) => {
  // Extract necessary fields from the request body
  const { project, form, token, submissionID, attachmentName } = req.body;

  console.log(req.body);

  // Construct the URL for downloading the attachment
  const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${submissionID}/attachments/${attachmentName}`;

  console.log(url)
  // Make the GET request to the ODK Central API to download the attachment
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Auth token from the request
    },
    encoding: null, // Ensures the file is returned in binary format
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const contentType = response.headers['content-type'];
      const filename = path.basename(attachmentName);

      // Set the appropriate headers to allow file download
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', contentType);

      // Send the file as the response
      //res.status(200).send(body);
 
      res.status(200).send({
        message: 'Attachments retrieved successfully',
        code: '0000',
        data: body, // Return the list of attachments
      });

      
    } else {
      // Handle errors
      console.error('Error:', error || body);
      res.status(500).send({
        error: 'Failed to download attachment',
        message: body || error,
      });
    }
  });
};



exports.xdownloadSubmissionAttachment = (req, res) => {
  const { project, form, token, submissionID, attachmentName } = req.body;

  const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${submissionID}/attachments/${attachmentName}`;

  request({
    method: 'GET',
    url: url,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    encoding: null, // Ensures binary data is handled correctly
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const contentType = response.headers['content-type'];
      const filename = path.basename(attachmentName);

      // Set headers for file download and custom metadata
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', body.length); // Set file size
      res.setHeader('X-Message', 'Attachments retrieved successfully'); // Add custom message
      res.setHeader('code', '0000'); // Add custom code

      // Send the file directly as the response
      // res.status(200).send(body);
      res.status(200).send({
        message: 'Attachments retrieved successfully',
        code: '0000',
        data: body, // Return the list of attachments
      });

    } else {
      console.error('Error:', error || body);
      res.status(500).send({
        error: 'Failed to download attachment',
        message: body || error,
      });
    }
  });
};



 
const tmp = require('tmp'); // For creating temporary files
const fs = require('fs');

exports.downloadSubmissionAttachment = (req, res) => {
  const { project, form, token, submissionID, attachmentName } = req.body;

  const url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions/${submissionID}/attachments/${attachmentName}`;

  request({
    method: 'GET',
    url: url,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    encoding: null, // Ensures binary data is handled correctly
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const contentType = response.headers['content-type'];
      const filename = path.basename(attachmentName);

      // Create a temporary file
      tmp.file({ postfix: path.extname(filename) }, (err, tempFilePath, fd, cleanupCallback) => {
        if (err) {
          console.error('Error creating temporary file:', err);
          return res.status(500).send({
            error: 'Failed to create temporary file',
            message: err.message,
          });
        }

        // Write the binary data to the temporary file
        fs.writeFile(tempFilePath, body, (writeError) => {
          if (writeError) {
            console.error('Error writing to temporary file:', writeError);
            cleanupCallback(); // Clean up temporary file
            return res.status(500).send({
              error: 'Failed to write temporary file',
              message: writeError.message,
            });
          }

          // Set headers for file download and custom metadata
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
          res.setHeader('Content-Type', contentType);
 

         // res.download(tempFilePath);
 
         res.sendFile((tempFilePath), function(fileSendError) {
          // Clean up temporary file after sending
          cleanupCallback();

          if (fileSendError) {
            console.error('Error sending file:', fileSendError);
            return res.status(500).send({
              error: 'Failed to send file',
              message: fileSendError.message,
            });
          }
        });


        });
      });

    } else {
      console.error('Error:', error || body);
      res.status(500).send({
        error: 'Failed to download attachment',
        message: body || error,
      });
    }
  });
};

exports.modelGetProjectUsers = (req, res) => {
  const { project_id, token } = req.body;
  const requestOptions = {
    url: `https://collector.kesmis.go.ke/v1/projects/${project_id}/app-users`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      let users = JSON.parse(body);
      res.status(200).send({
        data: users,
        code: '0000',
        token: token
      });
    } else {
      console.error('Error fetching project users:', error);
      res.status(500).send({ error: 'Failed to fetch project users' });
    }
  });
};