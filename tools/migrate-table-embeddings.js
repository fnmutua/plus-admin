const { Pool } = require('pg');
require('dotenv').config();

// Configuration
const config = {
    // Source database (your main application database)
    sourceDb: {
        user:   'postgres',
        host:   'localhost',
        database:   'kisip',
        password:  '***REDACTED***',
        port:   5432,
    },
    // Target database (embeddings database)
    targetDb: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'document_ai',
        password: process.env.DB_PASSWORD || '***REDACTED***',
        port: process.env.DB_PORT || 5445,
    },
    // Tables to migrate (add your table names here)
    tablesToMigrate: [
        'settlement',
         'project',
         // Add more tables as needed
    ],
    // Batch size for processing
    batchSize: 400,
    // Model name for embeddings (should match your AI model)
    embeddingModel: 'all-minilm',
    // Duplicate handling strategy: 'skip', 'update', or 'force'
    duplicateStrategy: 'skip'
};

// Create database connections
const sourcePool = new Pool(config.sourceDb);
const targetPool = new Pool(config.targetDb);

/**
 * Convert record to text content for embedding
 */
function convertRecordToText(record, tableName) {
    try {
        // Filter out sensitive or non-text fields
        const excludeFields = ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'geom', 'geometry'];
        const filteredData = {};
        
        Object.keys(record).forEach(key => {
            if (!excludeFields.includes(key) && record[key] !== null && record[key] !== undefined) {
                filteredData[key] = record[key];
            }
        });

        // Convert to readable text format
        const textParts = [];
        textParts.push(`Table: ${tableName}`);
        textParts.push(`Record ID: ${record.id || 'N/A'}`);
        textParts.push('');

        // Add each field as key-value pairs
        Object.keys(filteredData).forEach(key => {
            const value = filteredData[key];
            if (typeof value === 'string' && value.trim().length > 0) {
                textParts.push(`${key}: ${value}`);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                textParts.push(`${key}: ${value}`);
            } else if (typeof value === 'object' && value !== null) {
                textParts.push(`${key}: ${JSON.stringify(value)}`);
            }
        });

        return textParts.join('\n');
    } catch (error) {
        console.error('Error converting record to text:', error);
        return JSON.stringify(record, null, 2);
    }
}

/**
 * Create chunks from text content
 */
function createChunksFromText(text, maxChunkSize = 1000) {
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    
    for (const line of lines) {
        if ((currentChunk + line).length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = line + '\n';
        } else {
            currentChunk += line + '\n';
        }
    }
    
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

/**
 * Generate simple embedding (placeholder - replace with actual embedding generation)
 */
async function generateEmbedding(text) {
    // This is a placeholder - you should replace this with your actual embedding generation
    // For now, we'll create a simple hash-based vector
    const hash = text.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    // Create a simple 384-dimensional vector (matching all-minilm)
    const vector = new Array(384).fill(0);
    for (let i = 0; i < 384; i++) {
        vector[i] = Math.sin(hash + i) * 0.1;
    }
    
    return vector;
}

/**
 * Check if document already exists for a record
 */
async function checkDocumentExists(tableName, recordId) {
    const result = await targetPool.query(`
        SELECT id FROM documents 
        WHERE metadata->>'source_table' = $1 
        AND metadata->>'record_id' = $2
    `, [tableName, recordId.toString()]);
    
    return result.rows.length > 0;
}

/**
 * Save document to AI database
 */
async function saveDocumentToAI(filename, content, metadata = {}) {
    // Provide fallback for file_path when null
    const actualFilePath = `database_record_${Date.now()}`;
    
    const result = await targetPool.query(`
        INSERT INTO documents (filename, file_path, file_type, file_size, content, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id
    `, [
        filename,
        actualFilePath, // Use fallback instead of null
        '.json',
        content.length,
        content,
        JSON.stringify(metadata)
    ]);
    
    return result.rows[0].id;
}

/**
 * Update existing document
 */
async function updateDocument(documentId, content, metadata = {}) {
    await targetPool.query(`
        UPDATE documents 
        SET content = $1, metadata = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
    `, [
        content,
        JSON.stringify(metadata),
        documentId
    ]);
    
    return documentId;
}

/**
 * Get existing document ID for a record
 */
async function getExistingDocumentId(tableName, recordId) {
    const result = await targetPool.query(`
        SELECT id FROM documents 
        WHERE metadata->>'source_table' = $1 
        AND metadata->>'record_id' = $2
    `, [tableName, recordId.toString()]);
    
    return result.rows.length > 0 ? result.rows[0].id : null;
}

/**
 * Delete existing chunks and embeddings for a document
 */
async function deleteExistingChunksAndEmbeddings(documentId) {
    // Delete embeddings first (due to foreign key constraint)
    await targetPool.query(`
        DELETE FROM embeddings 
        WHERE chunk_id IN (
            SELECT id FROM document_chunks WHERE document_id = $1
        )
    `, [documentId]);
    
    // Delete chunks
    await targetPool.query(`
        DELETE FROM document_chunks WHERE document_id = $1
    `, [documentId]);
}

/**
 * Save document chunks
 */
async function saveDocumentChunks(documentId, chunks) {
    const chunkIds = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const result = await targetPool.query(`
            INSERT INTO document_chunks (document_id, chunk_index, content, metadata, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING id
        `, [
            documentId,
            i,
            chunks[i],
            JSON.stringify({ chunk_index: i, total_chunks: chunks.length })
        ]);
        
        chunkIds.push(result.rows[0].id);
    }
    
    return chunkIds;
}

/**
 * Save embeddings
 */
async function saveEmbeddings(chunkIds, embeddingVectors) {
    for (let i = 0; i < chunkIds.length; i++) {
        await targetPool.query(`
            INSERT INTO embeddings (
                chunk_id, embedding_vector, model_name, source_type, source_name, 
                source_identifier, source_config, metadata, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            chunkIds[i],
            JSON.stringify(embeddingVectors[i]),
            config.embeddingModel,
            'database_table',
            'table_migration',
            `migrated_${Date.now()}`,
            JSON.stringify({
                migration_date: new Date().toISOString(),
                batch_size: config.batchSize
            }),
            JSON.stringify({
                migrated: true,
                migration_date: new Date().toISOString(),
                chunk_index: i
            })
        ]);
    }
}

/**
 * Migrate a single table
 */
async function migrateTable(tableName) {
    console.log(`\n🔄 Migrating table: ${tableName}`);
    
    try {
        // Get total count
        const countResult = await sourcePool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const totalRecords = parseInt(countResult.rows[0].count);
        
        if (totalRecords === 0) {
            console.log(`   ⚠️  No records found in table ${tableName}`);
            return { success: true, processed: 0, errors: 0 };
        }
        
        console.log(`   📊 Found ${totalRecords} records to process`);
        
        let processed = 0;
        let errors = 0;
        let offset = 0;
        
        while (offset < totalRecords) {
            // Fetch batch of records
            const records = await sourcePool.query(`
                SELECT * FROM "${tableName}" 
                ORDER BY id 
                LIMIT $1 OFFSET $2
            `, [config.batchSize, offset]);
            
            console.log(`   📦 Processing batch ${Math.floor(offset / config.batchSize) + 1} (${records.rows.length} records)`);
            
            for (const record of records.rows) {
                try {
                    // Convert record to text
                    const recordText = convertRecordToText(record, tableName);
                    
                    if (!recordText || recordText.trim().length === 0) {
                        console.log(`   ⚠️  No content extracted from record ${record.id}`);
                        continue;
                    }
                    
                    // Create chunks
                    const chunks = createChunksFromText(recordText);
                    
                    if (chunks.length === 0) {
                        console.log(`   ⚠️  No chunks created from record ${record.id}`);
                        continue;
                    }
                    
                    // Create filename
                    const filename = `${tableName}_${record.id}_${Date.now()}.json`;
                    
                    // Check if document already exists
                    const documentExists = await checkDocumentExists(tableName, record.id);
                    let documentId;
                    
                    if (documentExists) {
                        if (config.duplicateStrategy === 'skip') {
                            console.log(`   ⚠️  Skipping existing record ${record.id}`);
                            continue;
                        } else if (config.duplicateStrategy === 'update') {
                            console.log(`   🔄 Updating existing record ${record.id}`);
                            documentId = await getExistingDocumentId(tableName, record.id);
                            if (documentId) {
                                // Delete existing chunks and embeddings
                                await deleteExistingChunksAndEmbeddings(documentId);
                                // Update document
                                await updateDocument(documentId, recordText, {
                                    source_table: tableName,
                                    record_id: record.id,
                                    record_type: 'database_record',
                                    chunkCount: chunks.length,
                                    updated_at: new Date().toISOString()
                                });
                            }
                        } else if (config.duplicateStrategy === 'force') {
                            console.log(`   🔄 Force updating existing record ${record.id}`);
                            documentId = await getExistingDocumentId(tableName, record.id);
                            if (documentId) {
                                // Delete existing chunks and embeddings
                                await deleteExistingChunksAndEmbeddings(documentId);
                                // Update document
                                await updateDocument(documentId, recordText, {
                                    source_table: tableName,
                                    record_id: record.id,
                                    record_type: 'database_record',
                                    chunkCount: chunks.length,
                                    updated_at: new Date().toISOString()
                                });
                            }
                        }
                    }
                    
                    // If document doesn't exist or we're updating, create new document
                    if (!documentId) {
                        // Save document
                        documentId = await saveDocumentToAI(filename, recordText, {
                            source_table: tableName,
                            record_id: record.id,
                            record_type: 'database_record',
                            chunkCount: chunks.length
                        });
                    }
                    
                    // Save chunks
                    const chunkIds = await saveDocumentChunks(documentId, chunks);
                    
                    // Generate embeddings
                    const embeddingVectors = [];
                    for (const chunk of chunks) {
                        const embedding = await generateEmbedding(chunk);
                        embeddingVectors.push(embedding);
                    }
                    
                    // Save embeddings
                    await saveEmbeddings(chunkIds, embeddingVectors);
                    
                    processed++;
                    
                    if (processed % 10 === 0) {
                        console.log(`   ✅ Processed ${processed}/${totalRecords} records`);
                    }
                    
                } catch (error) {
                    console.error(`   ❌ Error processing record ${record.id}:`, error.message);
                    errors++;
                }
            }
            
            offset += config.batchSize;
        }
        
        console.log(`   ✅ Completed migration of ${tableName}: ${processed} processed, ${errors} errors`);
        return { success: true, processed, errors };
        
    } catch (error) {
        console.error(`   ❌ Failed to migrate table ${tableName}:`, error);
        return { success: false, processed: 0, errors: 1, error: error.message };
    }
}

/**
 * Main migration function
 */
async function migrateTablesToEmbeddings() {
    console.log('🚀 Starting table-to-embeddings migration...');
    console.log(`📋 Tables to migrate: ${config.tablesToMigrate.join(', ')}`);
    
    try {
        // Test connections
        await sourcePool.query('SELECT 1');
        await targetPool.query('SELECT 1');
        console.log('✅ Database connections established');
        
        // Check if target tables exist
        const tablesExist = await targetPool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'documents'
            );
        `);
        
        if (!tablesExist.rows[0].exists) {
            console.log('❌ Target database tables do not exist. Run reset-database.js first.');
            return;
        }
        
        const results = [];
        
        // Migrate each table
        for (const tableName of config.tablesToMigrate) {
            const result = await migrateTable(tableName);
            results.push({ table: tableName, ...result });
        }
        
        // Summary
        console.log('\n🎉 Migration completed!');
        console.log('\n📊 Summary:');
        
        let totalProcessed = 0;
        let totalErrors = 0;
        
        results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`   ${status} ${result.table}: ${result.processed} processed, ${result.errors} errors`);
            totalProcessed += result.processed;
            totalErrors += result.errors;
        });
        
        console.log(`\n📈 Total: ${totalProcessed} records processed, ${totalErrors} errors`);
        
        if (totalErrors === 0) {
            console.log('🎊 All tables migrated successfully!');
        } else {
            console.log('⚠️  Some errors occurred during migration. Check logs above.');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sourcePool.end();
        await targetPool.end();
    }
}

// Run the migration
if (require.main === module) {
    migrateTablesToEmbeddings();
}

module.exports = { migrateTablesToEmbeddings, config }; 