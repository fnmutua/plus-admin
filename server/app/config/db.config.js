module.exports = {
  HOST: process.env.VUE_APP_DB_HOST,
  USER: process.env.VUE_APP_USER,
  PASSWORD: process.env.VUE_APP_PASSWORD,
  DB: process.env.VUE_APP_DB,
  PORT:process.env.VUE_APP_DB_PORT,
  dialect: "postgres",
  pool: {
    max: 500,
    min: 2,
    acquire: 60000,
    idle: 10000
  }
};