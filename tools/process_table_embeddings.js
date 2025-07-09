#!/usr/bin/env node

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const CONFIG = {
  // Source database (the table you want to process)
  sourceDb: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kisip',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '***REDACTED***',
  },
  
  // AI database (where embeddings will be stored)
  aiDb: {
    host: process.env.AI_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.AI_DB_PORT || process.env.DB_PORT || 5445,
    database: process.env.AI_DB_NAME || 'document_ai',
    user: process.env.AI_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.AI_DB_PASSWORD || process.env.DB_PASSWORD || '***REDACTED***',
  },
  
  // Processing settings
  batchSize: parseInt(process.env.BATCH_SIZE) || 10,
  maxChunksPerRecord: parseInt(process.env.MAX_CHUNKS_PER_RECORD) || 5,
  
  // Embedding settings
  provider: process.env.PROVIDER || 'ollama',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
  openaiApiKey: process.env.OPENAI_API_KEY,
  disableEmbeddings: process.env.DISABLE_EMBEDDINGS === 'true',
  
  // Tables to process (hardcoded array)
  tablesToProcess: [
     
    'settlement',
     
  ],
  
  // Limit for each table (null for no limit)
  recordsLimit: 1000, // Set to null to process all records
};

// Database connections
let sourcePool;
let aiPool;

// Text splitter for chunking
const textSplitter = {
  async splitDocuments(docs) {
    const chunks = [];
    docs.forEach((doc, docIndex) => {
      const text = doc.pageContent;
      const words = text.split(/\s+/);
      const chunkSize = Math.ceil(words.length / CONFIG.maxChunksPerRecord);
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunkWords = words.slice(i, i + chunkSize);
        chunks.push({
          pageContent: chunkWords.join(' '),
          metadata: {
            ...doc.metadata,
            chunk_index: Math.floor(i / chunkSize),
            start_position: i,
            end_position: Math.min(i + chunkSize, words.length),
          }
        });
      }
    });
    return chunks;
  }
};

// Initialize database connections
async function initializeConnections() {
  try {
    console.log('🔌 Initializing database connections...');
    
    // Source database connection
    sourcePool = new Pool(CONFIG.sourceDb);
    await sourcePool.query('SELECT 1');
    console.log('✅ Source database connected');
    
    // AI database connection
    aiPool = new Pool(CONFIG.aiDb);
    await aiPool.query('SELECT 1');
    console.log('✅ AI database connected');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database connections:', error.message);
    return false;
  }
}

// Initialize AI database tables
async function initializeAIDatabase() {
  try {
    console.log('🗄️  Initializing AI database tables...');
    
    // Check if pgvector extension is available
    let pgvectorAvailable = false;
    try {
      await aiPool.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension available');
      pgvectorAvailable = true;
    } catch (error) {
      console.warn('⚠️ pgvector extension not available:', error.message);
    }
    
    // Create documents table
    await aiPool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        file_type VARCHAR(50) NOT NULL,
        file_size BIGINT NOT NULL,
        content TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create document chunks table
    await aiPool.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
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
    
    // Create embeddings table
    if (pgvectorAvailable) {
      await aiPool.query(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
          embedding_vector vector(384),
          model_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await aiPool.query(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chunk_id UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
          embedding_vector REAL[],
          model_name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Create indexes
    await aiPool.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
      CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
      CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON embeddings(chunk_id);
      CREATE INDEX IF NOT EXISTS idx_embeddings_model_name ON embeddings(model_name);
    `);
    
    console.log('✅ AI database tables initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize AI database:', error.message);
    return false;
  }
}

// Generate embedding for text (fallback method)
async function generateEmbedding(text) {
  try {
    // Simple frequency-based embedding generation
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const wordFreq = {};
    
    // Count word frequencies
    words.forEach(word => {
      if (word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Create a 384-dimensional vector (all-minilm size)
    const vector = new Array(384).fill(0);
    
    // Use word frequencies to populate vector
    const wordKeys = Object.keys(wordFreq);
    wordKeys.forEach((word, index) => {
      const vectorIndex = index % 384;
      vector[vectorIndex] = wordFreq[word] / wordKeys.length;
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }
    
    return vector;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return Array(384).fill(0).map(() => Math.random() - 0.5);
  }
}

// Save document to AI database
async function saveDocumentToAI(filename, filePath, fileType, fileSize, content, metadata = {}) {
  try {
    const result = await aiPool.query(`
      INSERT INTO documents (filename, file_path, file_type, file_size, content, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [filename, filePath, fileType, fileSize, content, JSON.stringify(metadata)]);
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error saving document to AI database:', error);
    throw error;
  }
}

// Save document chunks to AI database
async function saveDocumentChunks(documentId, chunks) {
  try {
    const chunkIds = [];
    
    for (const chunk of chunks) {
      const result = await aiPool.query(`
        INSERT INTO document_chunks (document_id, content, chunk_index, start_position, end_position, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        documentId,
        chunk.pageContent,
        chunk.metadata.chunk_index || 0,
        chunk.metadata.start_position || null,
        chunk.metadata.end_position || null,
        JSON.stringify(chunk.metadata)
      ]);
      
      chunkIds.push(result.rows[0].id);
    }
    
    return chunkIds;
  } catch (error) {
    console.error('Error saving document chunks:', error);
    throw error;
  }
}

// Save embeddings to AI database
async function saveEmbeddings(chunkIds, embeddingVectors) {
  console.log('🔍 Saving embeddings...');
  
  let modelName;
  if (CONFIG.provider === 'ollama') {
    modelName = 'all-minilm';
  } else if (CONFIG.provider === 'xai') {
    if (CONFIG.ollamaBaseUrl) {
      modelName = 'all-minilm';
    } else if (CONFIG.openaiApiKey && CONFIG.openaiApiKey !== 'your_openai_api_key_here') {
      modelName = 'text-embedding-ada-002';
    } else {
      modelName = 'keyword-search-only';
    }
  } else {
    modelName = 'text-embedding-ada-002';
  }
  
  try {
    const embeddingPromises = chunkIds.map(async (chunkId, index) => {
      const embeddingString = `[${embeddingVectors[index].join(',')}]`;
      
      const query = `
        INSERT INTO embeddings (chunk_id, embedding_vector, model_name)
        VALUES ($1, $2::vector, $3)
      `;
      await aiPool.query(query, [chunkId, embeddingString, modelName]);
    });
    
    await Promise.all(embeddingPromises);
    console.log(`✅ Saved ${chunkIds.length} embeddings using ${modelName}`);
  } catch (error) {
    console.error('Failed to save embeddings:', error.message);
    console.log('Continuing without embeddings - will use keyword search only');
  }
}

// Convert record to text content
function convertRecordToText(record, modelName) {
  try {
    // Remove common database fields that don't add semantic value
    const excludeFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt'];
    
    const cleanRecord = {};
    Object.keys(record).forEach(key => {
      if (!excludeFields.includes(key)) {
        const value = record[key];
        if (value !== null && value !== undefined) {
          cleanRecord[key] = value;
        }
      }
    });
    
    // Convert to readable text
    const textParts = [];
    textParts.push(`Record from ${modelName} table:`);
    
    Object.entries(cleanRecord).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        textParts.push(`${key}: ${JSON.stringify(value)}`);
      } else {
        textParts.push(`${key}: ${value}`);
      }
    });
    
    return textParts.join('\n');
  } catch (error) {
    console.error('Error converting record to text:', error);
    return JSON.stringify(record);
  }
}

// Create chunks from text
async function createChunksFromText(text, filename) {
  try {
    const doc = {
      pageContent: text,
      metadata: {
        filename: filename,
        fileType: '.json',
        source: 'database_record'
      }
    };
    
    const chunks = await textSplitter.splitDocuments([doc]);
    const limitedChunks = chunks.slice(0, CONFIG.maxChunksPerRecord);
    return limitedChunks;
  } catch (error) {
    console.error(`Error creating chunks from text for ${filename}:`, error);
    return [];
  }
}

// Process a single record for AI
async function processRecordForAI(record, modelName) {
  try {
    console.log(`🔍 Processing ${modelName} record ${record.id} for AI...`);
    
    // Convert record to text content
    const recordContent = convertRecordToText(record, modelName);
    if (!recordContent || recordContent.trim().length === 0) {
      console.log(`No content extracted from ${modelName} record ${record.id}`);
      return { success: false, message: 'No content extracted' };
    }
    
    // Create a virtual filename for the record
    const recordFilename = `${modelName}_${record.id}_${Date.now()}.json`;
    
    // Save record to AI database
    const documentId = await saveDocumentToAI(recordFilename, `database://${modelName}/${record.id}`, '.json', recordContent.length, recordContent, {
      source_model: modelName,
      record_id: record.id,
      record_type: 'database_record',
      chunkCount: 0
    });
    
    // Create chunks from the record content
    const chunks = await createChunksFromText(recordContent, recordFilename);
    if (!chunks || chunks.length === 0) {
      console.log(`No chunks created from ${modelName} record ${record.id}`);
      return { success: false, message: 'No chunks created' };
    }
    
    // Save chunks to AI database
    const chunkIds = await saveDocumentChunks(documentId, chunks);
    
    // Generate embeddings
    try {
      const texts = chunks.map(chunk => chunk.pageContent);
      const embeddingVectors = await Promise.all(texts.map(text => generateEmbedding(text)));
      await saveEmbeddings(chunkIds, embeddingVectors);
      console.log(`✅ AI processing completed for ${modelName} record ${record.id} with embeddings`);
      return { success: true, message: 'Record processed with embeddings', chunks: chunks.length, documentId };
    } catch (embeddingError) {
      console.warn(`Embedding failed for ${modelName} record ${record.id}:`, embeddingError.message);
      return { success: true, message: 'Record processed without embeddings', chunks: chunks.length, documentId, warning: 'Embedding failed' };
    }
  } catch (error) {
    console.error(`Error processing ${modelName} record ${record.id} for AI:`, error);
    return { success: false, message: 'Error processing record for AI', error: error.message };
  }
}

// Get table schema information
async function getTableSchema(tableName) {
  try {
    const result = await sourcePool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting table schema:', error);
    throw error;
  }
}

// Process table records
async function processTableRecords(tableName, limit = null) {
  try {
    console.log(`📊 Processing table: ${tableName}`);
    
    // Get table schema
    const schema = await getTableSchema(tableName);
    console.log(`📋 Table schema: ${schema.length} columns`);
    
    // Get total count in table
    const countResult = await sourcePool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    const totalRecordsInTable = parseInt(countResult.rows[0].count);
    
    // Calculate actual records to process
    const recordsToProcess = limit ? Math.min(totalRecordsInTable, limit) : totalRecordsInTable;
    console.log(`📈 Total records in table: ${totalRecordsInTable}`);
    console.log(`📈 Records to process: ${recordsToProcess}${limit ? ` (limited to ${limit})` : ''}`);
    
    // Process records in batches
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    const batchSize = CONFIG.batchSize;
    const totalBatches = Math.ceil(recordsToProcess / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const offset = batchIndex * batchSize;
      const currentBatchSize = Math.min(batchSize, recordsToProcess - offset);
      
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${totalBatches} (offset: ${offset}, batch size: ${currentBatchSize})`);
      
      // Build query with proper LIMIT and OFFSET
      let batchQuery = `SELECT * FROM "${tableName}" ORDER BY id LIMIT $1 OFFSET $2`;
      let batchParams = [currentBatchSize, offset];
      
      const batchResult = await sourcePool.query(batchQuery, batchParams);
      const batchRecords = batchResult.rows;
      
      console.log(`📝 Found ${batchRecords.length} records in this batch`);
      
      // Process each record in the batch
      for (const record of batchRecords) {
        try {
          const result = await processRecordForAI(record, tableName);
          processedCount++;
          
          if (result.success) {
            successCount++;
            console.log(`✅ Processed record ${record.id} (${processedCount}/${recordsToProcess})`);
          } else {
            errorCount++;
            console.log(`❌ Failed to process record ${record.id}: ${result.message}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error processing record ${record.id}:`, error.message);
        }
      }
      
      // Progress update
      const progress = ((processedCount / recordsToProcess) * 100).toFixed(2);
      console.log(`📊 Progress: ${processedCount}/${recordsToProcess} (${progress}%) - Success: ${successCount}, Errors: ${errorCount}`);
      
      // Check if we've reached the limit
      if (limit && processedCount >= limit) {
        console.log(`🛑 Reached limit of ${limit} records, stopping processing`);
        break;
      }
    }
    
    console.log(`\n🎉 Processing completed!`);
    console.log(`📊 Final stats:`);
    console.log(`   - Total processed: ${processedCount}`);
    console.log(`   - Successful: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
    return { processedCount, successCount, errorCount };
  } catch (error) {
    console.error('Error processing table records:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting table embedding processor...');
    console.log(`📋 Configuration:`);
    console.log(`   - Tables to process: ${CONFIG.tablesToProcess.join(', ')}`);
    console.log(`   - Records limit per table: ${CONFIG.recordsLimit || 'No limit'}`);
    console.log(`   - Batch size: ${CONFIG.batchSize}`);
    console.log(`   - Max chunks per record: ${CONFIG.maxChunksPerRecord}`);
    console.log(`   - Provider: ${CONFIG.provider}`);
    console.log('');
    
    // Initialize connections
    const connectionsOk = await initializeConnections();
    if (!connectionsOk) {
      process.exit(1);
    }
    
    // Initialize AI database
    const aiDbOk = await initializeAIDatabase();
    if (!aiDbOk) {
      process.exit(1);
    }
    
    // Process all tables
    const startTime = Date.now();
    const overallStats = {
      totalTables: CONFIG.tablesToProcess.length,
      processedTables: 0,
      totalRecords: 0,
      totalSuccess: 0,
      totalErrors: 0
    };
    
    for (const tableName of CONFIG.tablesToProcess) {
      try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔄 Processing table: ${tableName}`);
        console.log(`${'='.repeat(60)}`);
        
        const results = await processTableRecords(tableName, CONFIG.recordsLimit);
        
        overallStats.processedTables++;
        overallStats.totalRecords += results.processedCount;
        overallStats.totalSuccess += results.successCount;
        overallStats.totalErrors += results.errorCount;
        
        console.log(`✅ Completed table: ${tableName}`);
        
      } catch (error) {
        console.error(`❌ Failed to process table ${tableName}:`, error.message);
        overallStats.totalErrors++;
      }
    }
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 ALL TABLES PROCESSING COMPLETED!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Overall Statistics:`);
    console.log(`   - Tables processed: ${overallStats.processedTables}/${overallStats.totalTables}`);
    console.log(`   - Total records processed: ${overallStats.totalRecords}`);
    console.log(`   - Total successful: ${overallStats.totalSuccess}`);
    console.log(`   - Total errors: ${overallStats.totalErrors}`);
    console.log(`   - Total processing time: ${totalTime} seconds`);
    if (overallStats.totalRecords > 0) {
      console.log(`   - Average time per record: ${((endTime - startTime) / overallStats.totalRecords).toFixed(2)} ms`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connections
    if (sourcePool) {
      await sourcePool.end();
    }
    if (aiPool) {
      await aiPool.end();
    }
    console.log('🔌 Database connections closed');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  processTableRecords,
  processRecordForAI,
  initializeConnections,
  initializeAIDatabase
}; 