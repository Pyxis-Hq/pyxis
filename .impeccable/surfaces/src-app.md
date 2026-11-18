---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief: Pyxis app (whole MVP), revision 2

Scope: Operate (app), with a Persuade landing page inside the same world. Replaces the earlier Statistical Atlas light world after the user found it generic and asked for competitor-informed direction. Source: docs/design-teardown.md.

Audience and job: Stellar project builders reading their own API, web and wallet-funnel numbers and setting up ingestion; operators reading aggregates only. Constraints: PRODUCT.md (no adoption, uptime or compliance claims; definitions beside numbers; wallet events frontend-reported). Backend additions stay additive.

Chosen direction (pinned by the user): "dark-first mission control" with an electric violet accent. The user named both the theme and the accent.

## Direction contract

THESIS: A mission-control surface for Stellar projects: near-black, hairline-bordered, with numbers set in a mono voice and one electric violet that marks action, selection and the live series. It refuses the default SaaS arrangement of white panels, navy ink and a stock blue accent.

OWN-WORLD: Near-black ground tinted toward violet (oklch hue about 285), panels one step lighter, 1px low-alpha white hairlines instead of shadows, 4px radius. Electric violet (oklch 0.6 0.21 292 for fills, 0.78 0.14 292 for text) only for primary action, selected state, focus and the live series. Red is 5xx and failure, amber 4xx and warning, cyan 3xx, green success. Geist for UI, Geist Mono for every figure, address and route, with 11px tracked uppercase labels. Light theme is out of scope for now.

STORY: The visitor sees at a glance what changed, against the previous period, and where the trouble is; definitions stay one hover away. A new project goes from create, to key, to settings, to first data point without leaving the app.

FIRST VIEWPORT: Left rail (240px) with brand, project switcher, nav, account. Page header with range control and the primary action. Then a KPI strip: five cells with mono values, delta chips against the previous period and the previous value beneath. Then the request chart with 5xx overlay and a shaded incident window where the error rate breaches, beside the status-class multiples. Then the endpoints table: mono routes with dimmed params, tinted breach cells, and the shared-scale trend column.

FORM: dark mission control (Vercel Observability, Symbiotic app, Plausible report structure as references, per docs/design-teardown.md). seed: none (pinned) "dark-first mission control with electric violet".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
