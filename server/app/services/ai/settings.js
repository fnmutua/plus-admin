'use strict'

// Runtime-editable AI settings.
//
// Environment variables remain the baseline. A row in `module_settings` may
// override one of them, using the same convention as System Settings:
//
//   enabled = false  ->  use the environment value
//   enabled = true   ->  use config_value
//
// Overrides are applied onto the live `config` object, so every consumer keeps
// reading `config.chat.provider` synchronously and nothing else had to change.
//
// Credentials (provider API keys) may be set here too. They are encrypted
// before being stored, are never sent back to the client, and fall back to
// the environment variable when no override is active.

const { config, catalog } = require('./config')

const chatProviderIds = catalog.filter((entry) => entry.chat).map((entry) => entry.id)
const embedProviderIds = catalog.filter((entry) => entry.embeddings).map((entry) => entry.id)

// One write-only key field per remote. Built-ins and AI_EXTRA_PROVIDERS share
// this, so a new host gets a field without another setting being written by hand.
const credentialDefinitions = catalog
  .filter((entry) => entry.apiKeyEnv)
  .map((entry) => ({
    key: `ai_${entry.id}_api_key`,
    path: `remotes.${entry.id}.apiKey`,
    type: 'secret',
    group: 'credentials',
    envVar: entry.apiKeyEnv,
    label: `${entry.name} API key`,
    description: entry.keyDescription
  }))
const secrets = require('./secrets')

const PREFIX = 'ai_'
const CACHE_TTL_MS = 30 * 1000

// A revoked credential is stored as this marker rather than as a row that is
// simply absent: "no override" means "use the environment variable", which is
// the opposite of what revoking asks for. The marker overrides the environment
// with an empty key, which takes the provider out of service.
const REVOKED = 'revoked.v1'

const getPath = (object, path) => path.split('.').reduce((value, key) => (value == null ? value : value[key]), object)

const setPath = (object, path, value) => {
  const keys = path.split('.')
  const last = keys.pop()
  const parent = keys.reduce((node, key) => node[key], object)
  parent[last] = value
}

/**
 * Every setting an administrator may change. `path` points into the config
 * object; `group` drives the tab it appears under in the UI.
 */
const DEFINITIONS = [
  {
    key: 'ai_feature_enabled',
    path: 'enabled',
    type: 'boolean',
    group: 'general',
    label: 'Document AI enabled',
    description: 'Turns the assistant and all indexing off.'
  },
  {
    key: 'ai_provider',
    path: 'chat.provider',
    type: 'enum',
    values: chatProviderIds,
    group: 'chat',
    label: 'Chat provider',
    description: 'Service that answers when a user picks nothing.'
  },
  {
    key: 'ai_model',
    path: 'chat.model',
    type: 'string',
    group: 'chat',
    label: 'Chat model',
    description: 'Model name as the provider knows it.'
  },
  {
    key: 'ai_user_providers',
    path: 'userProviders',
    type: 'enums',
    values: chatProviderIds,
    group: 'providers',
    label: 'Providers offered to users',
    description: 'Providers users may choose. Unticked ones are refused even if named in a request.'
  },
  {
    key: 'ai_temperature',
    path: 'chat.temperature',
    type: 'number',
    min: 0,
    max: 2,
    group: 'chat',
    label: 'Temperature',
    description: 'Lower is more literal. Document answering wants a low value.'
  },
  {
    key: 'ai_max_tokens',
    path: 'chat.maxTokens',
    type: 'int',
    min: 64,
    max: 8192,
    group: 'chat',
    label: 'Max answer tokens',
    description: 'Maximum answer length.'
  },
  {
    key: 'ai_timeout_ms',
    path: 'chat.timeoutMs',
    type: 'int',
    min: 10000,
    max: 600000,
    group: 'chat',
    label: 'Response timeout (ms)',
    description: 'How long to wait for an answer.'
  },
  {
    key: 'ai_context_tokens',
    path: 'chat.maxContextTokens',
    type: 'int',
    min: 2048,
    max: 131072,
    group: 'chat',
    label: 'Maximum context window',
    description: 'Ceiling for the model context window.'
  },
  {
    key: 'ai_keep_alive',
    path: 'chat.keepAlive',
    type: 'string',
    group: 'chat',
    label: 'Ollama keep-alive',
    description: 'How long Ollama holds the model in memory, e.g. 30m.'
  },
  {
    key: 'ai_ollama_url',
    path: 'ollamaUrl',
    type: 'url',
    group: 'chat',
    label: 'Ollama URL',
    description: 'Where the local Ollama server listens.'
  },
  {
    key: 'ai_embed_provider',
    path: 'embed.provider',
    type: 'enum',
    values: embedProviderIds,
    group: 'embeddings',
    label: 'Embedding provider',
    description: 'Service that generates vectors. xAI and Claude do not.'
  },
  {
    key: 'ai_embed_model',
    path: 'embed.model',
    type: 'string',
    group: 'embeddings',
    label: 'Embedding model',
    description: 'Changing this requires a reindex.',
    reindex: true
  },
  {
    key: 'ai_embed_timeout_ms',
    path: 'embed.timeoutMs',
    type: 'int',
    min: 5000,
    max: 600000,
    group: 'embeddings',
    label: 'Embedding timeout (ms)',
    description: 'How long to wait for a batch of vectors.'
  },
  {
    key: 'ai_embed_dimensions',
    path: 'embed.dimensions',
    type: 'int',
    min: 64,
    max: 4096,
    group: 'embeddings',
    label: 'Embedding dimensions',
    description: 'Must match the model output and the vector column.',
    reindex: true
  },
  {
    key: 'ai_top_k',
    path: 'retrieval.topK',
    type: 'int',
    min: 1,
    max: 50,
    group: 'retrieval',
    label: 'Chunks per question',
    description: 'Excerpts retrieved per question.'
  },
  {
    key: 'ai_min_similarity',
    path: 'retrieval.minSimilarity',
    type: 'number',
    min: 0,
    max: 1,
    group: 'retrieval',
    label: 'Minimum similarity',
    description: 'Excerpts scoring below this are discarded.'
  },
  {
    key: 'ai_max_context_chars',
    path: 'retrieval.maxContextChars',
    type: 'int',
    min: 2000,
    max: 400000,
    group: 'retrieval',
    label: 'Maximum context characters',
    description: 'Cap on excerpt text per question, roughly 4 characters per token.'
  },
  {
    key: 'ai_history_turns',
    path: 'retrieval.historyTurns',
    type: 'int',
    min: 0,
    max: 20,
    group: 'retrieval',
    label: 'Conversation memory',
    description: 'Previous question/answer pairs kept. 0 disables memory.'
  },
  ...credentialDefinitions,
  {
    key: 'ai_chunk_size',
    path: 'chunk.size',
    type: 'int',
    min: 200,
    max: 8000,
    group: 'indexing',
    label: 'Chunk size',
    description: 'Characters per excerpt. Applies to new indexing.',
    reindex: true
  },
  {
    key: 'ai_max_chunks_per_document',
    path: 'chunk.maxPerDocument',
    type: 'int',
    min: 10,
    max: 5000,
    group: 'indexing',
    label: 'Maximum chunks per document',
    description: 'Excerpt ceiling per file. Longer documents are truncated.',
    reindex: true
  },
  {
    key: 'ai_chunk_overlap',
    path: 'chunk.overlap',
    type: 'int',
    min: 0,
    max: 2000,
    group: 'indexing',
    label: 'Chunk overlap',
    description: 'Characters repeated between neighbouring excerpts.',
    reindex: true
  }
]

const BY_KEY = new Map(DEFINITIONS.map((definition) => [definition.key, definition]))

// The environment-derived values, captured before any override is applied.
const ENV_BASELINE = Object.fromEntries(
  DEFINITIONS.map((definition) => [definition.key, getPath(config, definition.path)])
)

let loadedAt = 0
let overrides = new Map()

class SettingsError extends Error {
  constructor(message) {
    super(message)
    this.status = 400
  }
}

/** Parse and validate a raw value from the client or the database. */
function coerce(definition, raw) {
  if (raw === null || raw === undefined || raw === '') {
    throw new SettingsError(`${definition.label} cannot be empty`)
  }

  switch (definition.type) {
    case 'secret': {
      const value = String(raw).trim()
      // Keys are pasted, and a stray newline or quote is a common accident.
      if (value.length < 8) throw new SettingsError(`${definition.label} looks too short to be a key`)
      if (/\s/.test(value)) throw new SettingsError(`${definition.label} must not contain spaces`)
      return value
    }

    case 'boolean':
      return raw === true || raw === 'true'

    case 'enums': {
      const raw_list = Array.isArray(raw) ? raw : String(raw).split(',')
      const values = [...new Set(raw_list.map((value) => String(value).trim().toLowerCase()).filter(Boolean))]
      if (!values.length) throw new SettingsError(`${definition.label} needs at least one provider`)

      const unknown = values.filter((value) => !definition.values.includes(value))
      if (unknown.length) {
        throw new SettingsError(`${definition.label}: unknown provider "${unknown[0]}"`)
      }
      return values
    }

    case 'enum': {
      // Case-insensitive: provider ids are identifiers, not display text.
      const value = String(raw).trim().toLowerCase()
      if (!definition.values.includes(value)) {
        throw new SettingsError(`${definition.label} must be one of: ${definition.values.join(', ')}`)
      }
      return value
    }

    case 'int':
    case 'number': {
      const parsed = definition.type === 'int' ? parseInt(raw, 10) : Number(raw)
      if (!Number.isFinite(parsed)) throw new SettingsError(`${definition.label} must be a number`)
      if (definition.min !== undefined && parsed < definition.min) {
        throw new SettingsError(`${definition.label} must be at least ${definition.min}`)
      }
      if (definition.max !== undefined && parsed > definition.max) {
        throw new SettingsError(`${definition.label} must be at most ${definition.max}`)
      }
      return parsed
    }

    case 'url': {
      const value = String(raw).trim().replace(/\/$/, '')
      try {
        // eslint-disable-next-line no-new
        new URL(value)
      } catch {
        throw new SettingsError(`${definition.label} must be a valid URL`)
      }
      return value
    }

    default:
      return String(raw).trim()
  }
}

/** Push the current override set onto the live config object. */
function apply() {
  for (const definition of DEFINITIONS) {
    const override = overrides.get(definition.key)
    setPath(config, definition.path, override === undefined ? ENV_BASELINE[definition.key] : override)
  }
}

async function load() {
  const db = require('../../models')
  const { Op } = require('sequelize')

  const rows = await db.models.module_settings.findAll({
    where: { module: { [Op.like]: `${PREFIX}%` } }
  })

  const next = new Map()
  for (const row of rows) {
    const definition = BY_KEY.get(row.module)
    // Only an explicitly enabled row overrides the environment.
    if (!definition || !row.enabled) continue
    try {
      if (definition.type === 'secret' && row.config_value === REVOKED) {
        next.set(definition.key, '')
        continue
      }
      const stored = definition.type === 'secret' && secrets.isEncrypted(row.config_value)
        ? secrets.decrypt(row.config_value)
        : row.config_value
      next.set(definition.key, coerce(definition, stored))
    } catch (error) {
      console.warn(`[ai] ignoring invalid stored setting ${row.module}: ${error.message}`)
    }
  }

  overrides = next
  loadedAt = Date.now()
  apply()
}

/** Load overrides if they have never been read, or the cache has expired. */
async function ensureLoaded() {
  if (Date.now() - loadedAt < CACHE_TTL_MS) return
  try {
    await load()
  } catch (error) {
    // A settings table that cannot be read must not take the assistant down;
    // the environment values are already in place.
    loadedAt = Date.now()
    console.warn('[ai] could not read stored settings, using environment values:', error.message)
  }
}

/** Current effective settings, with where each value came from. */
async function list() {
  await ensureLoaded()

  return DEFINITIONS.map((definition) => {
    const common = {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      group: definition.group,
      type: definition.type,
      values: definition.values || null,
      min: definition.min ?? null,
      max: definition.max ?? null,
      requiresReindex: Boolean(definition.reindex),
      overridden: overrides.has(definition.key)
    }

    // A credential's value never leaves the server. The client gets only
    // whether one is set, where it came from, and a hint to tell keys apart.
    if (definition.type === 'secret') {
      const effective = getPath(config, definition.path)
      return {
        ...common,
        value: null,
        envValue: null,
        envVar: definition.envVar,
        configured: Boolean(effective),
        hint: secrets.mask(effective),
        envConfigured: Boolean(ENV_BASELINE[definition.key]),
        // Revoked: an override is in place that deliberately holds no key, so
        // the environment variable is ignored rather than fallen back to.
        revoked: overrides.get(definition.key) === '',
        storable: secrets.available()
      }
    }

    return { ...common, value: getPath(config, definition.path), envValue: ENV_BASELINE[definition.key] }
  })
}

/**
 * Apply a set of changes.
 *
 * @param {Array<{key: string, value?: any, overridden?: boolean, revoked?: boolean}>} changes
 *        `overridden: false` reverts that setting to its environment value.
 *        `revoked: true` (credentials only) stores an empty key, which
 *        overrides the environment and disables the provider.
 */
async function update(changes, userId) {
  if (!Array.isArray(changes) || !changes.length) {
    throw new SettingsError('No settings supplied')
  }

  const db = require('../../models')
  const rows = []

  // Validate everything before writing anything, so a bad value cannot leave
  // the settings half-applied.
  for (const change of changes) {
    const definition = BY_KEY.get(change.key)
    if (!definition) throw new SettingsError(`Unknown setting "${change.key}"`)

    // Revoking needs no encryption key: nothing secret is written.
    if (change.revoked === true) {
      if (definition.type !== 'secret') {
        throw new SettingsError(`${definition.label} is not a credential and cannot be revoked`)
      }
      rows.push({ definition, enabled: true, value: REVOKED })
      continue
    }

    const useOverride = change.overridden !== false
    if (useOverride && definition.type === 'secret' && !secrets.available()) {
      throw new SettingsError(
        'This server cannot store credentials: set SETTINGS_ENCRYPTION_KEY (or JWT_SECRET) and restart'
      )
    }

    const value = useOverride ? coerce(definition, change.value) : null
    rows.push({
      definition,
      enabled: useOverride,
      // Stored encrypted, so a database dump does not leak the key.
      value: value !== null && definition.type === 'secret' ? secrets.encrypt(value) : value
    })
  }

  for (const row of rows) {
    await db.models.module_settings.upsert({
      module: row.definition.key,
      enabled: row.enabled,
      description: row.definition.label,
      config_value: row.value === null ? null : String(row.value),
      updated_by: userId || null
    })
  }

  await load()

  // Anything that changes vector shape invalidates the store's cached checks.
  if (rows.some((row) => row.definition.reindex)) {
    require('./store').reset()
  }

  return list()
}

module.exports = { list, update, ensureLoaded, DEFINITIONS, SettingsError }
