const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
var corsOptions = {
  origin: 'http://localhost:4000'
}
const path = require('path')
const fileUpload = require('express-fileupload')

 


const envt = 'DEV'   // PROD
 if (envt==='DEV') {
// Switch off for prodcution 
console.log("DEV: Switching on dotenv")
 
const dotenv = require('dotenv')
dotenv.config() 
 }
 

app.use(cors(corsOptions))
// app.use(cors()) 

// middle ware
// app.use(express.static('public')); //to access the files in public folder
// app.use(cors()); // it enables all cors requests
app.use(fileUpload())

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

function initial() {
  Role.create({
    id: 1,
    name: 'admin'
  })
  Role.create({
    id: 2,
    name: 'moderator'
  })
  Role.create({
    id: 3,
    name: 'editor'
  })

  Role.create({
    id: 4,
    name: 'user'
  })

  Role.create({
    id: 5,
    name: 'county_admin'
  })

  Role.create({
    id: 6,
    name: 'county_mon'
  })

  Role.create({
    id: 7,
    name: 'county_staff'
  })

  Role.create({
    id: 8,
    name: 'settlement_sec'
  })

  Role.create({
    id: 9,
    name: 'senior_staff'
  })

  Role.create({
    id: 10,
    name: 'sud_staff'
  })

  Role.create({
    id: 11,
    name: 'kisip_staff'
  })

  Role.create({
    id: 12,
    name: 'consultant'
  })

  Role.create({
    id: 13,
    name: 'partner_staff'
  })

  Role.create({
    id: 14,
    name: 'public'
  })

  Role.create({
    id: 15,
    name: 'guest'
  })
}

require('./server/app/routes/auth.routes')(app)
require('./server/app/routes/user.routes')(app)
require('./server/app/routes/all.routes')(app)
require('./server/app/routes/summary.routes')(app)
require('./server/app/routes/household.routes')(app)

// set port, listen for requests
