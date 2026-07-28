#!/usr/bin/env node
/**
 * Simulate N concurrent landing-page visitors:
 * 1) GET landing.html
 * 2) Fetch all module scripts + CSS in parallel (browser-like)
 */
import { readFileSync } from 'fs'
import { performance } from 'perf_hooks'

const BASE = process.argv[2] || 'http://127.0.0.1:4173'
const CONCURRENCY = Number(process.argv[3] || 100)
const ROUNDS = Number(process.argv[4] || 1)

function parseAssets(html) {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])
  const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1])
  return [...scripts, ...styles]
}

function pct(sorted, p) {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)]
}

async function fetchOk(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  await res.arrayBuffer()
  return res.headers.get('content-length')
}

async function simulateVisitor(id) {
  const t0 = performance.now()
  const htmlRes = await fetch(`${BASE}/landing.html`)
  if (!htmlRes.ok) throw new Error(`landing.html ${htmlRes.status}`)
  const html = await htmlRes.text()
  const tHtml = performance.now()

  const assets = parseAssets(html).map((p) => (p.startsWith('http') ? p : `${BASE}${p}`))
  await Promise.all(assets.map((url) => fetchOk(url)))
  const tDone = performance.now()

  return {
    id,
    htmlMs: tHtml - t0,
    totalMs: tDone - t0,
    assetCount: assets.length,
  }
}

async function runBatch(size) {
  const started = performance.now()
  const results = await Promise.all(
    Array.from({ length: size }, (_, i) => simulateVisitor(i + 1))
  )
  const wallMs = performance.now() - started
  return { results, wallMs }
}

async function singleEndpoint(label, path) {
  const url = `${BASE}${path}`
  const times = []
  const errors = []

  async function one() {
    const t0 = performance.now()
    try {
      const res = await fetch(url)
      await res.arrayBuffer()
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
    concurrency: CONCURRENCY,
    ok: times.length,
    errors: errors.length,
    wallMs: Math.round(wallMs),
    avgMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
    p50Ms: Math.round(pct(times, 50)),
    p95Ms: Math.round(pct(times, 95)),
    p99Ms: Math.round(pct(times, 99)),
    maxMs: times.length ? Math.round(times[times.length - 1]) : 0,
  }
}

function summarize(label, allResults, wallMs) {
  const html = allResults.map((r) => r.htmlMs).sort((a, b) => a - b)
  const total = allResults.map((r) => r.totalMs).sort((a, b) => a - b)
  const assetCount = allResults[0]?.assetCount ?? 0

  return {
    label,
    concurrency: CONCURRENCY,
    rounds: ROUNDS,
    assetCount,
    wallMs: Math.round(wallMs),
    html: {
      avgMs: Math.round(html.reduce((a, b) => a + b, 0) / html.length),
      p50Ms: Math.round(pct(html, 50)),
      p95Ms: Math.round(pct(html, 95)),
      p99Ms: Math.round(pct(html, 99)),
      maxMs: Math.round(html[html.length - 1]),
    },
    fullLoad: {
      avgMs: Math.round(total.reduce((a, b) => a + b, 0) / total.length),
      p50Ms: Math.round(pct(total, 50)),
      p95Ms: Math.round(pct(total, 95)),
      p99Ms: Math.round(pct(total, 99)),
      maxMs: Math.round(total[total.length - 1]),
    },
  }
}

console.log(`\nLanding load test → ${BASE} (${CONCURRENCY} concurrent)\n`)

// Warm-up
const landingHtml = await fetch(`${BASE}/landing.html`).then((r) => r.text())
const assetPaths = parseAssets(landingHtml)
const bootstrapJs = assetPaths.find((p) => p.includes('bootstrap-public'))
const vueVendorJs = assetPaths.find((p) => p.includes('vue-vendor'))
const elementPlusJs = assetPaths.find((p) => p.includes('element-plus') && p.endsWith('.js'))

const singles = await Promise.all([
  singleEndpoint('HTML shell', '/landing.html'),
  ...(bootstrapJs ? [singleEndpoint('Public bootstrap JS', bootstrapJs)] : []),
  ...(vueVendorJs ? [singleEndpoint('Vue vendor', vueVendorJs)] : []),
  ...(elementPlusJs ? [singleEndpoint('Element Plus', elementPlusJs)] : []),
])

let allResults = []
let totalWall = 0
for (let i = 0; i < ROUNDS; i++) {
  const { results, wallMs } = await runBatch(CONCURRENCY)
  allResults = allResults.concat(results)
  totalWall += wallMs
}

const full = summarize('Full landing visit (HTML + all assets)', allResults, totalWall)

console.log('── Single asset @ 100 concurrent ──')
for (const row of singles) {
  console.log(
    `${row.label.padEnd(22)} p50 ${String(row.p50Ms).padStart(5)}ms  p95 ${String(row.p95Ms).padStart(5)}ms  max ${String(row.maxMs).padStart(5)}ms  (${row.ok}/${row.concurrency} ok, wall ${row.wallMs}ms)`
  )
}

console.log('\n── Simulated full page load @ 100 concurrent ──')
console.log(`Assets per visit: ${full.assetCount}`)
console.log(
  `HTML only   → avg ${full.html.avgMs}ms  p50 ${full.html.p50Ms}ms  p95 ${full.html.p95Ms}ms  p99 ${full.html.p99Ms}ms  max ${full.html.maxMs}ms`
)
console.log(
  `Full load   → avg ${full.fullLoad.avgMs}ms  p50 ${full.fullLoad.p50Ms}ms  p95 ${full.fullLoad.p95Ms}ms  p99 ${full.fullLoad.p99Ms}ms  max ${full.fullLoad.maxMs}ms`
)
console.log(`Batch wall time (${CONCURRENCY} users): ${full.wallMs}ms\n`)

// Hash-route entry path (index.html → public bootstrap)
try {
  const indexHtml = await fetch(`${BASE}/`).then((r) => r.text())
  const entryMatch = indexHtml.match(/src="(\/assets\/index\.[^"]+\.js)"/)
  if (entryMatch) {
    const entry = await singleEndpoint('Index entry (hash route)', entryMatch[1])
    console.log('── Hash route entry (/ → index.html JS) ──')
    console.log(
      `${entry.label.padEnd(22)} p50 ${String(entry.p50Ms).padStart(5)}ms  p95 ${String(entry.p95Ms).padStart(5)}ms  max ${String(entry.maxMs).padStart(5)}ms`
    )
  }
} catch (e) {
  console.log('Hash route entry test skipped:', e.message)
}

console.log('')
