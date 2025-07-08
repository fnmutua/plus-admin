const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'document_ai',
    password: process.env.DB_PASSWORD || '***REDACTED***',
    port: process.env.DB_PORT || 5445,
});

async function migrateEmbeddings() {
    try {
        console.log('🔄 Starting embeddings migration with enhanced source tracking...');
        
        // Check if we need to migrate
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'embeddings'
            );
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ Embeddings table does not exist. Run reset-database.js first.');
            return;
        }
        
        // Check if migration is already done
        const hasNewColumns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'embeddings' 
            AND column_name IN ('source_type', 'source_config', 'metadata', 'updated_at', 'source_name', 'source_identifier')
        `);
        
        if (hasNewColumns.rows.length >= 6) {
            console.log('✅ Migration already completed. Embeddings table is up to date.');
            return;
        }
        
        console.log('📋 Adding new columns to embeddings table...');
        
        // Add new columns to existing embeddings table with enhanced source tracking
        await pool.query(`
            ALTER TABLE embeddings 
            ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'ollama',
            ADD COLUMN IF NOT EXISTS source_name VARCHAR(255) DEFAULT 'unknown',
            ADD COLUMN IF NOT EXISTS source_identifier VARCHAR(255) DEFAULT 'unknown',
            ADD COLUMN IF NOT EXISTS source_config JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        
        console.log('✅ New columns added successfully');
        
        // Show current embeddings structure (before migration)
        console.log('\n📊 Current embeddings structure (before migration):');
        const beforeMigration = await pool.query(`
            SELECT id, chunk_id, model_name, created_at, 
                   LENGTH(embedding_vector::text) as vector_length
            FROM embeddings 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        if (beforeMigration.rows.length > 0) {
            console.log('   First 10 embeddings:');
            beforeMigration.rows.forEach((row, index) => {
                console.log(`   ${index + 1}. ID: ${row.id.substring(0, 8)}... | Model: ${row.model_name} | Vector: ${row.vector_length} chars | Created: ${row.created_at}`);
            });
        } else {
            console.log('   No embeddings found in table');
        }
        
        // Create new indexes
        console.log('📊 Creating new indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_embeddings_source_type ON embeddings(source_type);
            CREATE INDEX IF NOT EXISTS idx_embeddings_source_name ON embeddings(source_name);
            CREATE INDEX IF NOT EXISTS idx_embeddings_source_identifier ON embeddings(source_identifier);
            CREATE INDEX IF NOT EXISTS idx_embeddings_model_name ON embeddings(model_name);
        `);
        
        // Update existing embeddings with enhanced source information
        console.log('🔄 Updating existing embeddings with enhanced source information...');
        
        // First, let's see what documents exist to map them properly
        const documents = await pool.query(`
            SELECT id, filename, file_type, file_size 
            FROM documents 
            ORDER BY created_at DESC
        `);
        
        console.log(`📄 Found ${documents.rows.length} documents to map embeddings to`);
        
        // Update embeddings with proper source mapping
        let updatedCount = 0;
        
        for (const doc of documents.rows) {
            const updateResult = await pool.query(`
                UPDATE embeddings 
                SET 
                    source_type = 'ollama',
                    source_name = $1,
                    source_identifier = $2,
                    source_config = $3::jsonb,
                    metadata = $4::jsonb,
                    updated_at = created_at
                WHERE chunk_id IN (
                    SELECT id FROM document_chunks WHERE document_id = $5
                ) AND (source_type IS NULL OR source_type = 'ollama')
            `, [
                `document_${doc.file_type}`,
                doc.filename,
                JSON.stringify({
                    url: "http://localhost:11434",
                    model: "all-minilm",
                    document_id: doc.id,
                    document_type: doc.file_type
                }),
                JSON.stringify({
                    migrated: true,
                    migration_date: new Date().toISOString(),
                    original_document: {
                        id: doc.id,
                        filename: doc.filename,
                        file_type: doc.file_type,
                        file_size: doc.file_size
                    }
                }),
                doc.id
            ]);
            
            updatedCount += updateResult.rowCount;
        }
        
        // Update any remaining embeddings that don't have document associations
        const remainingUpdate = await pool.query(`
            UPDATE embeddings 
            SET 
                source_type = 'ollama',
                source_name = 'unknown_document',
                source_identifier = 'migrated_legacy',
                source_config = $1::jsonb,
                metadata = $2::jsonb,
                updated_at = created_at
            WHERE source_type IS NULL OR source_type = 'ollama'
        `, [
            JSON.stringify({
                url: "http://localhost:11434",
                model: "all-minilm",
                note: "legacy_migration"
            }),
            JSON.stringify({
                migrated: true,
                migration_date: new Date().toISOString(),
                note: "no_document_association"
            })
        ]);
        
        updatedCount += remainingUpdate.rowCount;
        
        console.log(`✅ Updated ${updatedCount} existing embeddings with enhanced source information`);
        
        // Show embeddings structure after migration
        console.log('\n📊 Embeddings structure after migration:');
        const afterMigration = await pool.query(`
            SELECT id, chunk_id, model_name, source_type, source_name, source_identifier, created_at, updated_at,
                   LENGTH(embedding_vector::text) as vector_length,
                   metadata->>'migrated' as is_migrated
            FROM embeddings 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        if (afterMigration.rows.length > 0) {
            console.log('   First 10 embeddings (after migration):');
            afterMigration.rows.forEach((row, index) => {
                const migrated = row.is_migrated === 'true' ? '✅' : '❌';
                console.log(`   ${index + 1}. ID: ${row.id.substring(0, 8)}... | Model: ${row.model_name} | Source: ${row.source_type} | Name: ${row.source_name} | Identifier: ${row.source_identifier} | Vector: ${row.vector_length} chars | Migrated: ${migrated} | Created: ${row.created_at}`);
            });
        } else {
            console.log('   No embeddings found in table');
        }
        
        // Show source distribution
        console.log('\n📊 Source distribution after migration:');
        const sourceDistribution = await pool.query(`
            SELECT source_type, source_name, COUNT(*) as count
            FROM embeddings 
            GROUP BY source_type, source_name
            ORDER BY count DESC
        `);
        
        sourceDistribution.rows.forEach(row => {
            console.log(`   ${row.source_type}/${row.source_name}: ${row.count} embeddings`);
        });
        
        // Verify migration
        const embeddingsCount = await pool.query('SELECT COUNT(*) as count FROM embeddings');
        const documentsCount = await pool.query('SELECT COUNT(*) as count FROM documents');
        
        console.log('\n🎉 Migration completed successfully!');
        console.log(`📊 Results:`);
        console.log(`   - Embeddings preserved: ${embeddingsCount.rows[0].count}`);
        console.log(`   - Documents found: ${documentsCount.rows[0].count}`);
        console.log(`   - All existing data maintained`);
        
        console.log('\n💡 Next steps:');
        console.log('   - Review source_name and source_identifier mappings');
        console.log('   - Consider adding more specific source tracking for different document types');
        console.log('   - Test embedding generation and retrieval with new source tracking');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the migration
migrateEmbeddings(); 