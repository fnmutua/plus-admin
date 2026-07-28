const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')

/** Vite/Rollup content-hashed filenames, e.g. vue-vendor.a41ad27c.js */
const HASHED_ASSET =
  /\.[a-f0-9]{8,}\.(?:js|mjs|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico|map)$/i

const ONE_YEAR_SECONDS = 31_536_000
const ONE_DAY_SECONDS = 86_400

/**
 * gzip/deflate for responses ≥1 KB (HTML, JS, CSS, JSON, SVG, etc.)
 */
function createCompressionMiddleware() {
  return compression({
    level: 6,
    threshold: 1024,
    filter(req, res) {
      if (req.headers['x-no-compression']) return false
      return compression.filter(req, res)
    },
  })
}

/**
 * Long-cache immutable hashed assets; short/no-cache for HTML shells.
 */
function cacheControlMiddleware(req, res, next) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  const urlPath = req.path || ''

  if (urlPath.startsWith('/assets/') && HASHED_ASSET.test(urlPath)) {
    res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR_SECONDS}, immutable`)
  } else if (/\.(?:js|mjs|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico)$/i.test(urlPath)) {
    res.setHeader('Cache-Control', `public, max-age=${ONE_DAY_SECONDS}`)
  } else if (urlPath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache')
  }

  next()
}

function createDistStatic(distDir) {
  return express.static(distDir, {
    etag: true,
    lastModified: true,
    index: false,
    setHeaders(res, filePath) {
      const rel = path.relative(distDir, filePath).replace(/\\/g, '/')
      if (rel.startsWith('assets/') && HASHED_ASSET.test('/' + rel)) {
        res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR_SECONDS}, immutable`)
      }
    },
  })
}

/**
 * Prefer landing.html (lean public shell + main.ts dual bootstrap), fall back to index.html.
 */
function resolveSpaShell(distDir) {
  const landing = path.join(distDir, 'landing.html')
  const index = path.join(distDir, 'index.html')
  if (fs.existsSync(landing)) return landing
  if (fs.existsSync(index)) return index
  return null
}

function sendSpaShell(req, res, distDir) {
  const shell = resolveSpaShell(distDir)
  if (!shell) {
    res.status(503).send('Application shell not found')
    return
  }
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(path.resolve(shell))
}

function registerSpaShellRoutes(app, distDir) {
  app.get('/', (req, res) => sendSpaShell(req, res, distDir))

  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    const p = req.path || ''
    if (
      p.startsWith('/api/') ||
      p.startsWith('/api-docs') ||
      p.startsWith('/swagger') ||
      p.startsWith('/uploads/')
    ) {
      return next()
    }
    if (/\.[a-z0-9]+$/i.test(p)) return next()
    sendSpaShell(req, res, distDir)
  })
}

module.exports = {
  createCompressionMiddleware,
  cacheControlMiddleware,
  createDistStatic,
  sendSpaShell,
  registerSpaShellRoutes,
  resolveSpaShell,
}
