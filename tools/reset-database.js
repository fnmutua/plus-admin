const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'document_ai',
    password: process.env.DB_PASSWORD || '***REDACTED***',
    port: process.env.DB_PORT || 5445,
});

async function resetDatabase() {
    try {
        console.log('🗑️  Resetting database...');
        
        // Drop all existing tables (in correct order due to foreign key constraints)
        console.log('📋 Dropping existing tables...');
        
        await pool.query('DROP TABLE IF EXISTS embeddings CASCADE');
        await pool.query('DROP TABLE IF EXISTS document_chunks CASCADE');
        await pool.query('DROP TABLE IF EXISTS conversations CASCADE');
        await pool.query('DROP TABLE IF EXISTS documents CASCADE');
        await pool.query('DROP TABLE IF EXISTS embedding_sources CASCADE');
        
        console.log('✅ All existing tables dropped');
        
        // Try to install pgvector extension
        let pgvectorAvailable = false;
        try {
            await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
            console.log('✅ pgvector extension installed');
            pgvectorAvailable = true;
        } catch (error) {
            console.warn('⚠️ pgvector extension not available:', error.message);
            console.log('💡 The system will use keyword-based search instead of vector similarity');
        }
        
        // Create documents table
        console.log('📄 Creating documents table...');
        await pool.query(`
            CREATE TABLE documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                file_size BIGINT NOT NULL,
                content TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create document chunks table
        console.log('📝 Creating document_chunks table...');
        await pool.query(`
            CREATE TABLE document_chunks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                start_position INTEGER,
                end_position INTEGER,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create embeddings table - matching tables controller exactly
        console.log('🔢 Creating embeddings table...');
        if (pgvectorAvailable) {
            await pool.query(`
                CREATE TABLE embeddings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
                    embedding_vector vector(384),
                    model_name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Embeddings table created with pgvector support (matching tables controller)');
        } else {
            await pool.query(`
                CREATE TABLE embeddings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
                    embedding_vector REAL[],
                    model_name VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Embeddings table created with REAL[] array support (matching tables controller)');
        }
        
        // Create conversations table
        console.log('💬 Creating conversations table...');
        await pool.query(`
            CREATE TABLE conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id VARCHAR(255) NOT NULL,
                user_message TEXT NOT NULL,
                assistant_message TEXT NOT NULL,
                tokens_used INTEGER DEFAULT 0,
                model_used VARCHAR(100),
                sources JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Remove embedding_sources table - not used by tables controller
        
        // Create indexes for better performance
        console.log('📊 Creating indexes...');
        await pool.query(`
            CREATE INDEX idx_documents_filename ON documents(filename);
            CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
            CREATE INDEX idx_embeddings_chunk_id ON embeddings(chunk_id);
            CREATE INDEX idx_embeddings_model_name ON embeddings(model_name);
            CREATE INDEX idx_conversations_session_id ON conversations(session_id);
            CREATE INDEX idx_conversations_created_at ON conversations(created_at);
        `);
        
        // Create text search index for keyword fallback
        await pool.query(`
            CREATE INDEX idx_document_chunks_content_gin 
            ON document_chunks USING gin(to_tsvector('english', content))
        `);
        
        // Create vector index only if pgvector is available
        if (pgvectorAvailable) {
            try {
                await pool.query(`
                    CREATE INDEX idx_embeddings_vector 
                    ON embeddings 
                    USING ivfflat (embedding_vector vector_cosine_ops)
                    WITH (lists = 100)
                `);
                console.log('✅ Vector similarity index created');
            } catch (error) {
                console.warn('⚠️ Could not create vector index:', error.message);
            }
        }
        
        console.log('\n🎉 Database reset completed successfully!');
        console.log('📊 Tables created:');
        console.log('   - documents');
        console.log('   - document_chunks');
        console.log('   - embeddings (matching tables controller)');
        console.log('   - conversations');
        
        if (pgvectorAvailable) {
            console.log('🚀 Vector similarity search enabled');
            console.log('   - 384-dimensional vectors (all-minilm model)');
            console.log('   - Compatible with tables controller embedding format');
        } else {
            console.log('🔍 Keyword-based search enabled (pgvector not available)');
        }
        
        // Test the connection
        const testResult = await pool.query('SELECT COUNT(*) as count FROM documents');
        console.log(`\n✅ Database connection test: ${testResult.rows[0].count} documents found`);
        
    } catch (error) {
        console.error('❌ Database reset failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the reset
resetDatabase(); 