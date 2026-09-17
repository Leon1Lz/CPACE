// Non-mutating HTTP smoke checks. No credentials, login attempts, or exam records.
const base = process.env.PORTAL_CHECK_URL ?? "http://localhost:3000"
const cases: { path: string; method?: string; expected: number[] }[] = [
  ...["/", "/about", "/services", "/insights", "/login", "/forgot-password", "/cpace-logo.png"].map(path => ({ path, expected: [200] })),
  ...["/dashboard", "/dashboard/reports", "/dashboard/learning-paths", "/dashboard/proctor", "/dashboard/grading"].map(path => ({ path, expected: [302, 303, 307, 308] })),
  ...["/api/dashboard/stats", "/api/reports", "/api/reports?export=users", "/api/learning-paths", "/api/proctor/assignments", "/api/proctor/incidents", "/api/proctor/live-feed", "/api/proctor/sessions", "/api/chat?sessionId=smoke-check"].map(path => ({ path, expected: [401] })),
  { path: "/api/assessments/smoke-check/draft", method: "PATCH", expected: [401] },
  { path: "/api/assessments/smoke-check/session", method: "POST", expected: [401] },
  { path: "/api/assessments/smoke-check/submit", method: "POST", expected: [401] },
  { path: "/api/grading", expected: [401] },
  { path: "/api/grading/smoke-check", method: "PATCH", expected: [401] },
]
async function main() {
  let failures = 0
  for (const test of cases) {
    try {
      const response = await fetch(new URL(test.path, base), { method: test.method ?? "GET", redirect: "manual", signal: AbortSignal.timeout(15000),
        ...(test.method ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}) })
      const passed = test.expected.includes(response.status)
      if (!passed) failures += 1
      console.log(JSON.stringify({ method: test.method ?? "GET", path: test.path, status: response.status, passed }))
      await response.body?.cancel()
    } catch { failures += 1; console.log(JSON.stringify({ path: test.path, passed: false, error: "Request failed or timed out" })) }
  }
  console.log(JSON.stringify({ checks: cases.length, failures, authenticatedJourneys: "Not exercised", browserOrCamera: "Not exercised" }))
  if (failures) process.exitCode = 1
}
void main()
