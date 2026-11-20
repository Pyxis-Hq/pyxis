# Tested workflows

**Date:** 2026-11-20 (times UTC, server clock; the capture machine's clock ran about 30 seconds behind). **Environment:** Windows 11, real Google Chrome driven by Playwright (headed, 1920×1080, fresh profile, no wallet extension), ffmpeg 8.0.1, Node 24. **App under test:** <https://usepyxis.xyz> (deployed from commit `3a7860b`). **Umami:** 2.20.2 demonstration instance. **Identity used:** a throwaway Testnet keypair (never funded, secret never stored or shown), signed in through the public sign-in endpoint. The team's own wallet and logged-in session were **not** used.

| # | Workflow | What was done | Outcome |
|---|---|---|---|
| 1 | Sign-in with a throwaway key | Challenge, correct signature, session cookie injected into Chrome | Worked (HTTP 200); also a positive control for the forged-signature test |
| 2 | Project and ingest key | Created project "Capture demo project" and key `capture-otel` through the API; viewed both in the UI | Worked |
| 3 | API dashboard, before | Opened the new project | Worked: honest empty state (0 requests, "2 of 4 done" checklist) |
| 4 | Real OpenTelemetry ingestion | A local HTTP service instrumented with the **stock OpenTelemetry Node SDK**, configured only by the documented env vars (OTLP/HTTP JSON, delta temporality, ingest key). Run 1: plain `http` instrumentation, 150 requests. Run 2: Express instrumentation, 120 requests | **Worked.** Pyxis showed 270 requests; 2xx 242, 4xx 22, 5xx 6, exactly the sums the client counted (110+25, 12, 3 and 85+22, 10, 3). p50 92.9 ms, p95 550 ms, p99 910 ms |
| 5 | Route naming | Compared routes between the two runs | Express run: templated routes (`/accounts/:account`, `/contracts/:contract`, `/transactions`, `/health`). Plain `http` run: all routes `/_unmatched` (see feature-status) |
| 6 | Web analytics site | Added `pyxis-capture-site.vercel.app` (a new minimal Vercel site), published the verification token at `/.well-known/pyxis.txt`, clicked verify through the API | **Worked** (verified via HTTP file); Pyxis created the Umami website itself |
| 7 | Real browser traffic | Headed Chrome browsed Home, About, Pricing, Home, a custom-event click, a reload, About; waited for Umami | Worked: Umami recorded 6 page views, 1 visitor, 1 visit, 15 s, bounce 0, Chrome/Windows 10/desktop, NG, 1 custom event |
| 8 | Pyxis vs Umami | Compared the Pyxis web analytics page with Umami's API | Matched on page views, visitors, bounce, session time, country, browser, device, referrers |
| 9 | Key revocation | Revoked the key in the UI (confirm step), then sent one request with it | UI showed **Revoked**; the request returned **401 `auth_revoked`** |
| 10 | Project settings | Opened Settings | Worked (project, wallet-based team, account) |
| 11 | Docs pages | Captured the OpenTelemetry guide and the SDK reference | Captured; SDK page contains a stale version string (see findings) |
| 12 | npm package page | Tried to capture it | **Blocked** by a Cloudflare "Just a moment…" challenge; the capture was discarded |
| 13 | Wallet connect, sign, Testnet payment | **Not run in this session** (no wallet extension and no approvals available to automation) | The video reuses the team's own earlier evidence (see below) |
| 14 | Wallet failure events | Not run | Not demonstrated |

## Re-used earlier evidence in the final video
- Wallet signing prompt (Varial) and wallet funnel page: the team's own 2026-11-20 screenshots from `../` (the evidence folder). For the video they were **cropped to remove browser tabs and masked over wallet addresses**. The originals in the repository still show the tabs and partial addresses.
- Testnet payment card: the previously verified transaction (see [testnet-transactions.md](testnet-transactions.md)). No new transaction was submitted.

## Honest limits
- The API requests come from a local test service **built for this capture**. Its latencies are artificial delays coded into the service, so the latency figures show that Pyxis measures and aggregates correctly, not that any API is fast or reliable.
- One visitor, one session, one machine. Not adoption.
- Chrome was run **headed**; headless browsers are usually filtered out as bots by Umami, and this was not tested.
- Referrers were not generated; time-range filters were clicked but their results were not verified one by one.
