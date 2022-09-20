const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
var corsOptions = {
  origin: "http://localhost:8080"
};



const dotenv = require('dotenv');
dotenv.config();


app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(bodyParser.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});
// set port, listen for requests
const PORT = process.env.VUE_APP_PORT || 8084;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

const pass =process.env.VUE_APP_API_BASE_URL

 
console.log('Port-Env.:', process.env.VUE_APP_PORT )
 

const db = require("./app/models");
const Role = db.role;

db.sequelize.sync().then(() => {
//db.sequelize.sync({force: true}).then(() => {
  console.log('Drop and Resync Db');
//initial();     // Run this first time only 
});
 
function initial() {
  Role.create({
    id: 4,
    name: "user"
  });
 
  Role.create({
    id: 2,
    name: "moderator"
  });
  Role.create({
    id: 3,
    name: "editor"
  });
  Role.create({
    id: 1,
    name: "admin"
  });
}

require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require('./app/routes/all.routes')(app);

// set port, listen for requests