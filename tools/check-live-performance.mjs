#!/usr/bin/env node
/**
 * Audit + load-test a live KeSMIS deployment (default: https://kesmis.go.ke).
 *
 * Checks performance improvements:
 *   1. landing.html served at /
 *   2. gzip on hashed JS/CSS assets
 *   3. long-cache (immutable) on hashed /assets/*
 *   4. lean public bundle (no admin-only inject.js shell)
 *
 * Usage:
 *   node tools/check-live-performance.mjs
 *   node tools/check-live-performance.mjs https://kesmis.go.ke
 *   node tools/check-live-performance.mjs https://kesmis.go.ke 50        # 50 concurrent
 *   node tools/check-live-performance.mjs https://kesmis.go.ke 100 --audit-only
 *   node tools/check-live-performance.mjs https://kesmis.go.ke 100 --load-only
 *   node tools/check-live-performance.mjs https://kesmis.go.ke --throttle 1mbps --load-only
 *
 * Options:
 *   --audit-only   Skip load test
 *   --load-only    Skip improvement audit
 *   --json         Print machine-readable summary on last line
 *   --throttle N   Simulate slow connection (default unit: mbps). Examples: 1mbps, 512kbps, 3m
 *                  Skips concurrent load test; runs a single-user throttled page load instead.
 */

import { performance } from 'perf_hooks'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--') && !a.includes('=')))
const positional = args.filter((a) => !a.startsWith('--'))

function parseBandwidth(value) {
  const s = String(value).trim().toLowerCase()
  const m = s.match(/^([\d.]+)\s*(mbps|mb|m|kbps|kb|k|bps|b)?$/)
  if (!m) throw new Error(`Invalid bandwidth: ${value}`)
  const n = Number(m[1])
  const unit = m[2] || 'mbps'
  if (unit === 'mbps' || unit === 'm' || unit === 'mb') return n * 1_000_000
  if (unit === 'kbps' || unit === 'k' || unit === 'kb') return n * 1_000
  return n // raw bps
}

function parseThrottleBps(argv) {
  for (const a of argv) {
    if (a.startsWith('--throttle=')) return parseBandwidth(a.slice('--throttle='.length))
  }
  const idx = argv.indexOf('--throttle')
  if (idx >= 0) {
    const next = argv[idx + 1]
    if (next && !next.startsWith('--')) return parseBandwidth(next)
    return 1_000_000 // --throttle alone → 1 Mbps
  }
  return 0
}

const BASE = (positional[0] || 'https://kesmis.go.ke').replace(/\/$/, '')
const CONCURRENCY = Number(positional[1] || 100)
const AUDIT_ONLY = flags.has('--audit-only')
const LOAD_ONLY = flags.has('--load-only')
const JSON_OUT = flags.has('--json')
const THROTTLE_BPS = parseThrottleBps(args)
const THROTTLE_BPS_PER_SEC = THROTTLE_BPS / 8 // bits → bytes on the wire

const ONE_YEAR = 31_536_000

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
}

function pass(msg) {
  return `${c.green}✓${c.reset} ${msg}`
}

function fail(msg) {
  return `${c.red}✗${c.reset} ${msg}`
}

function warn(msg) {
  return `${c.yellow}!${c.reset} ${msg}`
}

function pct(sorted, p) {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)]
}

function fmtMs(n) {
  return `${Math.round(n)}ms`
}

function fmtDuration(ms) {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)} min`
  if (ms >= 10_000) return `${(ms / 1000).toFixed(1)}s`
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return fmtMs(ms)
}

function fmtMbps(bps) {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(bps % 1_000_000 ? 1 : 0)} Mbps`
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} Kbps`
  return `${bps} bps`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Serializes bandwidth usage so parallel downloads share one capped pipe. */
class BandwidthLimiter {
  constructor(bytesPerSecond) {
    this.bytesPerSecond = bytesPerSecond
    this.chain = Promise.resolve()
  }

  consume(bytes) {
    const delayMs = (bytes / this.bytesPerSecond) * 1000
    const wait = this.chain.then(() => sleep(delayMs))
    this.chain = wait
    return wait
  }
}

function wireBytesFromResponse(res, bodyLength) {
  const cl = parseInt(res.headers.get('content-length') || '0', 10)
  return cl > 0 ? cl : bodyLength
}

function fmtBytes(n) {
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(2)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}

function parseAssets(html) {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])
  const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1])
  return [...scripts, ...styles]
}

function absUrl(path) {
  if (path.startsWith('http')) return path
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

async function fetchText(url, headers = {}) {
  const res = await fetch(url, { redirect: 'follow', headers })
  const text = await res.text()
  return { res, text }
}

async function fetchBuffer(url, headers = {}) {
  const res = await fetch(url, { redirect: 'follow', headers })
  const buf = Buffer.from(await res.arrayBuffer())
  return { res, buf }
}

async function throttledFetchBuffer(url, headers, limiter) {
  const t0 = performance.now()
  const res = await fetch(url, { redirect: 'follow', headers })
  const buf = Buffer.from(await res.arrayBuffer())
  const wire = wireBytesFromResponse(res, buf.length)
  await limiter.consume(wire)
  return { res, buf, wireBytes: wire, ms: performance.now() - t0 }
}

async function throttledFetchText(url, headers, limiter) {
  const { res, buf, wireBytes, ms } = await throttledFetchBuffer(url, headers, limiter)
  return { res, text: buf.toString('utf8'), wireBytes, ms }
}

function pickHashedAsset(paths) {
  return (
    paths.find((p) => /vue-vendor\.[a-f0-9]{8,}\.js$/i.test(p)) ||
    paths.find((p) => /\/assets\/[^/]+\.[a-f0-9]{8,}\.js$/i.test(p)) ||
    paths.find((p) => /\.[a-f0-9]{8,}\.js$/i.test(p))
  )
}

function pickCssAsset(paths) {
  return paths.find((p) => /\.[a-f0-9]{8,}\.css$/i.test(p))
}

function normalizeHtml(html) {
  return html.replace(/\s+/g, ' ').trim()
}

async function runAudit() {
  const checks = []
  const details = {}

  console.log(`\n${c.bold}── Performance audit ──${c.reset}`)
  console.log(`${c.dim}Target: ${BASE}${c.reset}\n`)

  // Site reachable
  let rootHtml, rootStatus, rootMs
  try {
    const t0 = performance.now()
    const { res, text } = await fetchText(`${BASE}/`)
    rootMs = performance.now() - t0
    rootHtml = text
    rootStatus = res.status
    checks.push({
      name: 'Site reachable (GET /)',
      ok: res.ok,
      detail: `HTTP ${res.status} in ${fmtMs(rootMs)}`,
    })
    details.rootStatus = res.status
    details.rootMs = Math.round(rootMs)
  } catch (e) {
    checks.push({ name: 'Site reachable (GET /)', ok: false, detail: e.message })
    console.log(fail(`Site unreachable: ${e.message}`))
    return { checks, details, failed: true }
  }

  // landing.html at /
  let landingHtml = null
  try {
    const { res, text } = await fetchText(`${BASE}/landing.html`)
    landingHtml = text
    const rootIsLanding =
      normalizeHtml(rootHtml) === normalizeHtml(text) ||
      (rootHtml.includes('KeSMIS') &&
        !rootHtml.includes('inject.js') &&
        parseAssets(rootHtml).length <= parseAssets(text).length + 1)

    checks.push({
      name: 'landing.html served at /',
      ok: rootIsLanding,
      detail: rootIsLanding
        ? 'Root HTML matches lean landing shell'
        : 'Root may still be index.html (check inject.js / asset count)',
    })
    details.rootUsesLanding = rootIsLanding
    details.rootHasInjectJs = rootHtml.includes('inject.js')
  } catch (e) {
    checks.push({
      name: 'landing.html served at /',
      ok: !rootHtml.includes('inject.js'),
      detail: `/landing.html fetch failed (${e.message}); checked / for inject.js`,
    })
  }

  // Lean shell — no admin inject.js
  checks.push({
    name: 'Lean public shell (no inject.js)',
    ok: !rootHtml.includes('inject.js'),
    detail: rootHtml.includes('inject.js') ? 'index.html markers found' : 'No inject.js in /',
  })

  const assetPaths = parseAssets(rootHtml)
  details.assetCount = assetPaths.length
  checks.push({
    name: 'Asset discovery',
    ok: assetPaths.length > 0,
    detail: `${assetPaths.length} script/style URLs in /`,
  })

  const hashedJs = pickHashedAsset(assetPaths)
  const hashedCss = pickCssAsset(assetPaths)

  // gzip on JS
  if (hashedJs) {
    const url = absUrl(hashedJs)
    const plain = await fetchBuffer(url)
    const gz = await fetchBuffer(url, { 'Accept-Encoding': 'gzip, deflate, br' })
    const encoding = (gz.res.headers.get('content-encoding') || 'none').toLowerCase()
    const compressed = gz.buf.length
    const uncompressed = plain.buf.length
    const ratio = uncompressed > 0 ? ((1 - compressed / uncompressed) * 100).toFixed(0) : 0

    details.topJs = pathBasename(hashedJs)
    details.jsUncompressed = uncompressed
    details.jsCompressed = compressed
    details.jsEncoding = encoding

    checks.push({
      name: 'gzip on hashed JS asset',
      ok: encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate'),
      detail: `${pathBasename(hashedJs)}: ${encoding}, ${fmtBytes(uncompressed)} → ${fmtBytes(compressed)} (${ratio}% smaller)`,
    })
  } else {
    checks.push({ name: 'gzip on hashed JS asset', ok: false, detail: 'No hashed JS found in /' })
  }

  // cache-control on JS
  if (hashedJs) {
    const { res } = await fetchBuffer(absUrl(hashedJs))
    const cc = res.headers.get('cache-control') || '(none)'
    const ok =
      /immutable/i.test(cc) &&
      (cc.includes(String(ONE_YEAR)) || cc.includes('max-age=31536000'))
    details.jsCacheControl = cc
    checks.push({
      name: 'long-cache immutable on hashed JS',
      ok,
      detail: cc,
    })
  }

  // gzip + cache on CSS
  if (hashedCss) {
    const url = absUrl(hashedCss)
    const gz = await fetchBuffer(url, { 'Accept-Encoding': 'gzip, deflate, br' })
    const encoding = (gz.res.headers.get('content-encoding') || 'none').toLowerCase()
    const cc = gz.res.headers.get('cache-control') || '(none)'
    details.topCss = pathBasename(hashedCss)
    details.cssEncoding = encoding
    details.cssCacheControl = cc

    checks.push({
      name: 'gzip on hashed CSS asset',
      ok: encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate'),
      detail: `${pathBasename(hashedCss)}: ${encoding}`,
    })
    checks.push({
      name: 'long-cache immutable on hashed CSS',
      ok: /immutable/i.test(cc) && /max-age=/i.test(cc),
      detail: cc,
    })
  }

  // No mapbox in initial landing scripts (Google Maps migration)
  const mapboxInShell = assetPaths.some((p) => /mapbox/i.test(p))
  checks.push({
    name: 'No Mapbox in initial / shell',
    ok: !mapboxInShell,
    detail: mapboxInShell ? 'Mapbox chunk linked from /' : 'Mapbox not in root asset list',
  })

  // Compare / vs /index.html weight if index exists
  try {
    const { text: indexHtml } = await fetchText(`${BASE}/index.html`)
    const indexAssets = parseAssets(indexHtml)
    details.indexAssetCount = indexAssets.length
    checks.push({
      name: '/ leaner than index.html',
      ok: assetPaths.length <= indexAssets.length,
      detail: `/: ${assetPaths.length} assets, index.html: ${indexAssets.length} assets`,
    })
  } catch {
    // index.html optional
  }

  // landing.html direct still works
  if (landingHtml) {
    checks.push({
      name: '/landing.html available',
      ok: landingHtml.includes('KeSMIS'),
      detail: 'Direct landing route OK',
    })
  }

  for (const check of checks) {
    console.log((check.ok ? pass : fail)(`${check.name} — ${check.detail}`))
  }

  const passed = checks.filter((x) => x.ok).length
  const total = checks.length
  console.log(`\n${c.bold}Audit: ${passed}/${total} checks passed${c.reset}`)

  return { checks, details, failed: passed < total }
}

function pathBasename(p) {
  return p.split('/').pop() || p
}

async function simulateVisitor(useRoot = true) {
  const path = useRoot ? '/' : '/landing.html'
  const t0 = performance.now()
  const { res, text } = await fetchText(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${path} ${res.status}`)

  const tHtml = performance.now()
  const assets = parseAssets(text).map(absUrl)
  let totalBytes = Buffer.byteLength(text, 'utf8')

  await Promise.all(
    assets.map(async (url) => {
      const { res: ar, buf } = await fetchBuffer(url, { 'Accept-Encoding': 'gzip, deflate, br' })
      if (!ar.ok) throw new Error(`${ar.status} ${url}`)
      totalBytes += buf.length
    })
  )

  return {
    htmlMs: tHtml - t0,
    totalMs: performance.now() - t0,
    assetCount: assets.length,
    transferBytes: totalBytes,
  }
}

async function singleEndpoint(label, path) {
  const url = absUrl(path)
  const times = []
  const errors = []

  async function one() {
    const t0 = performance.now()
    try {
      const { res } = await fetchBuffer(url, { 'Accept-Encoding': 'gzip, deflate, br' })
      if (!res.ok) throw new Error(String(res.status))
      times.push(performance.now() - t0)
    } catch (e) {
      errors.push(e.message)
    }
  }

  const t0 = performance.now()
  await Promise.all(Array.from({ length: CONCURRENCY }, () => one()))
  const wallMs = performance.now() - t0
  times.sort((a, b) => a - b)

  return {
    label,
    url,
    ok: times.length,
    errors: errors.length,
    wallMs: Math.round(wallMs),
    p50Ms: Math.round(pct(times, 50)),
    p95Ms: Math.round(pct(times, 95)),
    p99Ms: Math.round(pct(times, 99)),
    maxMs: times.length ? Math.round(times[times.length - 1]) : 0,
  }
}

async function runThrottledLoadTest() {
  const limiter = new BandwidthLimiter(THROTTLE_BPS_PER_SEC)
  const encodingHeaders = { 'Accept-Encoding': 'gzip, deflate, br' }

  console.log(`\n${c.bold}── Throttled page load (${fmtMbps(THROTTLE_BPS)}) ──${c.reset}`)
  console.log(
    `${c.dim}Single user · ~${fmtBytes(THROTTLE_BPS_PER_SEC)}/s cap · HTML then parallel assets${c.reset}\n`
  )

  const t0 = performance.now()
  let htmlResult
  try {
    htmlResult = await throttledFetchText(`${BASE}/`, encodingHeaders, limiter)
    if (!htmlResult.res.ok) throw new Error(`GET / ${htmlResult.res.status}`)
  } catch (e) {
    console.log(fail(`Cannot load /: ${e.message}`))
    return { failed: true }
  }

  const htmlMs = htmlResult.ms
  const assetPaths = parseAssets(htmlResult.text)
  const assetUrls = assetPaths.map(absUrl)

  const assetStart = performance.now()
  const assetResults = await Promise.allSettled(
    assetUrls.map(async (url) => {
      const tAsset = performance.now()
      const result = await throttledFetchBuffer(url, encodingHeaders, limiter)
      if (!result.res.ok) throw new Error(`${result.res.status} ${url}`)
      return {
        url,
        name: pathBasename(url),
        ms: performance.now() - tAsset,
        wireBytes: result.wireBytes,
        bodyBytes: result.buf.length,
      }
    })
  )
  const assetsPhaseMs = performance.now() - assetStart
  const totalMs = performance.now() - t0

  const okAssets = assetResults.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  const failedAssets = assetResults.filter((r) => r.status === 'rejected')
  const totalWire =
    htmlResult.wireBytes + okAssets.reduce((sum, a) => sum + a.wireBytes, 0)
  const theoreticalMinMs = (totalWire / THROTTLE_BPS_PER_SEC) * 1000

  console.log(`${pass('GET / (HTML shell)')}`)
  console.log(
    `  ${fmtDuration(htmlMs).padStart(8)}  ${fmtBytes(htmlResult.wireBytes).padStart(8)} on wire`
  )

  console.log(`\nAssets (${okAssets.length} parallel after HTML):`)
  for (const a of okAssets) {
    console.log(
      `  ${a.name.padEnd(28)} ${fmtDuration(a.ms).padStart(8)}  ${fmtBytes(a.wireBytes).padStart(8)} wire`
    )
  }
  if (failedAssets.length) {
    console.log(fail(`${failedAssets.length} asset(s) failed`))
    console.log(`${c.dim}${failedAssets[0].reason?.message || failedAssets[0].reason}${c.reset}`)
  }

  console.log(`\n${c.bold}Summary${c.reset}`)
  console.log(`  HTML phase          ${fmtDuration(htmlMs)}`)
  console.log(`  Assets phase        ${fmtDuration(assetsPhaseMs)}  (parallel, shared ${fmtMbps(THROTTLE_BPS)} cap)`)
  console.log(`  ${c.bold}Total load time     ${fmtDuration(totalMs)}${c.reset}`)
  console.log(`  Total transfer      ${fmtBytes(totalWire)} on wire`)
  console.log(
    `  Theoretical minimum ${fmtDuration(theoreticalMinMs)} at ${fmtMbps(THROTTLE_BPS)} (${fmtBytes(THROTTLE_BPS_PER_SEC)}/s)`
  )
  console.log(
    `  Overhead (RTT etc.) ${fmtDuration(Math.max(0, totalMs - theoreticalMinMs))}`
  )

  return {
    failed: failedAssets.length > 0,
    throttleBps: THROTTLE_BPS,
    htmlMs,
    assetsPhaseMs,
    totalMs,
    totalWireBytes: totalWire,
    theoreticalMinMs,
    assetCount: okAssets.length,
    assets: okAssets,
  }
}

async function runLoadTest() {
  if (THROTTLE_BPS > 0) {
    return runThrottledLoadTest()
  }

  console.log(`\n${c.bold}── Load test (${CONCURRENCY} concurrent) ──${c.reset}`)
  console.log(`${c.dim}Target: ${BASE}${c.reset}\n`)

  // Warm-up
  let rootHtml
  try {
    rootHtml = (await fetchText(`${BASE}/`)).text
  } catch (e) {
    console.log(fail(`Cannot load /: ${e.message}`))
    return { failed: true }
  }

  const assetPaths = parseAssets(rootHtml)
  const vueVendor = assetPaths.find((p) => p.includes('vue-vendor'))
  const entryJs = assetPaths.find((p) => /\/assets\/index\.[^/]+\.js$/i.test(p))

  const singles = await Promise.all([
    singleEndpoint('GET / (HTML shell)', '/'),
    ...(entryJs ? [singleEndpoint('Entry JS', entryJs)] : []),
    ...(vueVendor ? [singleEndpoint('vue-vendor', vueVendor)] : []),
  ])

  console.log('Single endpoint @ concurrency:')
  for (const row of singles) {
    const status =
      row.errors === 0 ? pass('') : fail(`${row.errors} errors — ${row.label}`)
    console.log(
      `  ${status} ${row.label.padEnd(22)} p50 ${String(row.p50Ms).padStart(6)}ms  p95 ${String(row.p95Ms).padStart(6)}ms  max ${String(row.maxMs).padStart(6)}ms  (${row.ok}/${CONCURRENCY} ok)`
    )
  }

  const tWall = performance.now()
  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENCY }, () => simulateVisitor(true))
  )
  const wallMs = performance.now() - tWall

  const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  const failed = results.filter((r) => r.status === 'rejected')

  if (failed.length) {
    console.log(`\n${fail(`Full page load: ${ok.length}/${CONCURRENCY} succeeded`)}`)
    console.log(`${c.dim}First error: ${failed[0].reason?.message || failed[0].reason}${c.reset}`)
  } else {
    console.log(`\n${pass(`Full page load: ${ok.length}/${CONCURRENCY} succeeded`)}`)
  }

  if (ok.length) {
    const htmlTimes = ok.map((r) => r.htmlMs).sort((a, b) => a - b)
    const totalTimes = ok.map((r) => r.totalMs).sort((a, b) => a - b)
    const bytes = ok.map((r) => r.transferBytes).sort((a, b) => a - b)
    const assetCount = ok[0]?.assetCount ?? 0

    console.log(`Assets per visit: ${assetCount}`)
    console.log(
      `HTML only   → p50 ${fmtMs(pct(htmlTimes, 50))}  p95 ${fmtMs(pct(htmlTimes, 95))}  max ${fmtMs(htmlTimes[htmlTimes.length - 1])}`
    )
    console.log(
      `Full load   → p50 ${fmtMs(pct(totalTimes, 50))}  p95 ${fmtMs(pct(totalTimes, 95))}  max ${fmtMs(totalTimes[totalTimes.length - 1])}`
    )
    console.log(
      `Transfer    → p50 ${fmtBytes(pct(bytes, 50))}  p95 ${fmtBytes(pct(bytes, 95))}  (gzip/br on wire)`
    )
    console.log(`Wall time (${CONCURRENCY} users): ${fmtMs(wallMs)}`)

    return {
      failed: failed.length > 0,
      assetCount,
      html: { p50: pct(htmlTimes, 50), p95: pct(htmlTimes, 95) },
      full: { p50: pct(totalTimes, 50), p95: pct(totalTimes, 95) },
      transferP50: pct(bytes, 50),
      wallMs,
    }
  }

  return { failed: true }
}

async function main() {
  console.log(`${c.bold}KeSMIS live performance check${c.reset}`)
  const mode = THROTTLE_BPS > 0 ? `${fmtMbps(THROTTLE_BPS)} throttled` : `${CONCURRENCY} concurrent`
  console.log(`${c.dim}${BASE} · ${mode}${c.reset}`)

  const summary = {
    base: BASE,
    concurrency: CONCURRENCY,
    throttleBps: THROTTLE_BPS || null,
    audit: null,
    load: null,
  }

  if (!LOAD_ONLY) {
    summary.audit = await runAudit()
  }

  if (!AUDIT_ONLY) {
    summary.load = await runLoadTest()
  }

  const auditFailed = summary.audit?.failed
  const loadFailed = summary.load?.failed
  const allOk = !auditFailed && !loadFailed

  console.log(`\n${c.bold}${allOk ? pass('Overall: looks good') : fail('Overall: issues found — see above')}${c.reset}\n`)

  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        base: BASE,
        concurrency: CONCURRENCY,
        throttleBps: THROTTLE_BPS || null,
        audit: summary.audit
          ? {
              passed: summary.audit.checks.filter((c) => c.ok).length,
              total: summary.audit.checks.length,
              checks: summary.audit.checks,
              details: summary.audit.details,
            }
          : null,
        load: summary.load || null,
        ok: allOk,
      })
    )
  }

  process.exit(allOk ? 0 : 1)
}

main().catch((e) => {
  console.error(fail(e.message))
  process.exit(1)
})
