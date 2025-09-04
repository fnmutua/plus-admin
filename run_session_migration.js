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

async function runSessionMigration() {
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

    console.log('🔄 Adding session duration columns to logs table...');
    
    // Add loginTime column
    await sequelize.query(`
      ALTER TABLE "public"."logs" 
      ADD COLUMN IF NOT EXISTS "loginTime" TIMESTAMP;
    `);
    console.log('✅ loginTime column added successfully.');

    // Add logoutTime column
    await sequelize.query(`
      ALTER TABLE "public"."logs" 
      ADD COLUMN IF NOT EXISTS "logoutTime" TIMESTAMP;
    `);
    console.log('✅ logoutTime column added successfully.');

    // Add sessionDuration column
    await sequelize.query(`
      ALTER TABLE "public"."logs" 
      ADD COLUMN IF NOT EXISTS "sessionDuration" INTEGER;
    `);
    console.log('✅ sessionDuration column added successfully.');

    // Add sessionDurationFormatted column
    await sequelize.query(`
      ALTER TABLE "public"."logs" 
      ADD COLUMN IF NOT EXISTS "sessionDurationFormatted" VARCHAR(50);
    `);
    console.log('✅ sessionDurationFormatted column added successfully.');

    // Add comments to columns
    await sequelize.query(`
      COMMENT ON COLUMN "public"."logs"."loginTime" IS 'Time when user logged in (for session duration calculation)';
    `);
    console.log('✅ Added comment to loginTime column');
    
    await sequelize.query(`
      COMMENT ON COLUMN "public"."logs"."logoutTime" IS 'Time when user logged out';
    `);
    console.log('✅ Added comment to logoutTime column');
    
    await sequelize.query(`
      COMMENT ON COLUMN "public"."logs"."sessionDuration" IS 'Session duration in seconds';
    `);
    console.log('✅ Added comment to sessionDuration column');
    
    await sequelize.query(`
      COMMENT ON COLUMN "public"."logs"."sessionDurationFormatted" IS 'Session duration in human readable format (e.g., "2h 30m 15s")';
    `);
    console.log('✅ Added comment to sessionDurationFormatted column');

       // Add logoutTime column
       await sequelize.query(`
        ALTER TABLE "public"."users" 
        ADD COLUMN IF NOT EXISTS "organization_name" VARCHAR(255) DEFAULT 'unspecified';
      `);
      console.log('✅ organization_name column added successfully.');
  
      // Add logoutTime column
      await sequelize.query(`
        ALTER TABLE "public"."users" 
        ADD COLUMN IF NOT EXISTS "country_name" VARCHAR(255) DEFAULT 'KE';
      `);
      console.log('✅ country_name column added successfully.');
  

    // Verify the columns were added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'logs' 
      AND column_name IN ('loginTime', 'logoutTime', 'sessionDuration', 'sessionDurationFormatted')
      ORDER BY column_name;
    `);
    
    if (results.length === 4) {
      console.log('✅ All columns verified successfully:');
      results.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('❌ Some columns not found after migration.');
      console.log('Expected 4 columns, found:', results.length);
    }

    console.log('🎉 Session duration migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('🔧 Database connection details:', {
      host: config.HOST,
      user: config.USER,
      database: config.DB,
      port: config.PORT
    });
    console.error('💡 Make sure your database is running and environment variables are set correctly');
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the migration
runSessionMigration();
