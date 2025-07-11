#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const CONFIG = {
  // Source database (contains document table)
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
  uploadsDir: process.env.UPLOADS_DIR || path.join(__dirname, '../data/uploads'),
  batchSize: parseInt(process.env.BATCH_SIZE) || 10,
  chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
  overlap: parseInt(process.env.OVERLAP) || 200,
  
  // Embedding settings
  provider: process.env.PROVIDER || 'ollama',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  openaiApiKey: process.env.OPENAI_API_KEY,
  disableEmbeddings: process.env.DISABLE_EMBEDDINGS === 'true',
  
  // Processing options
  forceReprocess:  'true',
  recordsLimit: parseInt(process.env.RECORDS_LIMIT) || null,
};

// Database connections
let sourcePool;
let aiPool;

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

// Generate embedding for text
async function generateEmbedding(text) {
  try {
    // Ensure the base URL is set
    const baseUrl = CONFIG.ollamaBaseUrl;

    // Request embedding from Ollama
    const response = await axios.post(`${baseUrl}/api/embeddings`, {
      model: 'all-minilm',
      prompt: text
    });

    // Validate and return the vector
    const vector = response.data.embedding;
    if (!vector || !Array.isArray(vector) || vector.length !== 384) {
      throw new Error(`Invalid embedding vector received from Ollama.`);
    }

    return vector;
  } catch (error) {
    console.error('❌ Failed to generate embedding via Ollama:', error.message);
    console.warn('⚠️ Falling back to random vector');
    return Array(384).fill(0).map(() => Math.random() - 0.5);
  }
}

// Extract text from file
async function extractTextFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (fileExtension === '.txt' || fileExtension === '.md') {
      return fs.promises.readFile(filePath, 'utf-8');
    }
    
    if (fileExtension === '.pdf') {
      // You'll need to install pdf-parse: npm install pdf-parse
      try {
        const pdfParse = require('pdf-parse');
        const data = await fs.promises.readFile(filePath);
        const pdf = await pdfParse(data);
        return pdf.text;
      } catch (error) {
        console.warn('pdf-parse not installed, skipping PDF processing');
        return '';
      }
    }
    
    if (fileExtension === '.docx') {
      // You'll need to install mammoth: npm install mammoth
      try {
        const mammoth = require('mammoth');
        const data = await fs.promises.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: data });
        return result.value;
      } catch (error) {
        console.warn('mammoth not installed, skipping DOCX processing');
        return '';
      }
    }
    
    console.warn(`Unsupported file type: ${fileExtension}`);
    return '';
    
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error.message);
    return '';
  }
}

// Create chunks from text
function createChunksFromText(text, filename) {
  if (text.length <= CONFIG.chunkSize) {
    return [{
      pageContent: text,
      metadata: {
        filename,
        chunk_index: 0,
        start_position: 0,
        end_position: text.length
      }
    }];
  }
  
  const chunks = [];
  let start = 0;
  let chunkIndex = 0;
  
  while (start < text.length) {
    let end = start + CONFIG.chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      // Look for sentence endings
      for (let i = end; i > Math.max(start + CONFIG.chunkSize - 100, start); i--) {
        if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
          end = i + 1;
          break;
        }
      }
    }
    
    const chunkContent = text.slice(start, end).trim();
    if (chunkContent) {
      chunks.push({
        pageContent: chunkContent,
        metadata: {
          filename,
          chunk_index: chunkIndex,
          start_position: start,
          end_position: end,
          length: chunkContent.length,
          word_count: chunkContent.split(/\s+/).length
        }
      });
      chunkIndex++;
    }
    
    start = end - CONFIG.overlap;
    if (start >= text.length) break;
  }
  
  return chunks;
}

// Save document to AI database
async function saveDocumentToAI(filename, filePath, fileType, fileSize, content, metadata = {}) {
  try {
    // Ensure fileSize is a valid integer
    const size = parseInt(fileSize) || content.length;
    
    const result = await aiPool.query(`
      INSERT INTO documents (filename, file_path, file_type, file_size, content, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [filename, filePath, fileType, size, content, JSON.stringify(metadata)]);
    
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
  
  let modelName = 'all-minilm';
  
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

// Process a single document for AI
async function processDocumentForAI(document) {
  try {
    console.log(`🔍 Processing document ${document.name} (ID: ${document.id}) for AI...`);
    
    // Determine file path
    let filePath;
    if (document.location && fs.existsSync(document.location)) {
      filePath = document.location;
    } else {
      filePath = path.join(CONFIG.uploadsDir, document.name);
    }
    
    // Extract text from file
    const content = await extractTextFromFile(filePath);
    if (!content || content.trim().length === 0) {
      console.log(`No content extracted from document ${document.name}`);
      return { success: false, message: 'No content extracted' };
    }
    
    // Create chunks from the content
    const chunks = createChunksFromText(content, document.name);
    if (!chunks || chunks.length === 0) {
      console.log(`No chunks created from document ${document.name}`);
      return { success: false, message: 'No chunks created' };
    }
    
    // Save document to AI database
    const documentId = await saveDocumentToAI(
      document.name,
      filePath,
      document.format || path.extname(filePath),
      Math.floor(document.size || content.length), // Convert to integer
      content,
      {
        source_id: document.id,
        source_table: 'document',
        chunkCount: chunks.length
      }
    );
    
    // Save chunks to AI database
    const chunkIds = await saveDocumentChunks(documentId, chunks);
    
    // Generate embeddings
    try {
      const texts = chunks.map(chunk => chunk.pageContent);
      const embeddingVectors = await Promise.all(texts.map(text => generateEmbedding(text)));
      await saveEmbeddings(chunkIds, embeddingVectors);
      console.log(`✅ AI processing completed for document ${document.name} with embeddings`);
      return { success: true, message: 'Document processed with embeddings', chunks: chunks.length, documentId };
    } catch (embeddingError) {
      console.warn(`Embedding failed for document ${document.name}:`, embeddingError.message);
      return { success: true, message: 'Document processed without embeddings', chunks: chunks.length, documentId, warning: 'Embedding failed' };
    }
  } catch (error) {
    console.error(`Error processing document ${document.name} for AI:`, error);
    return { success: false, message: 'Error processing document for AI', error: error.message };
  }
}

// Get documents to process
async function getDocumentsToProcess() {
  try {
    let query = `
      SELECT id, name, location, size, format, "aiProcessed", "aiProcessedAt"
      FROM document
      ORDER BY "createdAt" DESC
    `;
    
    if (CONFIG.recordsLimit) {
      query += ` LIMIT ${CONFIG.recordsLimit}`;
    }
    
    const result = await sourcePool.query(query);
    const documents = result.rows;
    
    // Filter out already processed documents unless force reprocess
    const documentsToProcess = CONFIG.forceReprocess 
      ? documents 
      : documents.filter(doc => !doc.aiProcessed);
    
    console.log(`📄 Found ${documents.length} total documents`);
    console.log(`📄 ${documentsToProcess.length} documents to process`);
    
    return documentsToProcess;
  } catch (error) {
    console.error('Error getting documents to process:', error);
    throw error;
  }
}

// Update document processing status
async function updateDocumentStatus(documentId, aiProcessed = true, chunksCount = 0, warning = null) {
  try {
    await sourcePool.query(`
      UPDATE document 
      SET "aiProcessed" = $1, "aiProcessedAt" = $2, "aiChunks" = $3, "aiWarning" = $4
      WHERE id = $5
    `, [aiProcessed, new Date(), chunksCount, warning, documentId]);
  } catch (error) {
    console.error('Error updating document status:', error);
  }
}

// Process all documents
async function processDocuments() {
  try {
    console.log('📄 Processing documents for AI...');
    
    // Get documents to process
    const documents = await getDocumentsToProcess();
    
    if (documents.length === 0) {
      console.log('No documents to process');
      return { processedCount: 0, successCount: 0, errorCount: 0 };
    }
    
    // Process documents in batches
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    const batchSize = CONFIG.batchSize;
    const totalBatches = Math.ceil(documents.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const offset = batchIndex * batchSize;
      const currentBatchSize = Math.min(batchSize, documents.length - offset);
      
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${totalBatches} (offset: ${offset}, batch size: ${currentBatchSize})`);
      
      const batchDocuments = documents.slice(offset, offset + currentBatchSize);
      
      // Process each document in the batch
      for (const document of batchDocuments) {
        try {
          const result = await processDocumentForAI(document);
          processedCount++;
          
          if (result.success) {
            successCount++;
            await updateDocumentStatus(document.id, true, result.chunks, result.warning);
            console.log(`✅ Processed document ${document.name} (${processedCount}/${documents.length})`);
          } else {
            errorCount++;
            await updateDocumentStatus(document.id, false, 0, result.message);
            console.log(`❌ Failed to process document ${document.name}: ${result.message}`);
          }
        } catch (error) {
          errorCount++;
          await updateDocumentStatus(document.id, false, 0, error.message);
          console.error(`❌ Error processing document ${document.name}:`, error.message);
        }
      }
      
      // Progress update
      const progress = ((processedCount / documents.length) * 100).toFixed(2);
      console.log(`📊 Progress: ${processedCount}/${documents.length} (${progress}%) - Success: ${successCount}, Errors: ${errorCount}`);
    }
    
    console.log(`\n🎉 Document processing completed!`);
    console.log(`📊 Final stats:`);
    console.log(`   - Total processed: ${processedCount}`);
    console.log(`   - Successful: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
    return { processedCount, successCount, errorCount };
  } catch (error) {
    console.error('Error processing documents:', error);
    return { processedCount: 0, successCount: 0, errorCount: 0 };
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting document AI processor...');
    console.log(`📋 Configuration:`);
    console.log(`   - Uploads directory: ${CONFIG.uploadsDir}`);
    console.log(`   - Records limit: ${CONFIG.recordsLimit || 'No limit'}`);
    console.log(`   - Batch size: ${CONFIG.batchSize}`);
    console.log(`   - Chunk size: ${CONFIG.chunkSize}`);
    console.log(`   - Overlap: ${CONFIG.overlap}`);
    console.log(`   - Provider: ${CONFIG.provider}`);
    console.log(`   - Force reprocess: ${CONFIG.forceReprocess}`);
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
    
    // Process documents
    const startTime = Date.now();
    const results = await processDocuments();
    
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 DOCUMENT PROCESSING COMPLETED!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Final Statistics:`);
    console.log(`   - Total documents processed: ${results?.processedCount || 0}`);
    console.log(`   - Successful: ${results?.successCount || 0}`);
    console.log(`   - Errors: ${results?.errorCount || 0}`);
    console.log(`   - Total processing time: ${totalTime} seconds`);
    if (results?.processedCount > 0) {
      console.log(`   - Average time per document: ${((endTime - startTime) / results.processedCount).toFixed(2)} ms`);
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
  processDocuments,
  processDocumentForAI,
  initializeConnections,
  initializeAIDatabase
}; 