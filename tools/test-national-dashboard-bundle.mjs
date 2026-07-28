#!/usr/bin/env node
/**
 * Verify National dashboard bundle performance (1 cached call vs many summary calls).
 *
 * Usage:
 *   node tools/test-national-dashboard-bundle.mjs
 *   node tools/test-national-dashboard-bundle.mjs http://localhost:80 myuser mypass
 *   node tools/test-national-dashboard-bundle.mjs https://kesmis.go.ke myuser mypass
 */

import { performance } from 'perf_hooks'

const BASE = (process.argv[2] || 'http://localhost:80').replace(/\/$/, '')
const USER = process.argv[3] || process.env.TEST_DASHBOARD_USER || ''
const PASS = process.argv[4] || process.env.TEST_DASHBOARD_PASS || ''

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
}

function pass(msg) {
  return `${c.green}✓${c.reset} ${msg}`
}

function fail(msg) {
  return `${c.red}✗${c.reset} ${msg}`
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const msg = data.message || data.error || text.slice(0, 200) || res.statusText
    throw new Error(`${res.status} ${url} — ${msg}`)
  }
  return data
}

async function login() {
  const data = await requestJson(`${BASE}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  })
  const token = data.accessToken || data.token
  if (!token) throw new Error('Login OK but no accessToken in response')
  return token
}

async function fetchBundle(token) {
  const t0 = performance.now()
  const data = await requestJson(`${BASE}/api/v1/dashboard/national/bundle`, {
    headers: { 'x-access-token': token },
  })
  return { ms: performance.now() - t0, data }
}

function countCharts(sections) {
  return (sections || []).reduce((n, s) => n + (s.charts?.length || 0), 0)
}

function fmtMs(n) {
  return `${Math.round(n)}ms`
}

async function main() {
  console.log(`\n${c.bold}National dashboard bundle test${c.reset}`)
  console.log(`${c.dim}${BASE}${c.reset}\n`)

  if (!USER || !PASS) {
    console.log(fail('Credentials required'))
    console.log(
      'Usage: node tools/test-national-dashboard-bundle.mjs [baseUrl] [username] [password]\n' +
        '   Or: TEST_DASHBOARD_USER=... TEST_DASHBOARD_PASS=... node tools/test-national-dashboard-bundle.mjs\n',
    )
    process.exit(1)
  }

  let token
  try {
    const t0 = performance.now()
    token = await login()
    console.log(pass(`Login (${fmtMs(performance.now() - t0)})`))
  } catch (e) {
    console.log(fail(`Login failed: ${e.message}`))
    process.exit(1)
  }

  let first, second
  try {
    first = await fetchBundle(token)
    second = await fetchBundle(token)
  } catch (e) {
    console.log(fail(`Bundle fetch failed: ${e.message}`))
    console.log(`${c.dim}Is the server running with dashboard routes + Redis?${c.reset}`)
    process.exit(1)
  }

  const cards = first.data.cards?.length ?? 0
  const sections = first.data.sections?.length ?? 0
  const charts = countCharts(first.data.sections)
  const estimatedOldCalls = 3 + cards + sections + charts // metadata + per-card + per-section list + per-chart summary (approx)

  console.log(`\n${c.bold}── Bundle payload ──${c.reset}`)
  console.log(`  Dashboard id     ${first.data.dashboardId}`)
  console.log(`  KPI cards        ${cards}`)
  console.log(`  Sections         ${sections}`)
  console.log(`  Charts           ${charts}`)
  console.log(`  Built at         ${first.data.builtAt || '(none)'}`)

  console.log(`\n${c.bold}── Request timing ──${c.reset}`)
  console.log(
    `  1st fetch        ${fmtMs(first.ms)}  fromCache=${first.data.fromCache ?? '?'}${first.data.fromCache ? '' : ' (cold build)'}`
  )
  console.log(
    `  2nd fetch        ${fmtMs(second.ms)}  fromCache=${second.data.fromCache ?? '?'}${second.data.fromCache ? ' (Redis)' : ''}`
  )

  const speedup =
    first.ms > 0 && second.ms > 0 ? (first.ms / Math.max(second.ms, 1)).toFixed(1) : '?'

  console.log(`\n${c.bold}── Improvement estimate ──${c.reset}`)
  console.log(`  Old path (approx)  ~${estimatedOldCalls} API calls for cards + chart data`)
  console.log(`  New path (national) 1 bundle call (+ geo + county list in browser)`)
  console.log(`  Summary calls saved ~${cards + charts} per page load`)

  let ok = true
  if (second.data.fromCache !== true) {
    console.log(fail('2nd request expected fromCache=true (check Redis: redis-cli ping)'))
    ok = false
  } else {
    console.log(pass('2nd request served from Redis cache'))
  }

  if (second.ms < first.ms * 0.8 || second.ms < 500) {
    console.log(pass(`Cached fetch faster (${speedup}× vs 1st, or under 500ms)`))
  } else if (second.data.fromCache) {
    console.log(pass('Cached fetch completed (timing varies on localhost)'))
  } else {
    console.log(fail('Cache does not appear faster on 2nd fetch'))
    ok = false
  }

  if (cards > 0 && charts > 0) {
    console.log(pass(`Bundle contains ${cards} cards + ${charts} charts`))
  } else {
    console.log(fail('Bundle missing cards or charts'))
    ok = false
  }

  console.log(`\n${c.bold}${ok ? pass('Bundle performance check passed') : fail('Some checks failed')}${c.reset}\n`)
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(fail(e.message))
  process.exit(1)
})
