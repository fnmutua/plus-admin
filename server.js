const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const fs = require('fs');
 



var corsOptions = {
  origin: ['http://localhost','http://localhost:4000',   'http://localhost:3000','http://localhost:8100','http://localhost:8080', '*', 'https://collector.kesmis.go.ke']
};

const path = require('path')
//const fileUpload = require('express-fileupload')


const uploadsDir = path.join(__dirname, '..', 'uploads'); // path to the uploads folder
if (!fs.existsSync(uploadsDir)) {
  // if uploads folder does not exist, create it
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const envt = 'DEV'   // PROD
 if (envt==='DEV') {
// Switch off for prodcution 
console.log("DEV: Switching on dotenv")
 
const dotenv = require('dotenv')
//dotenv.config() 

   // Replace 'path-to-your-specific-env-file' with the actual path to your .env file
const envFilePath = path.resolve(__dirname, '.env.kisip');
dotenv.config({ path: envFilePath });

 }
 

app.use(cors(corsOptions))
// app.use(cors()) 

// middle ware
// app.use(express.static('public')); //to access the files in public folder
// app.use(cors()); // it enables all cors requests
//app.use(fileUpload())

// parse requests of content-type - application/json
app.use(bodyParser.json({ limit: '200mb' }))
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))

// simple route

// app.get("/", (req, res) => {
//   res.json({ message: "Welcome to bezkoder application." });
// });

app.use(express.static(path.join(__dirname, '/dist-pro')))
// app.use(express.static('files'))

//app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')) })

// Handles any requests that don't match the ones above
app.get('/', (req, res) => {
  // eslint-disable-next-line no-path-concat
  res.sendFile(path.join(__dirname + '/dist-pro/index.html'))
})

// For the puposes of uolaoding documents to the platform

app.use(express.static('public')) // to access the files in public folder


  
    //-------------------------------.

// set port, listen for requests
const PORT = process.env.PORT || 80

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})

console.log('Port-Env.:', process.env.PORT)

const db = require('./server/app/models')
const Role = db.role

db.sequelize.sync().then(() => {
  // db.sequelize.sync({force: true}).then(() => {
  console.log('Drop and Resync Db')
  // initial();     // Run this first time only
})

require('./server/app/routes/auth.routes')(app)
require('./server/app/routes/user.routes')(app)
require('./server/app/routes/all.routes')(app)
require('./server/app/routes/summary.routes')(app)
require('./server/app/routes/household.routes')(app)
require('./server/app/routes/role.routes')(app)
require('./server/app/routes/collector.routes')(app)
require('./server/app/routes/grievance.routes')(app)

// set port, listen for requests