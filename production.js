const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const fs = require('fs');
const https = require('https');

// ... Your other code ...

const corsOptions = {
  //origin: ['http://localhost', 'http://localhost:4000', 'http://localhost:3000', 'http://localhost:8100', 'http://localhost:8080', '*']
  origin: ['http://localhost','https://localhost','http://localhost:4000', 'http://localhost:3000','http://localhost:8100','http://localhost:8080','https://localhost:8100', '*']

};



const path = require('path');
const fileUpload = require('express-fileupload');

const uploadsDir = path.join(__dirname, '..', 'uploads'); // path to the uploads folder
if (!fs.existsSync(uploadsDir)) {
  // if uploads folder does not exist, create it
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const envt = 'DEV'; // PROD
if (envt === 'DEV') {
  // Switch off for production 
  console.log("DEV: Switching on dotenv");
  console.log('Port-VITE_APP_HOST.:', process.env.PORT, process.env.VITE_APP_HOST);

  const dotenv = require('dotenv');
  dotenv.config();
}

app.use(cors(corsOptions));
// app.use(cors()) 

// middle ware
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

// simple route
app.use(express.static(path.join(__dirname, '/dist-pro')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/dist-pro/index.html'));
});

app.use(express.static('public'));

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
require('./server/app/routes/household.routes')(app)
require('./server/app/routes/role.routes')(app)
require('./server/app/routes/collector.routes')(app)
require('./server/app/routes/grievance.routes')(app)
require('./server/app/routes/pdf.routes')(app)

// set port, listen for requests
