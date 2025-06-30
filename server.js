const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const fs = require('fs');

var corsOptions = {
  origin: ['http://localhost','http://localhost:4000', 'capacitor://localhost',   'http://localhost:3000','http://localhost:8100','http://localhost:8080', '*',
     'https://collector.kesmis.go.ke','https://kesmis.go.ke:8080', 'http://kesmis.go.ke:8080']
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

// parse requests of content-type - application/json
app.use(bodyParser.json({ limit: '200mb' }))
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))

app.use(express.static(path.join(__dirname, '/dist')))
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/dist/index.html'))
})

app.use(express.static('public')) // to access the files in public folder

const PORT = process.env.PORT || 80

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})

console.log('Port-Env.:', process.env.PORT)

const db = require('./server/app/models')
const Role = db.role
db.sequelize.sync().then(() => {
  console.log('Drop and Resync Db')
})

require('./server/app/routes/auth.routes')(app)
require('./server/app/routes/user.routes')(app)
require('./server/app/routes/all.routes')(app)
require('./server/app/routes/summary.routes')(app)
require('./server/app/routes/household.routes')(app)
require('./server/app/routes/role.routes')(app)
require('./server/app/routes/collector.routes')(app)
require('./server/app/routes/grievance.routes')(app)
require('./server/app/routes/pdf.routes')(app)
require('./server/app/routes/geoserver.routes')(app)
require('./server/app/routes/project.routes')(app)

// Swagger UI setup (serving only)
const swaggerUi = require('swagger-ui-express');
let swaggerFile;
try {
  swaggerFile = require('./swagger.json');
} catch (error) {
  swaggerFile = {
    openapi: '3.0.0',
    info: {
      title: 'Plus Admin API',
      description: 'API documentation for Plus Admin application',
      version: '1.0.0'
    },
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  };
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, {
  customCss: '.swagger-ui .auth-wrapper { display: none !important; }'
}));