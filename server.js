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
      title: 'KeSMIS API',
      description: 'API documentation for KeSMIS application',
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

// Custom CSS for Swagger UI header styling
const customCss = `
  .swagger-ui .auth-wrapper { display: none !important; }
  
  /* Hide Swagger UI logo and default branding */
  .swagger-ui .topbar .link { display: none !important; }
  .swagger-ui .topbar .download-url-wrapper .select-label { display: none !important; }
  .swagger-ui .topbar .download-url-wrapper .select { display: none !important; }
  .swagger-ui .topbar .download-url-wrapper .servers-title { display: none !important; }
  .swagger-ui .topbar .download-url-wrapper .servers { display: none !important; }
  
  /* Custom header styling */
  .swagger-ui .topbar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    padding: 20px 0 !important;
  }
  
  .swagger-ui .topbar .download-url-wrapper {
    display: none !important;
  }
  
  .swagger-ui .info .title {
    color: #333 !important;
    font-size: 36px !important;
    font-weight: 600 !important;
    margin-bottom: 10px !important;
  }
  
  .swagger-ui .info .title small {
    color: #666 !important;
    font-size: 16px !important;
  }
  
  .swagger-ui .info .description {
    font-size: 16px !important;
    line-height: 1.6 !important;
    color: #555 !important;
  }
  
  .swagger-ui .info .contact {
    margin-top: 15px !important;
  }
  
  .swagger-ui .info .contact a {
    color: #667eea !important;
    text-decoration: none !important;
  }
  
  .swagger-ui .info .contact a:hover {
    text-decoration: underline !important;
  }
  
  /* Add a custom logo or branding */
  .swagger-ui .topbar::before {
    content: "🚀 KeSMIS API Documentation";
    color: white;
    font-size: 24px;
    font-weight: bold;
    display: block;
    text-align: center;
    margin-bottom: 10px;
  }
`;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, {
  customCss: customCss,
  customSiteTitle: "KeSMIS API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  },
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js'
  ]
}));

// Alternative custom Swagger UI route
app.get('/api-docs-custom', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/swagger-template.html'));
});

// Serve swagger.json for the custom template
app.get('/swagger.json', (req, res) => {
  res.json(swaggerFile);
});