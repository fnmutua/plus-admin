const { Pool } = require('pg');
const axios = require('axios');

// === CONFIG ===
const DB_CONFIG = {
  host: 'localhost',
  port: 5445,
  user: 'postgres',
  password: '***REDACTED***',
  database: 'document_ai'
};

const OLLAMA_URL = 'http://localhost:11434';
const MODEL_NAME = 'all-minilm'; // or 'nomic-embed-text'
const VECTOR_DIM = 384; // Change to 768 if you switch to nomic
const TOP_K = 5; // Number of top similar chunks to return

// === Generate embedding using Ollama ===
async function generateEmbedding(text) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: MODEL_NAME,
      prompt: text
    });

    const vector = response.data.embedding;
    if (!vector || !Array.isArray(vector) || vector.length !== VECTOR_DIM) {
      throw new Error(`Expected embedding of length ${VECTOR_DIM}, but got ${vector.length}`);
    }

    console.log(`✅ Generated embedding (length: ${vector.length})`);
    return vector;
  } catch (err) {
    console.error('❌ Error generating embedding:', err.message);
    return null;
  }
}

// === Query vector similarity from PostgreSQL ===
async function searchSimilarChunks(embeddingVector, topK = TOP_K) {
  const pool = new Pool(DB_CONFIG);

  try {
    const vectorStr = `[${embeddingVector.join(',')}]`; // Format as pgvector input

    const query = `
      SELECT 
        d.filename,
        c.content,
        e.embedding_vector <-> $1::vector AS distance
      FROM embeddings e
      JOIN document_chunks c ON c.id = e.chunk_id
      JOIN documents d ON d.id = c.document_id
      ORDER BY e.embedding_vector <-> $1::vector
      LIMIT $2;
    `;

    const res = await pool.query(query, [vectorStr, topK]);
    return res.rows;
  } catch (err) {
    console.error('❌ Error querying database:', err.message);
    return [];
  } finally {
    await pool.end();
  }
}

// === Main function ===
(async () => {
  const queryText = process.argv[2] || 'Kicheko';
  console.log(`🔍 Query: "${queryText}"`);

  const embedding = await generateEmbedding(queryText);
  if (!embedding) {
    console.log('⚠️ Skipping query due to embedding error.');
    return;
  }

  const results = await searchSimilarChunks(embedding);

  if (!results.length) {
    console.log('⚠️ No matching chunks found.');
    return;
  }

  console.log(`\n✅ Top ${results.length} similar results:\n`);
  results.forEach((r, i) => {
    console.log(`🔹 [${i + 1}] ${r.filename} (distance: ${r.distance})`);
    console.log(r.content);
    console.log('---');
  });
})();
