'use strict'

// Central AI configuration.
//
// Ollama is the default for both chat and embeddings so a stock deployment
// works with no API keys and no document text leaving the host. Every other
// provider is opt-in: the built-in remotes (OpenAI, xAI) plus any
// OpenAI-compatible host named in AI_EXTRA_PROVIDERS.
//
// Chat and embedding providers are configured independently on purpose: xAI
// serves no embeddings endpoint, so "chat on Grok, embed on Ollama" has to be
// expressible without the two settings fighting each other. The catalog below
// is the only list of providers. Settings dropdowns, the user-facing picker
// and the API-key fields are all derived from it.

const int = (value, fallback) => {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')

// OpenAI-compatible hosts share one client and differ only by base URL, key
// and model. Ollama is the only entry with its own wire format.
//
// An extra host is declared by id, then by that id's own variables:
//
//   AI_EXTRA_PROVIDERS=groq
//   GROQ_BASE_URL=https://api.groq.com/openai/v1
//   GROQ_API_KEY=...
//   GROQ_MODEL=llama-3.3-70b-versatile
//   GROQ_EMBEDS=false          # true also requires GROQ_EMBED_MODEL
//   GROQ_NAME=Groq             # optional label
//
// After a restart the new id appears in the provider dropdowns and gets an
// API-key field. A host that does not speak /chat/completions still needs a
// client in provider.js; this list cannot invent a new wire format.
const BUILTIN_PROVIDERS = [
  {
    id: 'ollama',
    name: 'Ollama (local)',
    description: 'Local models. No data leaves the host.',
    kind: 'ollama',
    chat: true,
    embeddings: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI hosted models.',
    keyDescription: 'Enables OpenAI for chat and embeddings.',
    kind: 'openai',
    chat: true,
    embeddings: true,
    baseUrlEnv: 'OPENAI_BASE_URL',
    apiKeyEnv: 'OPENAI_API_KEY',
    chatModelEnv: 'OPENAI_MODEL',
    embedModelEnv: 'OPENAI_EMBED_MODEL',
    defaults: {
      baseUrl: 'https://api.openai.com/v1',
      chatModel: 'gpt-4.1-mini',
      embedModel: 'text-embedding-3-small'
    }
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    description: 'Grok hosted models. Chat only — embeddings stay local.',
    keyDescription: 'Enables Grok for chat. No embeddings.',
    kind: 'openai',
    chat: true,
    embeddings: false,
    baseUrlEnv: 'XAI_BASE_URL',
    apiKeyEnv: 'XAI_API_KEY',
    chatModelEnv: 'XAI_MODEL',
    defaults: {
      baseUrl: 'https://api.x.ai/v1',
      chatModel: 'grok-3-mini',
      embedModel: null
    }
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic hosted models. Chat only — embeddings stay local.',
    keyDescription: 'Enables Claude for chat. No embeddings.',
    kind: 'openai',
    // Chat goes through Anthropic's OpenAI-compatible endpoint. The model
    // list is the native one, which authenticates with x-api-key. Current
    // Claude models reject a temperature below 1, so that value is omitted.
    auth: 'anthropic',
    omitLowTemperature: true,
    chat: true,
    embeddings: false,
    baseUrlEnv: 'ANTHROPIC_BASE_URL',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    chatModelEnv: 'ANTHROPIC_MODEL',
    defaults: {
      baseUrl: 'https://api.anthropic.com/v1',
      chatModel: 'claude-sonnet-4-6',
      embedModel: null
    }
  }
]

/** OpenAI-compatible providers named in AI_EXTRA_PROVIDERS. Invalid ones are skipped. */
function extraProviders() {
  const seen = new Set(BUILTIN_PROVIDERS.map((entry) => entry.id))
  const extras = []

  for (const id of String(process.env.AI_EXTRA_PROVIDERS || '').split(',')) {
    const providerIdValue = id.trim().toLowerCase()
    if (!providerIdValue) continue

    if (!/^[a-z][a-z0-9_]{0,31}$/.test(providerIdValue)) {
      console.error(`[ai] AI_EXTRA_PROVIDERS id "${providerIdValue}" is not a valid provider id — skipping`)
      continue
    }
    if (seen.has(providerIdValue)) {
      console.error(`[ai] AI_EXTRA_PROVIDERS id "${providerIdValue}" is already registered — skipping`)
      continue
    }

    const prefix = providerIdValue.toUpperCase()
    const baseUrl = String(process.env[`${prefix}_BASE_URL`] || '').trim().replace(/\/$/, '')
    if (!baseUrl) {
      console.error(`[ai] ${prefix}_BASE_URL is required for extra provider "${providerIdValue}" — skipping`)
      continue
    }
    try {
      // eslint-disable-next-line no-new
      new URL(baseUrl)
    } catch {
      console.error(`[ai] ${prefix}_BASE_URL is not a valid URL — skipping "${providerIdValue}"`)
      continue
    }

    const chatModel = String(process.env[`${prefix}_MODEL`] || '').trim()
    if (!chatModel) {
      console.error(`[ai] ${prefix}_MODEL is required for extra provider "${providerIdValue}" — skipping`)
      continue
    }

    const embeds = /^(1|true|yes)$/i.test(process.env[`${prefix}_EMBEDS`] || '')
    const embedModel = String(process.env[`${prefix}_EMBED_MODEL`] || '').trim()
    if (embeds && !embedModel) {
      console.error(`[ai] ${prefix}_EMBED_MODEL is required when ${prefix}_EMBEDS is set — skipping "${providerIdValue}"`)
      continue
    }

    const name = String(process.env[`${prefix}_NAME`] || providerIdValue).trim() || providerIdValue
    seen.add(providerIdValue)
    extras.push({
      id: providerIdValue,
      name,
      description: String(process.env[`${prefix}_DESCRIPTION`] || '').trim()
        || (embeds
          ? 'OpenAI-compatible hosted models.'
          : 'OpenAI-compatible hosted models. Chat only.'),
      keyDescription: embeds
        ? `Enables ${name} for chat and embeddings.`
        : `Enables ${name} for chat. No embeddings.`,
      kind: 'openai',
      chat: true,
      embeddings: embeds,
      baseUrlEnv: `${prefix}_BASE_URL`,
      apiKeyEnv: `${prefix}_API_KEY`,
      chatModelEnv: `${prefix}_MODEL`,
      embedModelEnv: `${prefix}_EMBED_MODEL`,
      defaults: { baseUrl, chatModel, embedModel: embeds ? embedModel : null }
    })
  }

  return extras
}

const catalog = [...BUILTIN_PROVIDERS, ...extraProviders()]

function remoteConfig(entry) {
  return {
    baseUrl: String(process.env[entry.baseUrlEnv] || entry.defaults.baseUrl || '').replace(/\/$/, ''),
    apiKey: process.env[entry.apiKeyEnv] || '',
    chatModel: process.env[entry.chatModelEnv] || entry.defaults.chatModel,
    embedModel: entry.embeddings
      ? (process.env[entry.embedModelEnv] || entry.defaults.embedModel)
      : null,
    embeds: entry.embeddings,
    auth: entry.auth || 'bearer',
    omitLowTemperature: Boolean(entry.omitLowTemperature)
  }
}

const REMOTES = Object.fromEntries(
  catalog.filter((entry) => entry.kind === 'openai').map((entry) => [entry.id, remoteConfig(entry)])
)

// Provider ids are matched with ===, so "Ollama" from an env file or an API
// caller must not read as a different provider. Model names are left alone:
// those are case-sensitive to the provider.
const providerId = (value, fallback) => String(value || fallback).trim().toLowerCase()

const CHAT_PROVIDERS = catalog.filter((entry) => entry.chat).map((entry) => entry.id)

/** Parse a comma-separated provider list, keeping only ones we know. */
const providerList = (raw, known, fallback) => {
  const parsed = String(raw || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => known.includes(value))
  return parsed.length ? [...new Set(parsed)] : fallback
}
const EMBED_PROVIDERS = catalog.filter((entry) => entry.embeddings).map((entry) => entry.id)

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

  // Which providers users may pick in the assistant. The server default
  // (chat.provider) answers when no provider is named, so narrowing this does
  // not disable the assistant — it only limits what a user can choose.
  userProviders: providerList(process.env.AI_USER_PROVIDERS, CHAT_PROVIDERS, CHAT_PROVIDERS),

  enabled: process.env.AI_ENABLED !== 'false'
}

// Which providers this deployment can actually serve, derived from real
// config rather than hardcoded. Nothing is advertised that cannot run.
function isOffered(id) {
  return config.userProviders.includes(id)
}

function availableProviders() {
  return catalog.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    isAvailable: entry.kind === 'ollama' || Boolean(REMOTES[entry.id]?.apiKey),
    offered: isOffered(entry.id),
    chat: entry.chat,
    embeddings: entry.embeddings
  }))
}

// A provider is usable for chat only if it is configured. Requests naming an
// unusable provider are rejected rather than silently answered by another one.
function canChat(provider) {
  const id = providerId(provider, '')
  // A provider an administrator has not offered is refused even when a caller
  // names it directly: the picker is a convenience, this is the rule.
  if (!isOffered(id)) return false
  const entry = catalog.find((candidate) => candidate.id === id)
  if (!entry || !entry.chat) return false
  if (entry.kind === 'ollama') return true
  return Boolean(REMOTES[id]?.apiKey)
}

module.exports = { config, catalog, availableProviders, canChat, providerId, CHAT_PROVIDERS }
