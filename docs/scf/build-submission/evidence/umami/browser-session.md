# Controlled browser session (web analytics)

**Status:** OBSERVED. A real browser session by the team on the demo site; **not external traffic**.

- **Site:** <https://pyxis-demo-dapp.vercel.app> (the team's own demo site, labelled as a controlled demonstration).
- **Window:** 2026-11-20 05:37:30 to 05:37:47 UTC (Umami server timestamps).
- **Actions:** navigated `/`, `/about`, `/pricing`, `/wallet`, `/about`, `/`, `/wallet`; clicked the custom-event button repeatedly (10 clicks). The wallet session followed on `/wallet`.
- **Tracking:** the real Umami `script.js` loaded from the configured instance with `data-domains` set to the demo host. No direct inserts, no fabricated posts.
- **Client reported by Umami:** Edge (Chromium), Windows 10, laptop, 1366x768, language en-US.

Limits: one visitor, one session. A page refresh cannot be told apart from a page view in the data. Real-world adoption cannot be inferred.
