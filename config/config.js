require('dotenv').config();

const db = {
  username: process.env.VUE_APP_USER,
  password: process.env.VUE_APP_PASSWORD,
  database: process.env.VUE_APP_DB,
  host: process.env.VUE_APP_DB_HOST || 'localhost',
  port: Number(process.env.VUE_APP_DB_PORT) || 5432,
  dialect: 'postgres',
};

if (['1', 'true', 'yes'].includes(String(process.env.VUE_APP_DB_SSL || '').toLowerCase())) {
  db.dialectOptions = {
    ssl: { require: true, rejectUnauthorized: false },
  };
}

// Same .env creds for any NODE_ENV (development, DEV, production, etc.)
module.exports = new Proxy(
  { development: db, production: db },
  { get: (target, key) => target[key] ?? db }
);
