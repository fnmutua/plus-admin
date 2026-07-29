const zlib = require('zlib')
const { promisify } = require('util')

const gzip = promisify(zlib.gzip)

/**
 * Serialized + gzipped response bodies for dashboard/map bundles, keyed by
 * bundle identity. `res.send(largeObject)` re-runs JSON.stringify (blocking
 * the event loop) and gzip on every request even when the underlying Redis
 * payload hasn't changed — expensive at multi-MB sizes under concurrent
 * load. Reuse the buffers until the bundle's builtAt timestamp changes.
 */
const buffersByKey = new Map()
const buildInFlight = new Map()

async function buildEntry(cacheKey, version, envelope) {
  if (buildInFlight.has(cacheKey)) return buildInFlight.get(cacheKey)

  const promise = (async () => {
    const json = Buffer.from(JSON.stringify(envelope))
    const entry = { version, json, gzip: await gzip(json) }
    buffersByKey.set(cacheKey, entry)
    return entry
  })()

  buildInFlight.set(cacheKey, promise)
  try {
    return await promise
  } finally {
    buildInFlight.delete(cacheKey)
  }
}

async function sendBundleEnvelope(req, res, cacheKey, envelope) {
  const version = envelope?.builtAt ?? null
  let entry = buffersByKey.get(cacheKey)

  // Concurrent requests that all miss the cache (cold start, or the
  // scheduler just rotated builtAt) share one build instead of each
  // running JSON.stringify + gzip independently.
  if (!entry || entry.version !== version) {
    entry = await buildEntry(cacheKey, version, envelope)
  }

  res.status(200)
  res.set('Content-Type', 'application/json; charset=utf-8')

  const acceptsGzip = (req.headers['accept-encoding'] || '').includes('gzip')
  if (acceptsGzip) {
    res.set('Content-Encoding', 'gzip')
    res.set('Vary', 'Accept-Encoding')
    return res.end(entry.gzip)
  }
  return res.end(entry.json)
}

module.exports = { sendBundleEnvelope }
