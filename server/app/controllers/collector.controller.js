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

  request({
    method: 'POST',
    url: 'https://collector.kesmis.go.ke/v1/sessions',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody) // Convert the object to a JSON string
  }, function (error, response, body) {
    console.log('Status:', response.statusCode);
    console.log('Headers:', JSON.stringify(response.headers));
    console.log('Response:', body);

    if (!error && response.statusCode === 200) {
      // Parse the JSON response
      const responseBody = JSON.parse(body);

      // Extract the token from the response
      const token = responseBody.token;

      // Do something with the token (e.g., store it, send it in the response, etc.)
      console.log('Token:', token);

      res.status(200).send({
        data: "Login",
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


 