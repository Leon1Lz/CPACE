// Explicit live test: fixed CPACE host, GET-only allowlist, at most 1,021 requests.
// Short HTTP bursts do not simulate authenticated learners or camera streaming.
import https from 'node:https'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const root = fileURLToPath(new URL('../', import.meta.url))
const target = 'https://cpace-three.vercel.app'
const { values } = parseArgs({ options: {
  concurrency: { type: 'string', default: '150' },
  rounds: { type: 'string', default: '3' },
} })
const maximum = Number(values.concurrency)
const rounds = Number(values.rounds)
if (!Number.isInteger(maximum) || maximum < 1 || maximum > 150
  || !Number.isInteger(rounds) || rounds < 1 || rounds > 3) {
  throw new Error('Use --concurrency=1..150 and --rounds=1..3')
}
const cases = [
  { path: '/', status: [200], contains: '</html>' },
  { path: '/verify', status: [200], contains: 'Verify a CPACE Credential' },
  { path: '/login', status: [200], contains: '</html>' },
  { path: '/api/auth/session', status: [200], emptySession: true },
  { path: '/dashboard', status: [302, 303, 307, 308], loginRedirect: true },
  { path: '/api/dashboard/stats', status: [401], contains: 'Unauthorized' },
  { path: '/api/proctor/live-feed', status: [401], contains: 'Unauthorized' },
  { path: '/api/learning-paths', status: [401], contains: 'Unauthorized' },
]
const levels = [...new Set([10, 25, 50, 100, maximum].filter(n => n <= maximum))].sort((a, b) => a - b)
const agent = new https.Agent({ keepAlive: true, maxSockets: maximum, maxFreeSockets: maximum })
const startedAt = new Date().toISOString()
const measurements = []
const stages = []
const errors = []
let interrupted = false
let stoppedForHealth = false
let issued = 0
let active = 0
let peakActive = 0
let responseBytes = 0

function summarize(samples) {
  const sorted = samples.map(sample => sample.ms).sort((a, b) => a - b)
  const percentile = p => sorted.length ? +sorted[Math.ceil(sorted.length * p) - 1].toFixed(2) : 0
  const count = key => samples.reduce((result, sample) => {
    const value = String(sample[key] ?? 'none')
    result[value] = (result[value] || 0) + 1
    return result
  }, {})
  const failures = samples.filter(sample => !sample.ok).length
  return { requests: samples.length, failures,
    errorRatePercent: samples.length ? +(failures / samples.length * 100).toFixed(2) : 0,
    p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99), maxMs: percentile(1),
    statuses: count('status'), cache: count('cache'), regions: count('region') }
}

function request(test, phase, concurrency) {
  const start = performance.now()
  active++
  peakActive = Math.max(peakActive, active)
  return new Promise(resolve => {
    let settled = false
    let timer
    function finish(ok, status, error, metadata = {}) {
      if (settled) return
      settled = true
      active--
      clearTimeout(timer)
      const sample = { phase, concurrency, path: test.path, ms: performance.now() - start, ok, status, ...metadata }
      measurements.push(sample)
      if (!ok && errors.length < 30) errors.push({ path: test.path, status, error })
      if (status === 429 || status >= 500) stoppedForHealth = true
      resolve(sample)
    }
    const req = https.get(new URL(test.path, target), { agent,
      headers: { 'User-Agent': 'CPACE-owner-bounded-load-check/1', Accept: test.path.startsWith('/api/') ? 'application/json' : 'text/html' },
    }, res => {
      const chunks = []
      let bytes = 0
      res.on('data', chunk => {
        bytes += chunk.length
        responseBytes += chunk.length
        if (bytes > 2 * 1024 * 1024) req.destroy(new Error('Response exceeds 2 MiB limit'))
        else chunks.push(chunk)
      })
      res.once('error', () => finish(false, res.statusCode, 'Response interrupted'))
      res.once('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        const ok = test.status.includes(res.statusCode)
          && (!test.contains || body.includes(test.contains))
          && (!test.emptySession || body.trim() === '{}')
          && (!test.loginRedirect || res.headers.location?.includes('/login'))
          && !body.includes('id="__next_error__"')
        finish(ok, res.statusCode, ok ? undefined : 'Unexpected status, content, or redirect', {
          cache: res.headers['x-vercel-cache'] ?? null,
          region: res.headers['x-vercel-id']?.split('::')[0] ?? null,
        })
      })
    })
    timer = setTimeout(() => req.destroy(new Error('15-second request deadline exceeded')), 15000)
    req.once('error', error => finish(false, 0, error.code || error.message))
  })
}

function interrupt() { interrupted = true; agent.destroy() }
process.once('SIGINT', interrupt)
process.once('SIGTERM', interrupt)

try {
  console.log(`LIVE bounded HTTP test: ${target}; maximum ${maximum} outstanding requests; ${rounds} bursts per stage.`)
  for (const test of cases) {
    if (interrupted || stoppedForHealth) break
    const sample = await request(test, 'preflight', 1)
    console.log(JSON.stringify({ preflight: test.path, status: sample.status, passed: sample.ok }))
    if (!sample.ok) throw new Error('Preflight failed; refusing to increase live load')
  }
  for (const concurrency of levels) {
    if (interrupted || stoppedForHealth) break
    const stageStart = performance.now()
    const samples = []
    let completedRounds = 0
    for (let round = 0; round < rounds; round++) {
      if (interrupted || stoppedForHealth) break
      const burstStart = performance.now()
      const burst = await Promise.all(Array.from({ length: concurrency }, () => request(cases[issued++ % cases.length], 'load', concurrency)))
      const summary = summarize(burst)
      samples.push(...burst)
      completedRounds++
      console.log(JSON.stringify({ concurrency, round: round + 1, elapsedSeconds: +((performance.now() - burstStart) / 1000).toFixed(2), ...summary }))
      // Stop escalation on any failed check or p95 over 5 s; honor rate limiting.
      if (summary.failures || summary.p95Ms > 5000) stoppedForHealth = true
      if (round + 1 < rounds && !stoppedForHealth && !interrupted) await delay(2000)
    }
    const summary = summarize(samples)
    stages.push({ concurrency, completedRounds, elapsedSeconds: +((performance.now() - stageStart) / 1000).toFixed(2),
      ...summary, completedWithoutHealthStop: completedRounds === rounds && !stoppedForHealth && !interrupted,
      byRoute: cases.map(test => ({ path: test.path, ...summarize(samples.filter(sample => sample.path === test.path)) })) })
    if (!stoppedForHealth && !interrupted) await delay(5000)
  }
  // Check recovery at low rate after the last burst, unless interrupted or rate-limited.
  if (!interrupted && !measurements.some(sample => sample.status === 429)) {
    for (const test of cases) {
      const sample = await request(test, 'recovery', 1)
      console.log(JSON.stringify({ recovery: test.path, status: sample.status, passed: sample.ok }))
      if (!sample.ok) break
    }
  }
} catch (error) {
  errors.push({ error: error.message })
  console.error(error.message)
  process.exitCode = 1
} finally {
  agent.destroy()
  const load = measurements.filter(sample => sample.phase === 'load')
  const complete = !interrupted && !stoppedForHealth && !errors.length
    && stages.at(-1)?.concurrency === maximum && stages.at(-1)?.completedRounds === rounds
  const report = {
    target, startedAt, completedAt: new Date().toISOString(), complete,
    workload: { method: 'GET', authenticated: false, browserExecution: false, cameraStreaming: false,
      redirectsFollowed: false, cookiesSent: false, levels, burstsPerStage: rounds,
      pauseBetweenBurstsMs: 2000, pauseBetweenStagesMs: 5000, requestDeadlineMs: 15000,
      maximumPlannedRequests: levels.reduce((n, level) => n + level * rounds, 16),
      maximumOutstandingRequests: maximum, observedPeakOutstandingRequests: peakActive,
      failureStop: 'Any failed burst check, any HTTP 429/5xx, or burst p95 above 5 seconds' },
    interrupted, stoppedForHealth, totalRequests: measurements.length,
    responseMiB: +(responseBytes / 1024 ** 2).toFixed(2), summary: summarize(load), stages,
    preflight: measurements.filter(sample => sample.phase === 'preflight'),
    recovery: measurements.filter(sample => sample.phase === 'recovery'), errors,
  }
  const directory = path.join(root, '.local/stress-test')
  await mkdir(directory, { recursive: true })
  const filename = path.join(directory, `web-${startedAt.replace(/[:.]/g, '-')}.json`)
  await writeFile(filename, JSON.stringify(report, null, 2) + '\n')
  await writeFile(path.join(directory, 'web-latest.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ complete, totalRequests: report.totalRequests, ...report.summary }))
  console.log(`Report: ${filename}`)
  if (!complete) process.exitCode = 1
}
