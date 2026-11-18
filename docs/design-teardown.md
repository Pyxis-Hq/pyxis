# Pyxis: competitor and reference design teardown

Method: headless-Chrome screenshots of public pages, viewed by the team, plus colors, fonts and sizes read from page source where it could be fetched. Values marked "approx" are estimated from screenshots. Evidence limits are listed at the end; several app screens were gated, blocked or still loading.

## 1. Competitor map (same space)

| Group | Product | Overlap with Pyxis | Visual strength (1-5) |
|---|---|---|---|
| Web3 / Stellar analytics | Formo | Highest: web analytics, wallet funnel, KPI strip | 4 |
| | Nansen | Wallet-labelled onchain tables | 4 |
| | Stellar Expert | Same chain and audience; explorer, not SaaS | 3 |
| | Dune, Artemis, DappRadar, Flipside | Public chain dashboards | not assessed (blocked, parked or splash only) |
| Privacy web analytics | Plausible | Web analytics report, goals, funnels | 4 |
| | Simple Analytics, Fathom, Pirsch, Cabin | Same job, different personalities | 3.5-4 |
| | Umami | The engine Pyxis already uses | 2.5 |
| | Vercel Analytics, PostHog | Route table, funnels | 4.5 / 3 |
| API observability | Vercel Observability | Closest match to the API half: route, error rate, latency, requests | 5 |
| | Axiom, Dash0, Better Stack | OpenTelemetry-era tooling | 4 |
| | Sentry, Honeycomb, Grafana Cloud | Heavier or more dated | 2-4 |
| | Datadog | Incumbent; not assessed (capture hung) | n/a |

## 2. The six references you named

**symbiotic.fi (marketing).** Light ground with a black announcement bar. One hot lime (`#befb5b`, `#a3f12a`) against dark-green ink (`#011A0F`) and near-black text. Suisse Intl. A monochrome isometric tile illustration where lime is used only as a signal. One CTA per screen. Lesson: one saturated accent plus one owned illustration beats a palette.

**app.symbiotic.fi (deposit, dashboard).** Pure black (`#000`) with `#0D0D0D` panels, an all-caps monospace face (Berkeley Mono), 1px hairlines at about 20% white, square corners, and lime (`#B6FF3E`) as the only interactive color. The nav is a strip of bordered cells with a lime underline on the active tab. Table rows are separate hairline boxes. The dashboard has a designed empty state (icon, caps title, one sentence) and a lime-framed onboarding banner. Hover changes color only, over 300ms. Not captured: loaded tables, charts, badges, and the networks page.

**sui.io.** Pure black hero with one electric blue (`#298dff`), a roughly 100px tight-tracked grotesk display, mono metadata (TWK Everett Mono), 0px radius, a floating inset nav with square icon chips, film grain, and a motion-blurred warp-tunnel hero that is the brand. Strong identity, but no data shown. Below-the-fold sections not captured.

**lido.fi.** Warm off-white with pastel gradient atmosphere and glassy 3D objects, the opposite of dark crypto. A giant light-weight token name as hero type. Live TVL and APR sit beside the Stake button, in full-precision numbers with asterisk-footnote definitions. White 24px-radius cards, a trust wall of auditors, and a docs shell with spec rows (icon, bold value, gray caption).

## 3. What the best of them share

1. One saturated accent that is not default blue, used only for action, selection and the live series (Symbiotic lime, Nansen mint, Axiom orange, Plausible indigo, Pirsch green).
2. A deliberate type voice for numbers: a mono or a display face for figures, tracked uppercase micro-labels for chrome.
3. Hairline borders instead of shadows; one radius personality.
4. The table is the hero, and doubles as the legend (Vercel).
5. Quiet charts: one series, thin line, almost invisible grid, anomaly shown as a tinted time window.
6. Marketing shows the real product, cropped and framed, not stock art.
7. A signature object: Symbiotic's tile cube, Sui's tunnel, Lido's glass objects, Formo's wallet card.

## 4. Why Pyxis reads as generic (diagnosis)

- White, navy ink and a default-feeling blue is the category's lowest-risk palette, and nothing is ownable.
- Every chart is the same navy bar; there is no semantic or sequential color system for series.
- One typeface at one voice; figures and labels are not differentiated.
- Panels are uniform shadcn-style boxes; there is no hero object on any screen.
- The landing page has no signature object and no atmosphere; the sample is a screenshot-like panel.

## 5. Ranked ideas to apply

1. **Choose a non-blue signature accent** and a theme stance (see decision below). Use it only for action, selection and the live series.
2. **Give numbers their own voice:** mono (Geist Mono) or a display face for KPI values, addresses and routes; 11px tracked uppercase labels. (Plausible, Symbiotic, Cabin, Sui)
3. **Selectable KPI strip with deltas and sparklines:** one card, 5-6 cells split by hairlines, a delta chip with the previous value beneath, an accent underline on the selected cell that drives the chart. (Plausible, Formo, Pirsch)
4. **Status-class stacked stair-step chart** (blue 2xx, amber 4xx, red 5xx) with a chip legend, replacing the plain bars. (Vercel)
5. **Route table as the hero:** mono routes with dimmed `:param` segments, a red tint only on breached cells, dim zeros, a fade at the bottom; the trend column stays. (Vercel)
6. **Incident window band on the chart:** an 8-10% red wash between dashed edges with a one-line label, and a dashed tail for the incomplete bucket. (Vercel, Simple Analytics)
7. **Annotations on the time series** for releases, contract deploys and protocol upgrades. (Simple Analytics) A strong fit for Stellar.
8. **Row-tint breakdown lists** (bar as a tint behind the whole row) in tabbed cards: Pages / Entry / Exit. (Plausible)
9. **Inline metric definitions** with a "?" tooltip beside each label. Almost no competitor does this, and it is already a product principle.
10. **Designed empty and loading states:** skeletons shaped like the final chart; an empty panel with an icon, a title and one sentence. (Stellar Expert, Symbiotic)
11. **Marketing hero built from real, live-feeling data** (Vercel's hero graph, Lido's stats beside the action), with a framed product tour with tabs for API / Web / Wallet funnel. (Formo, Vercel, Lido)
12. **One signature object** that is ours: for example a generative "pulse" built from real or sample endpoint series, in the accent color. (Symbiotic cube, Sui tunnel as precedent.)
13. **Wallet profile card** as the visual for the funnel (mono address, chips, score), only with labels Pyxis can actually compute. Note: PRODUCT.md says no addresses are stored in analytics, so use only as an illustration of a synthetic wallet.
14. **Motion values:** reveals with cubic-bezier(0.16,1,0.3,1) at 400-700ms; hovers 150-200ms, color only.

## 6. Do not copy

Symbiotic's lime and pixel logo; Sui's tunnel and claims; Lido's drop branding and auditor logos; Plausible's indigo layout verbatim; Formo's lime plus deep-teal pairing; Nansen's blurred tilted device mock; Stellar Expert's chamfered corners and low contrast; Sentry's mascot; any logos, copy or illustrations; all-caps for everything; 0.5-alpha gray secondary text; very loose row spacing; heavy gradients behind data.

## 7. Evidence limits

- Blocked or not usable: Dune (Cloudflare wall), DappRadar (wall), Flipside (parked domain), Datadog and Grafana's live demo (capture hung), Ortege (never completed).
- Symbiotic app: only skeleton and empty states captured; networks page missing.
- Fathom and Umami demos unavailable (404, login); marketing mock-ups used.
- Sui below-the-fold and Lido's font family and some colors unconfirmed.
- Several token values are approximate.

Screenshots: `scratchpad/teardown/<group>/` in the session scratchpad.
