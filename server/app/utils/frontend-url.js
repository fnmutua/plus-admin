/**
 * Resolve the public frontend origin for emails and requester links.
 * Prefers FRONTEND_URL / APP_HOST / VITE_APP_HOST, then request Origin, then req host.
 */
function isLocalhost(urlOrHost) {
  if (!urlOrHost || typeof urlOrHost !== 'string') return false
  try {
    const u = urlOrHost.startsWith('http') ? new URL(urlOrHost) : new URL(`http://${urlOrHost}`)
    const h = (u.hostname || '').toLowerCase()
    return h === 'localhost' || h === '127.0.0.1'
  } catch (_) {
    return false
  }
}

function trimOrigin(s) {
  return String(s || '').trim().replace(/\/+$/, '')
}

const PRODUCTION_URL = 'https://kesmis.go.ke'

function getFrontendBaseUrl(req) {
  const fromEnv =
    process.env.FRONTEND_URL ||
    process.env.APP_HOST ||
    process.env.VITE_APP_HOST
  if (fromEnv) return trimOrigin(fromEnv)

  if (req) {
    const origin = req.get('Origin') || req.get('Referer')
    if (origin) {
      try {
        const url = new URL(origin)
        return trimOrigin(`${url.protocol}//${url.host}`)
      } catch (_) {}
    }

    const fromReq = `${req.protocol}://${req.get('host')}`
    if (fromReq && !isLocalhost(fromReq)) return trimOrigin(fromReq)
    if (fromReq) return trimOrigin(fromReq)
  }

  return PRODUCTION_URL
}

module.exports = { getFrontendBaseUrl, isLocalhost, PRODUCTION_URL }
