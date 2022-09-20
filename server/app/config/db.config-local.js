module.exports = {
  HOST: "localhost",
  USER: "postgres",
  PASSWORD: "Admin@2011",
  DB: "kisip",
  PORT: 5432,
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};