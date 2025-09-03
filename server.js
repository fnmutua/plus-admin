// Add ReadableStream polyfill for Node.js compatibility with LangChain
if (typeof globalThis.ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web');
  globalThis.ReadableStream = ReadableStream;
}

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

// Log environment variables on load
console.log('=== ENVIRONMENT VARIABLES LOADED ===');
console.log('Env file path:', envFilePath);
console.log('File exists:', require('fs').existsSync(envFilePath));

// Main Database Variables
console.log('Main DB - HOST:', process.env.VUE_APP_DB_HOST);
console.log('Main DB - USER:', process.env.VUE_APP_USER);
console.log('Main DB - DB:', process.env.VUE_APP_DB);
console.log('Main DB - PORT:', process.env.VUE_APP_DB_PORT);
console.log('Main DB - PASSWORD:', process.env.VUE_APP_PASSWORD ? '***SET***' : 'NOT SET');

// AI Database Variables
console.log('AI DB - HOST:', process.env.AI_DB_HOST);
console.log('AI DB - USER:', process.env.AI_DB_USER);
console.log('AI DB - NAME:', process.env.AI_DB_NAME);
console.log('AI DB - PORT:', process.env.AI_DB_PORT);
console.log('AI DB - PASSWORD:', process.env.AI_DB_PASSWORD ? '***SET***' : 'NOT SET');

// AI Configuration Variables
console.log('AI Provider:', process.env.AI_PROVIDER);
console.log('AI Chunk Size:', process.env.CHUNK_SIZE);
console.log('AI Overlap Size:', process.env.OVERLAP_SIZE);
console.log('AI Max Chunks:', process.env.MAX_CHUNKS_PER_DOCUMENT);
console.log('AI Disable Embeddings:', process.env.DISABLE_EMBEDDINGS);

// API Keys (only show if configured)
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? '***CONFIGURED***' : 'NOT CONFIGURED');
console.log('XAI API Key:', process.env.XAI_API_KEY ? '***CONFIGURED***' : 'NOT CONFIGURED');
console.log('Ollama Base URL:', process.env.OLLAMA_BASE_URL);

// Server Configuration
console.log('Server PORT:', process.env.PORT);
console.log('=====================================');

 }
 
app.use(cors(corsOptions))

// parse requests of content-type - application/json
app.use(bodyParser.json({ limit: '200mb' }))
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }))

app.use(express.static(path.join(__dirname, '/dist')))
app.use(express.static('public'))

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '/dist/index.html')
  
  // Check if index.html exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    // Serve fallback HTML file
    const fallbackPath = path.join(__dirname, '/public/fallback.html')
    
    if (fs.existsSync(fallbackPath)) {
      console.warn('index.html not found, serving fallback page')
      res.status(503).sendFile(fallbackPath)
    } else {
      // Last resort - simple text response
      console.error('Both index.html and fallback.html not found!')
      res.status(503).send(`
        <h1>KeSMIS</h1>
        <p>System maintenance in progress. Please try again later.</p>
        <a href="javascript:location.reload()">Try Again</a>
      `)
    }
  }
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
require('./server/app/routes/chat.routes')(app)
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
  /* Show auth wrapper for token input */
  .swagger-ui .auth-wrapper { 
    display: block !important; 
    margin: 20px 0 !important;
    padding: 15px !important;
    background: #f8f9fa !important;
    border: 1px solid #e9ecef !important;
    border-radius: 5px !important;
  }
  
  .swagger-ui .auth-wrapper .authorize {
    background: #667eea !important;
    color: white !important;
    border: none !important;
    padding: 8px 16px !important;
    border-radius: 4px !important;
    cursor: pointer !important;
  }
  
  .swagger-ui .auth-wrapper .authorize:hover {
    background: #5a6fd8 !important;
  }
  
  .swagger-ui .auth-wrapper input[type="text"] {
    border: 1px solid #ced4da !important;
    border-radius: 4px !important;
    padding: 8px 12px !important;
    width: 100% !important;
    margin: 5px 0 !important;
  }
  
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

 

 