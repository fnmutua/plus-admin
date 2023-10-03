const db = require('../models')
const config = require('../config/db.config.js')
const User = db.user
const Role = db.role

const Sequelize = require('sequelize')
 const op = Sequelize.Op
 var request = require('request');

 
 
 
exports.modelGetProjects = (req, res) => {
  console.log('get projects')
  
  res.status(200).send({
    data: "Projects",
      code: '0000'
  })

}


exports.modelLoginCollector = (req, res) => {
  console.log('Body', req.body);

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
      console.log('Token:', token);


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
        console.log(projects)
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



exports.modelDataCollector = (req, res) => {
  console.log('Body', req.body);

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
   

    console.log('------>', error)

    if (!error && response.statusCode === 200) {
       
   
        projects = body;
        console.log(projects)
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
 // console.log(item, keys.length)
  if (keys&& keys.length > 0) {
    for (const key of keys) {
      let  lastKeyPart = key.includes('.') ? key.split('.').pop() : key;
   
      // Create a new object with the modified key
      modifiedItem[lastKeyPart] =  item[key] ;
     // console.log( item[key])
     

    }
  }
  console.log(modifiedItem)
  return modifiedItem
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
            // console.log('KEY', current[key],current[key].length )
            hasChildren = true
           // let tmp = []
            // If it's an array of objects, get child details and append as a new outer object
            current[key].forEach(async (item) => {
              const nestedResult = { ...result }; // Copy the parent object
              recurse(item, newKey); // Recurse into the nested object
              const res = await removeDot(result) 
            // console.log('-----', res )
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

// async function flattenArray(arr) {
//   let flattenedArray = [];

//   for (const obj of arr) {
//     let result = {};
//     let hasChildren = false;
//     let tmp = [];

//     async function recurse(current, parentKey = '') {
//       for (const key in current) {
//         const newKey = parentKey ? `${parentKey}.${key}` : key;

//         if (Array.isArray(current[key])) {
//           if (current[key].length > 0 && typeof current[key][0] === 'object') {
//             hasChildren = true;
//             // Create an array of promises for the child processing
//             const childPromises = current[key].map(async (item) => {
//               const nestedResult = { ...result }; // Copy the parent object
//               await recurse(item, newKey); // Recurse into the nested object
//               const res = await removeDot(nestedResult);
//               console.log(result)
//              // console.log(res)
//               return res;
//             });

//             // Wait for all promises to resolve
//             const childResults = await Promise.all(childPromises);
//             tmp.push(...childResults); // Add the flattened objects to the result array
//           } else {
//             // If it's an array of primitive values, add it to the result object
//             result[newKey] = current[key];
//            // const res = await removeDot(result);
//             //console.log('last one......', res)
            
//           }
//         }

//         else if (typeof current[key] === 'object' && current[key] !== null) {
//           await recurse(current[key], newKey);
//         }
//         else {
//           result[newKey] = current[key];
         
          
//         }
//       }
//     }

//     await recurse(obj);
//     if (hasChildren) {
//       flattenedArray.push(...tmp);
//     } else {
//       flattenedArray.push(result);
//     }
//   }

//   return flattenedArray;
// }

 



async function getEntities(token, project) {
  return new Promise((resolve, reject) => {
    const url = 'https://collector.kesmis.go.ke/v1/projects/' + project + '/datasets/settlements.svc/Entities';

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



exports.modelDataCollectorGetFlattened = (req, res) => {
  console.log('Body', req.body);

  // Extract email and password from req.body
  const { project, form, token } = req.body;
 

  let projects
  //https://private-anon-3f136944c0-odkcentral.apiary-mock.com/v1/projects/7/forms/simple.svc/Submissions
  
  let url = 'https://collector.kesmis.go.ke/v1/projects/' + project + '/forms/' + form + '.svc/Submissions?%24expand=*'
  let xurl = 'https://collector.kesmis.go.ke/v1/projects/' + project + '/forms/' + form + '.svc/Submissions'
  //https://collector.kesmis.go.ke/v1/projects/1/forms/grc_officials.svc/Submissions?%24expand=*

  // Login and get a token 
  request({
    method: 'GET',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,

    },
  }, async function (error, response, body) {
   

    console.log('------>', error)

    if (!error && response.statusCode === 200) {
       
      let objResults = JSON.parse(body)
        console.log(objResults.value[1])
      let objs = objResults.value

      const  setlements =   await getEntities(token, project)


     // console.log(setlements)

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
             // console.log(sett)
             // console.log(selectedProperties);
              subsetEntities.push(selectedProperties)
            }
        
          } else {
            console.error('Error: Received empty or invalid dataset from API');
          }

      
     // join the enties to form data 
      
         const flattenedObject = await flattenArray(objs);
         
      
      // Call the function to merge arrays of objects based on a common key
     const mergedArray = mergeObjectsByKeys(flattenedObject, subsetEntities, 'pcode',  'settlement_code' );
      
          // Print the merged array1
         // console.log(mergedArray);
   
        res.status(200).send({
          data: mergedArray,
          //data: objs,
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
  console.log('Body', req.body);

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
   

    console.log('------>', error)

    if (!error && response.statusCode === 200) {
       
      let objResults = JSON.parse(body)
        console.log(objResults.value )
      let objs = objResults.value

      const  setlements =   await getEntities(token, project)


     // console.log(setlements)

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
             // console.log(sett)
             // console.log(selectedProperties);
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
            console.log('geojsonString',geojsonString)

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
  console.log('Body', req.body);

  // Extract email and password from req.body
  const { project, form, token } = req.body;

  let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=false`;

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
  console.log('Body', req.body);

  // Extract email and password from req.body
  const { project, form, token } = req.body;

  let url = `https://collector.kesmis.go.ke/v1/projects/${project}/forms/${form}/submissions.csv.zip?attachments=true`;

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
