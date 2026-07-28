#!/usr/bin/env node
/** Full-page landing load: N concurrent visitors using keep-alive (avoids port exhaustion). */
import { performance } from 'perf_hooks'
import http from 'http'

const BASE = process.argv[2] || 'http://127.0.0.1:4173'
const CONCURRENCY = Number(process.argv[3] || 10000)
const baseUrl = new URL(BASE)
const agent = new http.Agent({ keepAlive: true, maxSockets: CONCURRENCY, maxFreeSockets: 256 })

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: baseUrl.hostname,
        port: baseUrl.port || 80,
        path,
        agent,
        method: 'GET',
        headers: { Connection: 'keep-alive' },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`${res.statusCode} ${path}`))
            return
          }
          resolve(Buffer.concat(chunks).toString('utf8'))
        })
      }
    )
    req.on('error', reject)
    req.end()
  })
}

function pct(sorted, p) {
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)]
}

function parseAssets(html) {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])
  const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1])
  return [...scripts, ...styles]
}

async function visit() {
  const t0 = performance.now()
  const html = await get('/landing.html')
  const assets = parseAssets(html)
  await Promise.all(assets.map((p) => get(p)))
  return performance.now() - t0
}

console.log(`\nKeep-alive full landing test → ${BASE} (${CONCURRENCY} concurrent visits)\n`)

// cache asset list
const seedHtml = await get('/landing.html')
parseAssets(seedHtml)

const tWall = performance.now()
const results = await Promise.allSettled(Array.from({ length: CONCURRENCY }, () => visit()))
const wallMs = performance.now() - tWall

const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
const fail = results.filter((r) => r.status === 'rejected')
ok.sort((a, b) => a - b)

console.log(`Completed: ${ok.length}/${CONCURRENCY} ok, ${fail.length} failed`)
if (fail.length) console.log(`First error: ${fail[0].reason?.message || fail[0].reason}`)
if (ok.length) {
  console.log(
    `Full load → p50 ${Math.round(pct(ok, 50))}ms  p95 ${Math.round(pct(ok, 95))}ms  p99 ${Math.round(pct(ok, 99))}ms  max ${Math.round(ok[ok.length - 1])}ms  avg ${Math.round(ok.reduce((a, b) => a + b, 0) / ok.length)}ms`
  )
}
console.log(`Wall time (all ${CONCURRENCY} visits): ${Math.round(wallMs)}ms\n`)

agent.destroy()
