const { Sequelize } = require('sequelize');
const config = require('./app/config/db.config-local'); // Use your appropriate config

// Create database connection
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  port: config.PORT,
  dialect: config.dialect,
  logging: console.log
});

async function runChatMigration() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Creating chat tables...');

    // Create chat_messages table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create chat_message_status table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_message_status (
        id SERIAL PRIMARY KEY,
        message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        UNIQUE(message_id, user_id)
      );
    `);

    // Create user_status table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_status (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'offline',
        last_seen TIMESTAMP DEFAULT NOW(),
        is_online BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_message_status_message_user ON chat_message_status(message_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_user_status_user ON user_status(user_id);
    `);

    console.log('✅ Chat tables created successfully!');
    console.log('Tables created:');
    console.log('- chat_messages');
    console.log('- chat_message_status');
    console.log('- user_status');

  } catch (error) {
    console.error('❌ Error creating chat tables:', error);
  } finally {
    await sequelize.close();
  }
}

runChatMigration();
