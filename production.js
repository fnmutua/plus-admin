// Add fetch polyfill for Node.js compatibility (Node.js 20+ has built-in fetch)
if (typeof globalThis.fetch === 'undefined') {
  // For older Node.js versions, use a simple polyfill
  globalThis.fetch = async (url, options = {}) => {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(JSON.parse(data))
          });
        });
      });
      
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };
}

const express = require('express');
const bodyParser = require('body-parser');
//const cors = require('cors');
const app = express();
const fs = require('fs');
const https = require('https');

// ... Your other code ...
 // Add ReadableStream setup for Node.js v20
const { ReadableStream } = require('stream/web');
globalThis.ReadableStream = ReadableStream;
console.log('ReadableStream defined:', !!globalThis.ReadableStream); // Debug log
 

const path = require('path');
const fileUpload = require('express-fileupload');
const auditContext = require('./server/app/middleware/auditContext')

const uploadsDir = path.join(__dirname, '..', 'uploads'); // path to the uploads folder
if (!fs.existsSync(uploadsDir)) {
  // if uploads folder does not exist, create it
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const envt = 'production'; // PROD
if (envt === 'DEV') {
  // Switch off for production 
  console.log("DEV: Switching on dotenv");
  console.log('Port-VITE_APP_HOST.:', process.env.PORT, process.env.VITE_APP_HOST);
 
}
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });


// middle ware
app.use(bodyParser.json({ limit: '10gb' }));
app.use(bodyParser.urlencoded({ limit: '10gb', extended: true }));
app.use(auditContext)

// Brute-force protection on login and OTP endpoints
const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' }
})

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP attempts. Please request a new code.' }
})

app.use('/api/auth/signin', loginLimiter)
app.use('/api/auth/guest', loginLimiter)
app.use('/api/app/signin', loginLimiter)
app.use('/api/app/verify', otpLimiter)

// simple route
app.use(express.static(path.join(__dirname, '/dist')));

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
});

app.use(express.static('public'));


// Log environment variables on load
console.log('=== ENVIRONMENT VARIABLES LOADED ===');
 
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
















const privateKeyPath = '/etc/letsencrypt/live/kesmis.go.ke/privkey.pem';
const certificatePath = '/etc/letsencrypt/live/kesmis.go.ke/fullchain.pem';

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');

const credentials = { key: privateKey, cert: certificate };

// Use HTTPS.createServer to create the server with your app's settings.
const httpsServer = https.createServer(credentials, app);

// Change the port to 443 (the default HTTPS port).
httpsServer.listen(8443, () => {
  console.log('HTTPS Server running on port 8443');
});


const db = require('./server/app/models');
const Role = db.role;

db.sequelize.sync().then(() => {
  // db.sequelize.sync({force: true}).then(() => {
  console.log('Drop and Resync Db');
  // initial();     // Run this first time only
});


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
require('./server/app/routes/chat.routes')(app)
require('./server/app/routes/household.routes')(app)
require('./server/app/routes/role.routes')(app)
require('./server/app/routes/collector.routes')(app)
require('./server/app/routes/grievance.routes')(app)
require('./server/app/routes/incident.routes')(app)
require('./server/app/routes/pdf.routes')(app)
require('./server/app/routes/geoserver.routes')(app)
require('./server/app/routes/project.routes')(app)
require('./server/app/routes/videoStream.routes')(app)
require('./server/app/routes/adminunits.routes')(app)
require('./server/app/routes/settings.routes')(app)
require('./server/app/routes/climate_assessment.routes')(app)
require('./server/app/routes/audit.routes')(app)
require('./server/app/routes/monitoring.routes')(app)

// set port, listen for requests


 
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

// Catch-all handler for SPA routing - serve index.html for any route not handled by API
app.get('*', (req, res) => {
  // Skip API routes and swagger routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/api-docs') || req.path.startsWith('/swagger')) {
    return res.status(404).json({ message: 'API endpoint not found' })
  }
  
  const indexPath = path.join(__dirname, '/dist/index.html')
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    // Serve fallback HTML file
    const fallbackPath = path.join(__dirname, '/public/fallback.html')
    
    if (fs.existsSync(fallbackPath)) {
      console.warn(`index.html not found for route ${req.path}, serving fallback page`)
      res.status(503).sendFile(fallbackPath)
    } else {
      // Last resort - simple text response
      console.error(`Both index.html and fallback.html not found for route ${req.path}!`)
      res.status(503).send(`
        <h1>KeSMIS</h1>
        <p>System maintenance in progress. Please try again later.</p>
        <a href="javascript:location.reload()">Try Again</a>
      `)
    }
  }
});