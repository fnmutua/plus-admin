'use strict'

// Chat completion and embeddings over plain HTTP.
//
// Two wire formats cover every provider we support:
//   - Ollama native  (/api/chat, /api/embed)
//   - OpenAI-compatible (/chat/completions, /embeddings) — used by both
//     OpenAI and xAI, which serve the same request and response shapes.
//
// Node 20 supplies global fetch and AbortSignal.timeout, so there is no
// client library and no SDK version to keep current.

const { config, providerId } = require('./config')
const { describeError } = require('./describeError')

class ProviderError extends Error {
  constructor(message, { provider, status } = {}) {
    super(message)
    this.name = 'ProviderError'
    this.provider = provider
    this.status = status
  }
}

async function postJson(url, body, { headers = {}, timeoutMs, provider, signal }) {
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      // Either the timeout or the caller (a disconnected client) can abort.
      // Aborting the fetch closes the socket, which is what makes Ollama stop
      // generating rather than finishing the answer into a void.
      signal: signal ? AbortSignal.any([AbortSignal.timeout(timeoutMs), signal]) : AbortSignal.timeout(timeoutMs)
    })
  } catch (error) {
    if (signal?.aborted) {
      throw Object.assign(new ProviderError('Request cancelled', { provider }), { cancelled: true, status: 499 })
    }
    if (error.name === 'TimeoutError') {
      throw new ProviderError(
        `${provider} did not respond within ${Math.round(timeoutMs / 1000)}s. `
        + 'Try a smaller model, fewer chunks per question, or raise the timeout in AI Settings.',
        { provider, status: 504 }
      )
    }
    throw new ProviderError(`${provider} request failed: ${describeError(error)}`, { provider })
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 500)
    throw new ProviderError(
      `${provider} returned ${response.status}${detail ? `: ${detail}` : ''}`,
      { provider, status: response.status }
    )
  }

  return response.json()
}

// Newer OpenAI models (gpt-5, o-series) reject `max_tokens` in favour of
// `max_completion_tokens`, and some accept only the default temperature. The
// rest of the wire format is unchanged, so instead of keeping a list of model
// names that goes stale, the first rejection teaches us what a model takes and
// the answer is remembered for the life of the process.
const QUIRKS = new Map()

/** Send an OpenAI-format completion, adapting to what the model rejects. */
async function remoteCompletion({ remote, provider, model, messages, signal }) {
  const cacheKey = `${provider}/${model}`
  const quirks = QUIRKS.get(cacheKey) || { tokenParam: 'max_tokens', sendTemperature: true }

  for (let attempt = 0; ; attempt += 1) {
    const body = { model, messages }
    // Current Claude models reject any temperature below 1. Omitting it lets
    // the model use its own default instead of failing the answer.
    const sendTemperature = quirks.sendTemperature
      && !(remote.omitLowTemperature && config.chat.temperature < 1)
    if (sendTemperature) body.temperature = config.chat.temperature
    body[quirks.tokenParam] = config.chat.maxTokens

    try {
      const data = await postJson(`${remote.baseUrl}/chat/completions`, body, {
        headers: { Authorization: `Bearer ${remote.apiKey}` },
        timeoutMs: config.chat.timeoutMs,
        provider,
        signal
      })
      QUIRKS.set(cacheKey, quirks)
      return data
    } catch (error) {
      // Only a 400 naming the offending parameter is worth adapting to, and
      // only once per parameter — anything else is a real failure.
      const retryable = error.status === 400 && attempt < 2
      const detail = retryable ? error.message : ''

      if (/max_completion_tokens/.test(detail) && quirks.tokenParam === 'max_tokens') {
        quirks.tokenParam = 'max_completion_tokens'
        console.warn(`[ai] ${cacheKey} wants max_completion_tokens; retrying`)
        continue
      }
      if (/temperature/.test(detail) && quirks.sendTemperature) {
        quirks.sendTemperature = false
        console.warn(`[ai] ${cacheKey} accepts only its default temperature; retrying without it`)
        continue
      }
      throw error
    }
  }
}

/**
 * Run a chat completion.
 *
 * @param {{system: string, messages: Array<{role: string, content: string}>,
 *          provider?: string, model?: string}} options
 * @returns {Promise<{content: string, tokens: {prompt: number, completion: number, total: number},
 *                    provider: string, model: string, ms: number}>}
 */
async function chat({ system, messages, provider, model, signal }) {
  const useProvider = providerId(provider, config.chat.provider)
  const startedAt = Date.now()

  const useModel = model
    || (useProvider === config.chat.provider ? config.chat.model : null)
    || (useProvider === 'ollama' ? config.chat.model : config.remotes[useProvider]?.chatModel)

  if (!useModel) {
    throw new ProviderError(`No model configured for provider "${useProvider}"`, { provider: useProvider })
  }

  const chatMessages = [{ role: 'system', content: system }, ...messages]

  if (useProvider === 'ollama') {
    // Prompt evaluation dominates local inference, and an oversized context
    // window makes it slower still, so ask for what this prompt needs rather
    // than a fixed maximum — rounded up to keep the value cache-friendly.
    const promptChars = chatMessages.reduce((total, message) => total + message.content.length, 0)
    const needed = Math.ceil(promptChars / 3.5) + config.chat.maxTokens + 512
    const numCtx = Math.min(
      config.chat.maxContextTokens,
      Math.max(2048, Math.ceil(needed / 1024) * 1024)
    )

    const data = await postJson(`${config.ollamaUrl}/api/chat`, {
      model: useModel,
      messages: chatMessages,
      stream: false,
      keep_alive: config.chat.keepAlive,
      options: {
        temperature: config.chat.temperature,
        num_predict: config.chat.maxTokens,
        num_ctx: numCtx
      }
    }, { timeoutMs: config.chat.timeoutMs, provider: 'ollama', signal })

    const prompt = data.prompt_eval_count || 0
    const completion = data.eval_count || 0
    return {
      content: data.message?.content?.trim() || '',
      tokens: { prompt, completion, total: prompt + completion },
      provider: 'ollama',
      model: useModel,
      ms: Date.now() - startedAt
    }
  }

  const remote = config.remotes[useProvider]
  if (!remote) {
    throw new ProviderError(`Unknown provider "${useProvider}"`, { provider: useProvider })
  }
  if (!remote.apiKey) {
    throw new ProviderError(`Provider "${useProvider}" is not configured`, { provider: useProvider })
  }

  const data = await remoteCompletion({
    remote,
    provider: useProvider,
    model: useModel,
    messages: chatMessages,
    signal
  })

  const usage = data.usage || {}
  return {
    content: data.choices?.[0]?.message?.content?.trim() || '',
    tokens: {
      prompt: usage.prompt_tokens || 0,
      completion: usage.completion_tokens || 0,
      total: usage.total_tokens || 0
    },
    provider: useProvider,
    model: useModel,
    ms: Date.now() - startedAt
  }
}

/**
 * Embed one or more texts. Always uses the configured embedding provider —
 * never the chat provider — so vectors written at ingest and vectors computed
 * at query time are guaranteed to come from the same model.
 *
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embed(texts) {
  if (!texts.length) return []

  const { provider, model, dimensions, timeoutMs } = config.embed
  let vectors

  if (provider === 'ollama') {
    try {
      // Batch endpoint, Ollama >= 0.3.
      const data = await postJson(`${config.ollamaUrl}/api/embed`, {
        model,
        input: texts
      }, { timeoutMs, provider: 'ollama' })
      vectors = data.embeddings
    } catch (error) {
      if (error.status !== 404) throw error
      // Older Ollama: one text per call against the legacy endpoint.
      vectors = []
      for (const text of texts) {
        const data = await postJson(`${config.ollamaUrl}/api/embeddings`, {
          model,
          prompt: text
        }, { timeoutMs, provider: 'ollama' })
        vectors.push(data.embedding)
      }
    }
  } else {
    const remote = config.remotes[provider]
    if (!remote || !remote.embeds) {
      throw new ProviderError(`Provider "${provider}" serves no embeddings endpoint`, { provider })
    }
    if (!remote.apiKey) {
      throw new ProviderError(`Provider "${provider}" is not configured`, { provider })
    }
    const body = { model, input: texts }
    // OpenAI's text-embedding-3-* models can return a shortened vector, so the
    // stored column can stay vector(384) instead of being migrated to 1536.
    // Older models (ada-002) reject the parameter, hence the model test.
    if (/^text-embedding-3/.test(String(model)) && dimensions) {
      body.dimensions = dimensions
    }

    const data = await postJson(`${remote.baseUrl}/embeddings`, body, {
      headers: { Authorization: `Bearer ${remote.apiKey}` },
      timeoutMs,
      provider
    })
    // The API may return items out of order; index is authoritative.
    vectors = (data.data || [])
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding)
  }

  if (!Array.isArray(vectors) || vectors.length !== texts.length) {
    throw new ProviderError(
      `${provider} returned ${vectors?.length ?? 0} embeddings for ${texts.length} inputs`,
      { provider }
    )
  }

  // A silent dimension mismatch is what made the previous implementation
  // return keyword results while reporting vector search. Fail loudly.
  for (const vector of vectors) {
    if (!Array.isArray(vector) || vector.length !== dimensions) {
      throw new ProviderError(
        `${provider}/${model} returned ${vector?.length ?? 0}-dim vectors, ` +
        `but AI_EMBED_DIMENSIONS is ${dimensions}`,
        { provider }
      )
    }
  }

  return vectors
}

async function embedOne(text) {
  const [vector] = await embed([text])
  return vector
}

/** Model name recorded alongside every stored vector, so search can filter on it. */
function embeddingModelId() {
  return `${config.embed.provider}/${config.embed.model}`
}

/**
 * List the models a provider will actually serve, asked of the provider
 * itself. Replaces the hardcoded lists that went stale as soon as they shipped.
 */
// A /models listing includes everything the key can reach — embeddings, audio,
// image and legacy completion models among them. None of those can answer a
// question, so they are never offered as a chat model.
const NOT_CHAT = new RegExp([
  'embed', 'whisper', 'tts', 'audio', 'transcrib', 'realtime', 'dall-e', 'image', 'moderation',
  'davinci', 'babbage', 'curie', 'ada', 'guard', 'rerank',
  // Embedding models whose names say nothing about embeddings.
  'minilm', 'bge', 'gte-', 'mxbai', 'nomic', 'arctic-embed', 'e5-'
].join('|'), 'i')

/**
 * Models a provider will serve for chat, newest first.
 *
 * @param {string} name Provider id
 * @param {{limit?: number}} options `limit` 0 returns every model.
 */
async function listModels(name, { limit = 0 } = {}) {
  const useProvider = providerId(name, config.chat.provider)
  const trim = (models) => (limit > 0 ? models.slice(0, limit) : models)

  if (useProvider === 'ollama') {
    const response = await fetch(`${config.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new ProviderError(`Ollama returned ${response.status}`, { provider: 'ollama' })
    const data = await response.json()

    // Ollama serves whatever has been pulled, so "newest" is the pull date.
    const models = (data.models || [])
      // The embedding model is pulled alongside the chat models and cannot answer.
      .filter((model) => !NOT_CHAT.test(model.name) && model.name !== config.embed.model)
      .map((model) => ({
        id: model.name,
        name: model.name,
        provider: 'ollama',
        size: model.size,
        created: model.modified_at ? Date.parse(model.modified_at) / 1000 : 0
      }))
      .sort((a, b) => b.created - a.created)

    return trim(models)
  }

  const remote = config.remotes[useProvider]
  if (!remote) throw new ProviderError(`Unknown provider "${useProvider}"`, { provider: useProvider })
  if (!remote.apiKey) throw new ProviderError(`Provider "${useProvider}" is not configured`, { provider: useProvider })

  const headers = remote.auth === 'anthropic'
    ? { 'x-api-key': remote.apiKey, 'anthropic-version': '2023-06-01' }
    : { Authorization: `Bearer ${remote.apiKey}` }

  const response = await fetch(`${remote.baseUrl}/models`, {
    headers,
    signal: AbortSignal.timeout(10000)
  })
  if (!response.ok) {
    throw new ProviderError(`${useProvider} returned ${response.status}`, { provider: useProvider, status: response.status })
  }
  const data = await response.json()

  const models = (data.data || [])
    .filter((model) => !NOT_CHAT.test(model.id))
    .map((model) => ({
      id: model.id,
      name: model.display_name || model.id,
      provider: useProvider,
      // OpenAI reports a unix timestamp; Anthropic reports an ISO date.
      created: model.created || (model.created_at ? Date.parse(model.created_at) / 1000 : 0)
    }))
    // `created` is the model's release date, so this puts the current
    // generation first and leaves dated snapshots further down.
    .sort((a, b) => b.created - a.created)

  return trim(models)
}

/** Liveness check for the configured providers. Never throws. */
async function probe() {
  const result = { chat: { provider: config.chat.provider, ok: false }, embed: { provider: config.embed.provider, ok: false } }

  try {
    await embedOne('ping')
    result.embed.ok = true
  } catch (error) {
    result.embed.error = error.message
  }

  try {
    if (config.chat.provider === 'ollama') {
      const response = await fetch(`${config.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) })
      result.chat.ok = response.ok
      if (!response.ok) result.chat.error = `Ollama returned ${response.status}`
    } else {
      result.chat.ok = Boolean(config.remotes[config.chat.provider]?.apiKey)
      if (!result.chat.ok) result.chat.error = 'API key not configured'
    }
  } catch (error) {
    result.chat.error = error.message
  }

  return result
}

module.exports = { chat, embed, embedOne, embeddingModelId, listModels, probe, ProviderError }
