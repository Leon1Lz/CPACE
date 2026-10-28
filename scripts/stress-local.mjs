// Bounded HTTP baseline, not a simulation of authenticated learners or cameras.
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const root = fileURLToPath(new URL('../', import.meta.url))
const { values } = parseArgs({ options: {
  duration: { type: 'string', default: '15' },
  concurrency: { type: 'string', default: '150' },
} })
const seconds = Number(values.duration)
const maximum = Number(values.concurrency)
if (!Number.isInteger(seconds) || seconds < 3 || seconds > 60
  || !Number.isInteger(maximum) || maximum < 1 || maximum > 150) {
  throw new Error('Use --duration=3..60 and --concurrency=1..150')
}
const buildId = (await readFile(path.join(root, '.next/BUILD_ID'), 'utf8')).trim()
const cases = [
  { path: '/', status: [200], contains: '</html>' },
  { path: '/verify', status: [200], contains: 'Verify a CPACE Credential' },
  { path: '/login', status: [200], contains: '</html>' },
  { path: '/api/auth/session', status: [200], contains: '{}' },
  { path: '/dashboard', status: [302, 303, 307, 308], loginRedirect: true },
  { path: '/api/dashboard/stats', status: [401], contains: 'Unauthorized' },
  { path: '/api/proctor/live-feed', status: [401], contains: 'Unauthorized' },
  { path: '/api/learning-paths', status: [401], contains: 'Unauthorized' },
]
const thresholds = { p95Ms: 2000, errorRatePercent: 1 }
const stages = []
const errors = []
const agent = new http.Agent({ keepAlive: true, maxSockets: maximum })
let child
let interrupted = false
let stoppedForErrors = false
let responseBytes = 0
const startedAt = new Date().toISOString()

function percentile(samples, fraction) {
  const sorted = [...samples].sort((a, b) => a - b)
  return sorted.length ? Math.round(sorted[Math.ceil(sorted.length * fraction) - 1] * 100) / 100 : 0
}

function summarize(samples) {
  const latencies = samples.map(sample => sample.ms)
  const failures = samples.filter(sample => !sample.ok).length
  return {
    requests: samples.length, failures,
    errorRatePercent: samples.length ? +(failures / samples.length * 100).toFixed(2) : 0,
    p50Ms: percentile(latencies, 0.5), p95Ms: percentile(latencies, 0.95),
    p99Ms: percentile(latencies, 0.99), maxMs: latencies.length ? +Math.max(...latencies).toFixed(2) : 0,
  }
}

async function freePort() {
  const listener = net.createServer()
  await new Promise((resolve, reject) => {
    listener.once('error', reject)
    listener.listen(0, '127.0.0.1', resolve)
  })
  const port = listener.address().port
  await new Promise(resolve => listener.close(resolve))
  return port
}

function request(port, test) {
  const start = performance.now()
  return new Promise(resolve => {
    let settled = false
    let timer
    function finish(ok, status, error) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (!ok && errors.length < 30) errors.push({ path: test.path, status, error })
      resolve({ path: test.path, ms: performance.now() - start, ok, status })
    }
    const req = http.get({ hostname: '127.0.0.1', port, path: test.path, agent,
      headers: { 'User-Agent': 'CPACE-local-load-test/1', Accept: test.path.startsWith('/api/') ? 'application/json' : 'text/html' },
    }, res => {
      const chunks = []
      let size = 0
      res.on('data', chunk => {
        size += chunk.length
        responseBytes += chunk.length
        if (size > 2 * 1024 * 1024) req.destroy(new Error('Response exceeds 2 MiB test limit'))
        else chunks.push(chunk)
      })
      res.once('error', () => finish(false, res.statusCode, 'Response interrupted'))
      res.once('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        const ok = test.status.includes(res.statusCode)
          && (!test.contains || body.includes(test.contains))
          && (!test.loginRedirect || res.headers.location?.includes('/login'))
          && !body.includes('id="__next_error__"')
        finish(ok, res.statusCode, ok ? undefined : 'Unexpected status, body, or redirect')
      })
    })
    timer = setTimeout(() => req.destroy(new Error('Request deadline exceeded')), 10000)
    req.once('error', error => finish(false, 0, error.code || error.message))
  })
}

function stop() {
  interrupted = true
  agent.destroy()
  child?.kill()
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)

try {
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  // Nonempty loopback URLs override Next's .env loading and the Prisma fallback.
  // These tests deliberately never send credentials or invoke DB-backed actions.
  const blockedDatabase = 'postgresql://load_test:load_test@127.0.0.1:1/disabled?connect_timeout=1'
  child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
      DATABASE_URL: blockedDatabase, DIRECT_URL: blockedDatabase,
      NEXTAUTH_URL: base, NEXTAUTH_URL_INTERNAL: base },
  })
  let exited = false
  child.once('exit', () => { exited = true })
  // Wait for this child to declare readiness; never probe an unrelated existing server.
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Local server did not become ready within 45 seconds')), 45000)
    let output = ''
    child.stdout.on('data', data => {
      output = (output + data.toString()).slice(-4000)
      if (/Ready in/.test(output)) { clearTimeout(timeout); resolve() }
    })
    child.stderr.on('data', () => {}) // Drain logs without persisting possible environment details.
    child.once('error', () => { clearTimeout(timeout); reject(new Error('Could not launch the local production server')) })
    child.once('exit', () => { clearTimeout(timeout); reject(new Error('Local production server exited')) })
  })
  console.log(`Production server ready; PID ${child.pid}; loopback only; database blocked.`)
  const warmup = []
  for (const test of cases) {
    const result = await request(port, test)
    warmup.push(result)
    console.log(JSON.stringify({ warmup: test.path, status: result.status, passed: result.ok }))
  }
  if (warmup.some(result => !result.ok)) throw new Error('Warmup failed; refusing to apply load')

  for (const concurrency of [...new Set([1, 10, 50, 100, maximum].filter(n => n <= maximum))].sort((a, b) => a - b)) {
    if (interrupted || exited || stoppedForErrors) break
    const samples = []
    let issued = 0
    let failures = 0
    const start = performance.now()
    const deadline = start + seconds * 1000
    // Closed-loop, no think time: an HTTP pressure test, not 150 browser users.
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (!interrupted && !exited && !stoppedForErrors && performance.now() < deadline && issued < 15000) {
        const test = cases[issued++ % cases.length]
        const sample = await request(port, test)
        samples.push(sample)
        if (!sample.ok) failures++
        if (samples.length >= 100 && failures / samples.length > 0.05) stoppedForErrors = true
      }
    }))
    const elapsedSeconds = (performance.now() - start) / 1000
    const summary = summarize(samples)
    const stage = {
      concurrency, elapsedSeconds: +elapsedSeconds.toFixed(2), ...summary,
      requestsPerSecond: +(samples.length / elapsedSeconds).toFixed(2),
      meetsBaselineThresholds: samples.length > 0 && !stoppedForErrors && !interrupted && !exited
        && summary.errorRatePercent < thresholds.errorRatePercent && summary.p95Ms <= thresholds.p95Ms,
      byRoute: cases.map(test => ({ path: test.path, ...summarize(samples.filter(sample => sample.path === test.path)) })),
    }
    stages.push(stage)
    console.log(JSON.stringify({ ...stage, byRoute: undefined }))
    await delay(1000)
  }
  if (exited) throw new Error('Local server exited during the load test')
} catch (error) {
  errors.push({ error: error.message })
  console.error(error.message)
  process.exitCode = 1
} finally {
  agent.destroy()
  child?.kill()
  const report = {
    startedAt, completedAt: new Date().toISOString(), buildId,
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    environment: { platform: process.platform, node: process.version, cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length, memoryGiB: +(os.totalmem() / 1024 ** 3).toFixed(2),
      loadGeneratorOnSameMachine: true, databaseAccess: 'Blocked with loopback-only runtime URLs' },
    workload: { method: 'GET', redirect: 'manual', authenticated: false, browserExecution: false,
      cameraStreaming: false, liveDeploymentTested: false, thinkTimeMs: 0, secondsPerStage: seconds,
      maximumConcurrency: maximum, requestTimeoutMs: 10000, maxRequestsPerStage: 15000,
      warmupRequestsExcluded: cases.length, paths: cases.map(test => test.path) },
    thresholds, interrupted, stoppedForErrors, responseMiB: +(responseBytes / 1024 ** 2).toFixed(2), stages, errors,
  }
  const directory = path.join(root, '.local/stress-test')
  await mkdir(directory, { recursive: true })
  const filename = path.join(directory, `${startedAt.replace(/[:.]/g, '-')}.json`)
  await writeFile(filename, JSON.stringify(report, null, 2) + '\n')
  await writeFile(path.join(directory, 'latest.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`Report: ${filename}`)
  if (interrupted || stoppedForErrors || errors.length || stages.at(-1)?.concurrency !== maximum
    || stages.some(stage => !stage.meetsBaselineThresholds)) process.exitCode = 1
}
