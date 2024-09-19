const db = require('../models')
 

const Sequelize = require('sequelize')
  var request = require('request');

 const { XMLParser } = require('fast-xml-parser');
 
 
 
exports.modelGetProjects = (req, res) => {
 // console.log('get projects')
  
  res.status(200).send({
    data: "Projects",
      code: '0000'
  })

}


exports.modelLoginCollector = (req, res) => {
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
      request(requestOptions, function (error, response, body) {

        projects = body;
       // console.log(projects)
        res.status(200).send({
          data: projects,
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

 

exports.modelGetSubmissions = (req, res) => {
 
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


          // Retrieve entities
          let entities = await getEntities(token, project);
         // console.log(entities)

          // Convert entities to a lookup map for quick access
          let entitiesMap = new Map();
          entities.value.forEach(entity => {
            entitiesMap.set(entity.code, entity.sett_name);
          });



 
 
              // Select only the desired fields and map settlements
        let filteredData = objs.map(submission => {
          return {
            id: submission.id,
            date: submission.today,
            group_location: submission.group_location,
            grp_certification: submission.grp_certification,
            pcode: submission.group_location.pcode,
            sec_officials: submission.sec_officials,
            grc_officials: submission.grc_officials,
            meta_instanceID: submission.meta?.instanceID,
            settlement_name: entitiesMap.get(submission.group_location.pcode) || 'Unknown', // Append settlement name
          };
        });



    

     
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

          // Send the file directly as the response
          //res.sendFile(tempFilePath, (fileSendError) => {
          //   res.sendFile(path.resolve(tempFilePath), function(fileSendError) {
          //   // Clean up temporary file after sending
          //   cleanupCallback();

          //   if (fileSendError) {
          //     console.error('Error sending file:', fileSendError);
          //     return res.status(500).send({
          //       error: 'Failed to send file',
          //       message: fileSendError.message,
          //     });
          //   }
          // });

          res.download(tempFilePath);

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
