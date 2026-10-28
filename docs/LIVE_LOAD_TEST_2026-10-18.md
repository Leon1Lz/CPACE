# Live website HTTP load test — October 18, 2026

Target: https://cpace-three.vercel.app

The website completed three short bursts at **150 simultaneous HTTP requests**
with **zero failed checks**. All eight recovery checks passed afterward. This
measures public-page delivery and anonymous access protection; capacity for 150
authenticated learners taking proctored exams remains unverified.

## Results

| Concurrent request workers | Bursts | Measured requests | Failures | p50 | p95 | p99 | Maximum |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 3 | 30 | 0 | 154.31 ms | 509.81 ms | 569.55 ms | 569.55 ms |
| 25 | 3 | 75 | 0 | 284.03 ms | 1,196.31 ms | 1,596.05 ms | 1,596.05 ms |
| 50 | 3 | 150 | 0 | 286.84 ms | 554.60 ms | 754.16 ms | 1,122.20 ms |
| 100 | 3 | 300 | 0 | 289.96 ms | 532.92 ms | 591.49 ms | 1,154.93 ms |
| 150 | 3 | 450 | 0 | 292.33 ms | 529.35 ms | 603.30 ms | 668.68 ms |

The recorded run sent **1,021 requests**: eight preflight requests, 1,005 load
requests, and eight recovery requests. Load-only aggregate p95 was 532.92 ms.
There were no HTTP 429 responses, HTTP 5xx responses, timeouts, content failures,
or unexpected redirects. Expected HTTP 401 responses are successful access
checks, not successful authenticated operations.

The run lasted from **23:01:43 to 23:02:44 Asia/Singapore** on October 18, 2026
(15:01:43–15:02:44 UTC). An earlier eight-request manual preflight is outside the
recorded run. The runner downloaded 32.79 MiB of response bodies including its
preflight and recovery checks. All measured requests reported Vercel region
`sin1` in the response identifier.

## Workload and limits

Each burst launched the selected number of GET requests together and waited for
all complete response bodies. There were two-second pauses between bursts and
five-second pauses between stages. Observed peak outstanding requests was 150.
This was a short burst test, not sustained 150-request concurrency or an
exam-length soak test. No sustained requests-per-second capacity is inferred.

The eight allowed paths were `/`, `/verify`, `/login`, `/api/auth/session`,
`/dashboard`, `/api/dashboard/stats`, `/api/proctor/live-feed`, and
`/api/learning-paths`. The runner sent no cookies or credentials and did not
follow redirects. Checks required the expected status plus public content,
an empty anonymous session, a login redirect, or an `Unauthorized` response.
Next.js error-shell HTML also counts as failure.

All 378 load requests to the three public HTML pages reported `x-vercel-cache:
HIT`. The four anonymous API paths accounted for 501 cache misses, and the
dashboard login redirects accounted for 126 responses without that cache header.
Consequently, the public-page measurements include Vercel CDN performance and
do not measure repeated origin rendering or database throughput.

The runner uses HTTPS with connection reuse from this Windows computer. Timings
include the internet path, full response download, and any needed DNS/TLS setup.
It does not execute JavaScript or load a complete browser page's assets. The
sample size and short duration do not establish long-term reliability.

No authenticated exams, camera sessions, autosave, submissions, grading, PDF
generation, certificate database lookups, or other database-backed actions were
load-tested. No learner records were created or modified by these requests.
Vercel CPU/memory, origin cold starts, database connection usage, and transport
service capacity were not instrumented.

## Follow-up for 150 learners

Use an isolated staging database, 150 learner accounts, dedicated assessments,
and proctor fixtures. Test actual login, assessment start, autosave, camera feeds,
and synchronized submission; verify stored answers and results. Run exam-length
sessions from separate browser/load-generator machines while recording database
latency, connection usage, application resources, and camera transport failures.

## Reproduce the bounded live check

```powershell
npm run test:stress:web
```

This command sends traffic to the live CPACE website. It is limited to the fixed
host and eight GET paths above. Default traffic is capped at 1,021 requests.
It stops escalation on any failed burst check, any HTTP 429/5xx, or burst p95
above five seconds. Each request has a 15-second deadline.

For a smaller run:

```powershell
npm run test:stress:web -- --concurrency=25 --rounds=1
```

Concurrency is limited to 1–150, with one to three bursts per stage. Raw stage,
route, cache, status, and recovery results are saved in the Git-ignored
`.local/stress-test/web-latest.json` and a timestamped JSON file beside it.
The local-only benchmark is documented in `LOCAL_LOAD_TEST_2026-10-18.md`.
