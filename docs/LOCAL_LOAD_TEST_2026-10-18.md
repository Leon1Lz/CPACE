# Local HTTP load baseline — October 18, 2026

The local production build completed a ramp to **150 concurrent HTTP requests
with zero failures**. This establishes a short baseline for public pages and
unauthenticated access checks. Capacity for 150 authenticated learners taking
camera-monitored exams remains unverified.

## Recorded results

| Concurrent request workers | Requests | Actual stage duration | Requests/second | p50 | p95 | p99 | Failures |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 13,191 | 15.00 s | 879.39 | 0.90 ms | 2.20 ms | 3.14 ms | 0 |
| 10 | 15,000 | 13.47 s | 1,113.29 | 8.56 ms | 12.55 ms | 15.66 ms | 0 |
| 50 | 15,000 | 12.66 s | 1,185.04 | 41.21 ms | 50.37 ms | 59.50 ms | 0 |
| 100 | 15,000 | 12.21 s | 1,228.34 | 78.84 ms | 94.45 ms | 134.94 ms | 0 |
| 150 | 15,000 | 12.21 s | 1,228.83 | 120.05 ms | 143.39 ms | 171.65 ms | 0 |

Total: **73,191 measured requests**, excluding eight warmup requests. The slowest
request at the 150-worker stage took 295.48 ms. All stages met the runner's
provisional thresholds of p95 at most 2 seconds and errors below 1%; these are
test defaults, not an agreed service-level target.

The run started at 2026-10-18 14:53:59 UTC and finished at 14:55:11 UTC
(22:53–22:55 in Asia/Singapore). Each stage stopped after 15 seconds or 15,000
requests, whichever came first, then drained outstanding responses. These are
short bursts, not a sustained exam-length or soak test.

## Environment and workload

- Existing Next.js production build `pP243uWyrSxxCe15c8HG7`, application commit
  `f988f1c0d279aee02033b3b95ff8be0ff146647e`.
- Windows, Node.js v24.18.0, Ryzen 5 5600X, 12 logical CPUs, 15.93 GiB RAM.
- One `next start` process bound to `127.0.0.1` on a temporary port. The load
  generator ran on the same computer, competing for its CPU and memory.
- Closed-loop HTTP/1.1 GET requests with connection reuse and no user think time.
  Each worker waited for its complete response before sending another request.
- Eight routes, distributed evenly: `/`, `/verify`, `/login`,
  `/api/auth/session`, `/dashboard`, `/api/dashboard/stats`,
  `/api/proctor/live-feed`, and `/api/learning-paths`.
- Public responses needed the expected content; redirects needed a login
  destination; protected APIs needed HTTP 401 and `Unauthorized`. An anonymous
  session needed HTTP 200 with `{}`. These expected denials count as successful
  access checks, **not successful authenticated dashboard or proctor operations**.
- Redirects were not followed. Next error-shell HTML, unexpected statuses,
  content mismatches, connection failures, and 10-second deadlines count as errors.

The runner overrides `DATABASE_URL` and `DIRECT_URL` with nonempty loopback URLs
pointing to an unavailable local port. It overrides auth URLs with its local
server URL. It sends no credentials and exercises no database-backed actions.
The live deployment and live database were not load-tested. The child server
was stopped after the run.

## What still needs testing for 150 learners

This run excludes login/password hashing, authenticated database queries,
assessment start, answer autosave, concurrent submission, grading, certificate
lookups and PDF rendering, camera frames, WebRTC/LiveKit/Pusher transport,
browser rendering, mobile devices, real networks, and Vercel scaling/cold starts.
It downloaded HTML and JSON only; it did not execute JavaScript or load a full
page's assets. CPU and memory of the server were not sampled.

Use an isolated staging database with 150 learner accounts and dedicated course,
assessment, and proctor fixtures for the next test. Run the actual authenticated
journey, verify persisted answers and results, and test a synchronized submission
burst. Run browser/camera clients from separate load-generator machines and keep
them active for an exam-length interval while measuring database connections,
query latency, resource usage, and transport failures.

Source inspection identifies additional load that the HTTP baseline did not
exercise: `useAssessmentLiveFeed` sends a snapshot/heartbeat every 3 seconds
(approximately 50 requests/second for 150 active learners). Without LiveKit or
Pusher, WebRTC signaling polls every 750 ms (approximately 200 requests/second
from 150 learner clients, before proctor viewers). These are arithmetic estimates
from code intervals, not measured authenticated throughput. Snapshot state in
`lib/exam-live-store.ts` is process-local, so a multi-instance test must also check
that proctors receive the intended learners' frames.

## Reproduce

```powershell
npm run build
npm run test:stress:local
```

Optional bounded settings:

```powershell
npm run test:stress:local -- --concurrency=50 --duration=10
```

Concurrency is limited to 1–150 and duration to 3–60 seconds per stage. The
15,000-request cap still applies. The runner stops ramping if the observed error
rate exceeds 5% after at least 100 responses in a stage. It exits unsuccessfully
for failed warmup, interruption, server exit, unmet thresholds, request failures,
or failure to reach the selected concurrency.

Raw per-route metrics and environment metadata are written to
`.local/stress-test/latest.json` and a timestamped JSON file in that directory.
Those local artifacts are ignored by Git. No application behavior or deployment
settings were changed for this benchmark.
