'use strict'

// Central AI configuration.
//
// Ollama is the default for both chat and embeddings so a stock deployment
// works with no API keys and no document text leaving the host. OpenAI and xAI
// are opt-in via AI_PROVIDER.
//
// Chat and embedding providers are configured independently on purpose: xAI
// serves no embeddings endpoint, so "chat on Grok, embed on Ollama" has to be
// expressible without the two settings fighting each other.

const int = (value, fallback) => {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')

// OpenAI and xAI both speak the OpenAI /chat/completions wire format, so they
// share a single client and differ only by base URL, key and model.
const REMOTES = {
  openai: {
    baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    apiKey: process.env.OPENAI_API_KEY || '',
    chatModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    embedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
    embeds: true
  },
  xai: {
    baseUrl: (process.env.XAI_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, ''),
    apiKey: process.env.XAI_API_KEY || '',
    chatModel: process.env.XAI_MODEL || 'grok-3-mini',
    embedModel: null,
    embeds: false
  }
}

// Provider ids are matched with ===, so "Ollama" from an env file or an API
// caller must not read as a different provider. Model names are left alone:
// those are case-sensitive to the provider.
const providerId = (value, fallback) => String(value || fallback).trim().toLowerCase()

const CHAT_PROVIDERS = ['ollama', 'openai', 'xai']
const EMBED_PROVIDERS = ['ollama', 'openai']

/**
 * Resolve a provider name, refusing to carry an unusable one forward. A typo
 * in the environment would otherwise surface as a cryptic failure on every
 * question rather than one complaint at startup.
 */
function resolveProvider(raw, fallback, known, variable) {
  const id = providerId(raw, fallback)
  if (known.includes(id)) return id

  console.error(
    `[ai] ${variable}="${raw}" is not a known provider `
    + `(expected one of: ${known.join(', ')}) — falling back to ${fallback}`
  )
  return fallback
}

const chatProvider = resolveProvider(process.env.AI_PROVIDER, 'ollama', CHAT_PROVIDERS, 'AI_PROVIDER')
const embedProvider = resolveProvider(process.env.AI_EMBED_PROVIDER, 'ollama', EMBED_PROVIDERS, 'AI_EMBED_PROVIDER')

const config = {
  chat: {
    provider: chatProvider,
    model: process.env.AI_MODEL || (chatProvider === 'ollama'
      ? (process.env.OLLAMA_MODEL || 'llama3.2')
      : REMOTES[chatProvider]?.chatModel),
    temperature: Number(process.env.AI_TEMPERATURE ?? 0.1),
    maxTokens: int(process.env.AI_MAX_TOKENS, 1024),
    timeoutMs: int(process.env.AI_TIMEOUT_MS, 180000),
    // Long enough to avoid a reload between questions in a session, short
    // enough that switching models does not leave several GB resident and
    // starve the machine — which is far more expensive than a reload.
    keepAlive: process.env.AI_KEEP_ALIVE || '10m',
    // Upper bound for num_ctx. The window actually requested is sized to each
    // prompt (see provider.chat): Ollama would otherwise apply its own default
    // and silently truncate a full retrieval prompt, while a fixed large value
    // allocates a bigger KV cache and slows prompt evaluation.
    maxContextTokens: int(process.env.AI_CONTEXT_TOKENS, 16384)
  },

  embed: {
    provider: embedProvider,
    model: process.env.AI_EMBED_MODEL || (embedProvider === 'ollama'
      ? (process.env.OLLAMA_EMBED_MODEL || 'all-minilm')
      : REMOTES[embedProvider]?.embedModel),
    // Must match the vector(N) column. all-minilm is 384; switching models
    // means setting this AND reindexing — store.js refuses to guess.
    dimensions: int(process.env.AI_EMBED_DIMENSIONS, 384),
    timeoutMs: int(process.env.AI_EMBED_TIMEOUT_MS, 60000),
    // Chunks per embedding request. Smaller batches finish inside the timeout
    // on a loaded host; larger ones are faster when there is headroom.
    batchSize: int(process.env.AI_EMBED_BATCH, 32)
  },

  ollamaUrl: OLLAMA_URL,
  remotes: REMOTES,

  chunk: {
    size: int(process.env.CHUNK_SIZE, 1200),
    overlap: int(process.env.OVERLAP_SIZE, 200),
    maxPerDocument: int(process.env.MAX_CHUNKS_PER_DOCUMENT, 200)
  },

  retrieval: {
    // The single most important number here. The old implementation had no
    // LIMIT at all and pulled the whole corpus into memory on every question.
    topK: int(process.env.AI_TOP_K, 12),
    // Cosine similarity floor; chunks below this are noise, not context.
    minSimilarity: Number(process.env.AI_MIN_SIMILARITY ?? 0.25),
    // Hard guard on prompt size. topK * chunk.size is the natural bound;
    // this catches pathological chunks.
    maxContextChars: int(process.env.AI_MAX_CONTEXT_CHARS, 24000),
    historyTurns: int(process.env.AI_HISTORY_TURNS, 4)
  },

  db: {
    user: process.env.AI_DB_USER,
    host: process.env.AI_DB_HOST,
    database: process.env.AI_DB_NAME,
    password: process.env.AI_DB_PASSWORD,
    port: int(process.env.AI_DB_PORT, 5432),
    max: int(process.env.AI_DB_POOL_MAX, 5)
  },

  enabled: process.env.AI_ENABLED !== 'false'
}

// Which providers this deployment can actually serve, derived from real
// config rather than hardcoded. Nothing is advertised that cannot run.
function availableProviders() {
  return [
    {
      id: 'ollama',
      name: 'Ollama (local)',
      description: 'Local models. No data leaves the host.',
      isAvailable: true,
      chat: true,
      embeddings: true
    },
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'OpenAI hosted models.',
      isAvailable: Boolean(REMOTES.openai.apiKey),
      chat: true,
      embeddings: true
    },
    {
      id: 'xai',
      name: 'xAI (Grok)',
      description: 'Grok hosted models. Chat only — embeddings stay local.',
      isAvailable: Boolean(REMOTES.xai.apiKey),
      chat: true,
      embeddings: false
    }
  ]
}

// A provider is usable for chat only if it is configured. Requests naming an
// unusable provider are rejected rather than silently answered by another one.
function canChat(provider) {
  const id = providerId(provider, '')
  if (id === 'ollama') return true
  const remote = REMOTES[id]
  return Boolean(remote && remote.apiKey)
}

module.exports = { config, availableProviders, canChat, providerId }
