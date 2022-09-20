module.exports = {
    HOST: 'collect.casconsultants.co.ke',
    USER: 'postgres',
    PASSWORD: 'MySt0ngDBP@ss-Bit@3%^8',
    DB: 'kisip',
    PORT: 5433,
    dialect: "postgres",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };