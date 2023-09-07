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

 