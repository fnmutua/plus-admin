module.exports = {
  HOST: process.env.VUE_APP_DB_HOST,
  USER: process.env.VUE_APP_USER,
  PASSWORD: process.env.VUE_APP_PASSWORD,
  DB: process.env.VUE_APP_DB,
  PORT:process.env.VUE_APP_DB_PORT,
  dialect: "postgres",
  pool: {
    // Postgres here is capped at max_connections=100 and this pool config is
    // shared by multiple processes (main server, tables.controller.js's own
    // Sequelize instance, websocket-chat.js) — 500 let any one of them alone
    // exhaust every connection Postgres had, throwing "sorry, too many
    // clients already" for everyone else, including unrelated JWT checks.
    max: 20,
    min: 2,
    acquire: 60000,
    idle: 10000
  }
};