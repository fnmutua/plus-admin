module.exports = {
  HOST: process.env.VUE_APP_DB_HOST,
  USER: process.env.VUE_APP_USER,
  PASSWORD: process.env.VUE_APP_PASSWORD,
  DB: process.env.VUE_APP_DB,
  PORT:process.env.VUE_APP_DB_PORT,
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};