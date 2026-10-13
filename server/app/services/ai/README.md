# Document AI

Retrieval-augmented question answering over uploaded documents and indexed
database records. Defaults to a local Ollama install: no API keys required and
no document text leaves the host.

## Layout

| File | Responsibility |
|---|---|
| `config.js` | Env-driven configuration and provider availability |
| `provider.js` | Chat + embeddings over plain HTTP (no SDK) |
| `extract.js` | File → text (pdf/docx/csv/txt) and chunking |
| `store.js` | pgvector schema, writes, retrieval |
| `index.js` | Ingestion and question answering |

HTTP lives in `controllers/ai.controller.js` and `routes/ai.routes.js`.

## Configuration

Chat and embedding providers are set independently, because xAI serves no
embeddings endpoint — "chat on Grok, embed locally" has to be expressible.

```bash
# Chat (default: ollama). Any id in the catalog is valid.
AI_PROVIDER=ollama
AI_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434

# Embeddings (default: ollama). Any catalog id that serves embeddings.
AI_EMBED_PROVIDER=ollama
AI_EMBED_MODEL=all-minilm
AI_EMBED_DIMENSIONS=384         # MUST match the vector(N) column

# Optional remotes
OPENAI_API_KEY=...
XAI_API_KEY=...
ANTHROPIC_API_KEY=...          # Claude. Chat only.
# ANTHROPIC_MODEL=claude-sonnet-4-6

# Another OpenAI-compatible host, no code change. Restart after editing.
# AI_EXTRA_PROVIDERS=groq
# GROQ_BASE_URL=https://api.groq.com/openai/v1
# GROQ_API_KEY=...
# GROQ_MODEL=llama-3.3-70b-versatile
# GROQ_EMBEDS=false
# GROQ_NAME=Groq

# Vector database
AI_DB_HOST=... AI_DB_NAME=... AI_DB_USER=... AI_DB_PASSWORD=... AI_DB_PORT=5432

# Tuning
AI_TOP_K=12                     # chunks retrieved per question
AI_MIN_SIMILARITY=0.25
CHUNK_SIZE=1200
OVERLAP_SIZE=200
AI_RATE_LIMIT_PER_MINUTE=20
AI_ENABLED=true
```

`AI_EMBED_DIMENSIONS` must match the width of `embeddings.embedding_vector`.
On startup the store checks this; on a mismatch it logs the problem, disables
vector search and falls back to keyword search rather than failing every query.
Changing the embedding model means changing the column and reindexing.

## Setup

1. `ollama pull llama3.2 && ollama pull all-minilm`
2. Ensure the AI database has the `vector` extension available.
3. Start the server — the schema and indexes are created on first use.
4. `npm run ai:reindex` to index existing documents.

## Indexing

```bash
npm run ai:reindex                          # database documents not yet indexed
npm run ai:reindex -- --all                 # re-index every database document
npm run ai:reindex -- --id 12 --id 15       # specific database documents

npm run ai:reindex -- --dir ./docs          # every supported file in a folder (recursive)
npm run ai:reindex -- --dir a --dir b       # several folders
npm run ai:reindex -- --dir ./docs --force  # re-index even if unchanged
npm run ai:reindex -- --dir ./docs --flat   # do not descend into subfolders
npm run ai:reindex -- --dir ./docs --dry-run
```

Folder mode keys each file by its absolute path, so re-running replaces a
document instead of duplicating it, and skips files whose size and modified
time are unchanged. Dotfiles, unsupported types and symlinks are skipped;
symlinks are not followed, because a link pointing up the tree would loop.

## Retrieval

Vector search first (cosine distance, HNSW index, filtered to the embedding
model that produced the vectors), falling back to Postgres full-text search.
The answer reports which path was used in `retrieval`, so a degraded result is
visibly degraded rather than silently wrong.

## Endpoints

| Method | Path | Permission |
|---|---|---|
| GET | `/api/ai/health` | authenticated |
| GET | `/api/ai/providers` | authenticated |
| GET | `/api/ai/models?provider=` | authenticated |
| POST | `/api/ai/ask` | `document:read` + rate limited |
| DELETE | `/api/ai/session` | authenticated |
| GET | `/api/ai/stats` | `document:read` |
| GET | `/api/ai/documents/:id/status` | `document:read` |
| POST | `/api/ai/reindex` | `document:update` |

## Known limitation

Retrieval is not scoped per user: anyone with `document:read` can retrieve from
every indexed document and record. If documents become tenant- or
county-scoped, `store.searchByVector` and `searchByKeyword` need a filter and
`documents.metadata` needs the scope written at ingest.
