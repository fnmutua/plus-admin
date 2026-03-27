const http = require('http')

const HOST = 'localhost'
const PORT = 4000

async function makeRequest(endpoint, body) {
  const raw = JSON.stringify(body)
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: endpoint,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(raw) }
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, remaining: res.headers['ratelimit-remaining'] ?? 'n/a', body: data.slice(0, 80) }))
    })
    req.on('error', (e) => resolve({ status: null, remaining: 'n/a', body: e.message }))
    req.write(raw)
    req.end()
  })
}

function icon(status) {
  if (status === 429) return '🚫'
  if (status === 401 || status === 400) return '✅'
  if (status === 200) return '✅'
  return '⚠️ '
}

async function runTest(label, endpoint, body, total, expectBlockAt) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`TEST: ${label}`)
  console.log(`Endpoint: POST ${endpoint}`)
  console.log(`Sending ${total} requests — expect 429 from request ${expectBlockAt}+`)
  console.log('─'.repeat(60))
  for (let i = 1; i <= total; i++) {
    const r = await makeRequest(endpoint, body)
    console.log(`[${String(i).padStart(2)}] ${icon(r.status)}  HTTP ${r.status}  remaining: ${String(r.remaining).padEnd(3)}  ${r.body}`)
  }
}

;(async () => {
  await runTest(
    'Login brute-force (max 10 / 15 min)',
    '/api/auth/signin',
    { username: 'testuser', password: 'wrongpassword' },
    13, 11
  )

  await runTest(
    'OTP guessing (max 5 / 10 min)',
    '/api/app/verify',
    { phone: '0700000000', otp: '9999' },
    8, 6
  )

  console.log('\nDone.')
})()
