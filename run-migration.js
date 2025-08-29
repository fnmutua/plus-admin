const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const config = {
  HOST: process.env.VUE_APP_DB_HOST,
  USER: process.env.VUE_APP_USER,
  PASSWORD: process.env.VUE_APP_PASSWORD,
  DB: process.env.VUE_APP_DB,
  PORT: process.env.VUE_APP_DB_PORT,
  dialect: "postgres"
};

async function runMigration() {
  const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    port: config.PORT,
    dialect: config.dialect,
    logging: console.log
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Add downloadCount column
    await sequelize.query(`
      ALTER TABLE "public"."document" 
      ADD COLUMN IF NOT EXISTS "downloadCount" INTEGER NOT NULL DEFAULT 0;
    `);
    console.log('✅ downloadCount column added successfully.');

    // Add index for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_document_download_count" 
      ON "public"."document" ("downloadCount");
    `);
    console.log('✅ Index created successfully.');

    // Verify the column was added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'document' AND column_name = 'downloadCount';
    `);
    
    if (results.length > 0) {
      console.log('✅ Column verification successful:', results[0]);
    } else {
      console.log('❌ Column not found after migration.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

runMigration();
