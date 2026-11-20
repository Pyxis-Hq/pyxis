# Pyxis demo video: script and production plan

**Audience:** SCF Build reviewers (technical and non-technical), watching on a laptop, often muted at first. **Target:** 2:58 as scripted, hard cap 2:59 (the form wants under 3 minutes, 16:9, on YouTube or Vimeo). **Voice:** calm, plain, specific; no hype words. **Status:** v2 for your review (script and production plan in one document); nothing has been produced yet. Voice decided: Artaius.

## 1. Creative direction

**Idea.** Show a real wallet signing a real Testnet transaction, then let the viewer see the two kinds of proof side by side: what the app *reports* and what the *ledger confirms*. That distinction is the product's integrity and the reason a reviewer should trust everything else we say. We state what is missing before they find it.

**Arc.** Problem (15 s) → what it is (12 s) → how it works (28 s) → live proof (35 s) → dashboards (25 s) → honest status (20 s) → what the award builds (25 s) → how to use it (18 s).

**Rules for every frame**
1. Only show real captures of the real app. No mock data, no stock "dashboards".
2. Every claim on screen carries a provenance chip: **LEDGER-VERIFIED** (green), **FRONTEND-REPORTED** (amber), **INTERNAL DEMO** (grey), **PLANNED** (violet outline). A chip is on screen whenever its fact is.
3. Nothing planned is shown as working. Soroban appears only in the "funded scope" scene, as a chip-marked plan.
4. No secrets: blur the ingest key; wallet addresses stay truncated (`GB7H…65E5`); no seed phrases or keys, ever.

## 2. Look and motion

| Element | Spec |
|---|---|
| Canvas | 1920×1080, 30 fps, 16:9 |
| Palette | Match the app: near-black background (about `#0E0E13`, `--background: oklch(0.14 0.012 285)`), violet primary (`oklch(0.55 0.22 292)`), success green (`oklch(0.76 0.15 155)`), warning/danger orange-red for the "reported" chip. Sample exact values from the live app |
| Type | Geist (headings, captions) and Geist Mono (hashes, code). Min caption size 36 px; max two lines |
| Motion | One easing curve everywhere (ease-out, 220–320 ms in; 180 ms out). Cuts on VO beats. Screen recordings get a slow 100→104% push, never a spin or whip. One highlight ring (violet, 2 px) to direct the eye |
| Transitions | Hard cut inside a scene; 12-frame cross-dissolve only between acts. No glitch, no zoom-blur |
| Captions | Burned in, mirrors the VO, sentence case |
| Audio | VO clean at -16 LUFS; low, non-melodic bed 20 dB under VO; no sound effects except one soft "tick" when a provenance chip lands |
| Logo | Pyxis mark (three bars on a violet square, `src/components/pyxis/logo.tsx`) top-left on the title and end cards only |

## 3. Scene-by-scene script

VO runs at roughly 2 to 2.6 words per second, with a breath between sentences.

### Scene 1 · The problem · 0:00–0:15
**Picture.** Black. A single line types in Geist Mono: three questions stack up as the VO speaks them, each fading to grey when the next arrives: `Who visits our site?` / `How is our API doing?` / `Where do wallet users drop off?`
**VO (36 words).** "Stellar teams ship fast. But few can answer simple questions: who visits our site, how is our API performing, where do users drop off when they connect a wallet? Generic tools were never built for Stellar."
**Sound.** Bed fades in under the last sentence.

### Scene 2 · What it is · 0:15–0:27
**Picture.** Cut to the live landing page (`usepyxis.xyz`), slow push in on the headline. Logo lock-up appears top-left.
**On screen.** `Pyxis` / `Privacy-first analytics for Stellar`
**VO (28 words).** "This is Pyxis: privacy-first analytics infrastructure for the Stellar ecosystem. Website, API and wallet analytics in one shared platform, with every project's data isolated from every other."

### Scene 3 · How it works · 0:27–0:55
**Picture (motion graphic, built in the editor, about 25 s).** Three source icons enter left in sequence: **Website** (tracker), **API** (OpenTelemetry), **Wallet** (SDK). Lines flow right into one box labelled **Pyxis**, which splits into **Dashboards**. Inside the Pyxis box a small padlock-and-wall icon appears with `Row-level isolation per project`. A final strip: `Counts and percentiles only. No addresses. No signatures. No transactions.`
**On screen (as each source lands).** `Umami tracker` · `OpenTelemetry (OTLP/HTTP JSON)` · `@pyxis-hq/wallets-kit`
**VO (57 words).** "Three sources feed one platform. A verified tracker sends website traffic to Umami. Any service can send API metrics with standard OpenTelemetry. And a small SDK reports wallet engagement. Pyxis stores aggregates only: counts and percentiles, never addresses, signatures or transactions. Each project sees only its own data, enforced by the database itself."
**Truth check.** OTLP is **JSON only** today (protobuf is funded work), so the label says "OTLP/HTTP JSON". Isolation claim: forced row-level security, tested on a real PostgreSQL (EV-006).

### Scene 4 · Live proof on Testnet · 0:55–1:30
**Picture (real capture, 35 s).**
1. `0:55` Sign-in page → "Connect wallet" → Stellar Wallets Kit picker → **Varial** signing prompt (`Pyxis sign-in (testnet)`, wallet `GB7H…65E5`, Test Net) → projects page. Chip: **INTERNAL DEMO**.
2. `1:08` Demo dApp (`pyxis-demo-dapp.vercel.app/wallet`): wallet connected, confirmation, **Activity log** lines: signed → submitted → `LEDGER-VERIFIED via Horizon: successful=true ledger=5825901`.
3. `1:20` Stellar Expert page for the transaction (see Section 4, capture C4): hold on the hash, `Successful`, ledger `5,825,901`. Chip lands: **LEDGER-VERIFIED**.
**On screen.** `Stellar Testnet` badge throughout; `1 XLM · account to itself · ledger 5,825,901`.
**VO (65 words).** "Here it is for real, on Stellar Testnet. Sign in with a Stellar wallet: no password, no email. You sign a one-time message, and no funds move. In our demo app we connect a wallet and send one test XLM. Then we check Stellar's own network: ledger five million, eight hundred twenty-five thousand, nine hundred one. Successful. Confirmed by the ledger, not by our app."

### Scene 5 · The dashboards · 1:30–1:55
**Picture (real capture, 25 s).**
1. `1:30` **Wallet funnel** page: six bars, 1 each, banner "Frontend-reported, not ledger-confirmed" highlighted. Chip: **FRONTEND-REPORTED**.
2. `1:42` **Web analytics** page for `pyxis-demo-dapp.vercel.app`: 7 page views, 1 visitor, 0.0% bounce, 16 s. A split-screen inset shows Umami's own API values matching. Chip: **INTERNAL DEMO**.
**VO (47 words).** "Back in Pyxis, the wallet funnel shows every step, and says plainly that these events are frontend-reported, not ledger-confirmed. The web analytics page matches Umami's own numbers: seven page views, one visitor, sixteen seconds. A controlled internal session, and we label it that way."
**Note.** Re-capture the web analytics page before use; the earlier screenshot predates the wording fix.

### Scene 6 · Honest status · 1:55–2:15
**Picture.** Clean two-column card on the dark background, items appearing one per beat. Left, green ticks: `Live app` · `Open source, Apache-2.0` · `Published SDK on npm` · `Automated tests, CI green`. Right, amber dashes: `No external adopters yet` · `API ingestion built and tested, not yet demonstrated with live traffic`.
**VO (51 words).** "What exists today: a live app, open source under Apache 2.0, a published SDK on npm, and automated tests with continuous integration. What doesn't yet: external adopters, and live API ingestion. That pipeline is built and tested, but not shown with real traffic. We'd rather show you the gap than hide it."
**Truth check.** Re-run `npm test` and check CI on the latest commit before recording; the figure last verified was 80 tests (commit `a7df1da`). Say "automated tests", not a number, unless re-verified.

### Scene 7 · What the award builds · 2:15–2:40
**Picture.** Roadmap strip, three blocks sliding in left to right, each with a **PLANNED** chip: `Soroban and Stellar observability` · `Production hardening and threat model` · `Mainnet launch`. Under the first block, small text: `Contract events and invocation metrics, checked against RPC and ledger data`.
**VO (42 words).** "The award funds what makes Pyxis Stellar-native: Soroban and network observability, with contract events and invocation metrics checked against RPC and ledger data. Plus production hardening, a threat model, and a Mainnet launch that SCF projects can rely on."
**Truth check.** Nothing in this scene exists yet; every item keeps the PLANNED chip. Do not show a Soroban screenshot or mock.

### Scene 8 · How to use it · 2:40–2:58
**Picture.** Split: left, a terminal typing `npm install @pyxis-hq/wallets-kit`; right, the docs site (`docs.usepyxis.xyz`) hero. End card: logo, three URLs, then the three team names with roles.
**On screen.** `usepyxis.xyz` · `docs.usepyxis.xyz` · `github.com/Pyxis-Hq/pyxis`. No team names or team mention anywhere in the video (decision).
**VO (27 words).** "To try it, install the SDK, read the docs at docs dot usepyxis dot xyz, or open the repo. Pyxis: shared analytics infrastructure for the Stellar ecosystem."

**Total VO: 353 words over a 178-second timeline (about 2.0 words per second including pauses).** If the edit runs past 2:59, cut the second sentence of Scene 6 first, then trim Scene 3's isolation sentence.

## 4. Capture list (what must be recorded before editing)

| # | Capture | How | Notes |
|---|---|---|---|
| C1 | Landing page scroll | Screen record `usepyxis.xyz`, 1080p, browser chrome hidden | Capture after the wording fix is live |
| C2 | Sign-in with Varial, up to the projects page | Screen record; **or** use stills from `evidence/wallet-run/screenshots/` | Stills are acceptable fallback; keep the wallet popup visible |
| C3 | Demo dApp connect, confirm, sign, submit, Activity log | Screen record `pyxis-demo-dapp.vercel.app/wallet` | **Option A (recommended):** reuse the verified transaction by recording only Stellar Expert (C4) and showing the earlier Activity log text. **Option B:** record a fresh run; it creates a new hash, so verify it on Horizon first and use that hash everywhere in the video |
| C4 | Stellar Expert page for `9909a163…0322` | Screen record, hold 4 s on status, ledger and hash | Testnet explorer link is in `traction-evidence.md` |
| C5 | Wallet funnel and web analytics pages | Record live, 7-day range | **Blur or crop the sidebar account if you prefer**; re-capture web analytics (old "pinned" wording in the earlier still) |
| C6 | Keys & setup page (OpenTelemetry settings) | Record scrolling the exporter settings; **do not** show a real key | Use only if time allows; shows onboarding, not data |
| C7 | Docs site and npm page | Short scroll recordings | `docs.usepyxis.xyz`, npm package page |
| C8 | Terminal `npm install @pyxis-hq/wallets-kit` | Record in a clean terminal | Real command; no secrets |

## 5. Voice and rights
- **Narration (decided):** synthetic voice **Artaius, calm British narrator** (ElevenLabs voice id `b7MDAvO8w5EIC2H7xdXI`, model `elevenlabs_tts_v4`). It is a library voice, not an imitation of any real person. Delivery: steady, factual, no emotion tags; stability 0.6, similarity 0.5, fixed seed so a re-render matches.
- **People on camera:** none, so no likeness consent is needed. Adding any person later means every person shown must consent, because the legal acknowledgements grant SDF publication rights over name, likeness and voice.
- **Music:** one royalty-free instrumental bed from invideo's stock music library, no vocals; keep the licence record.
- **Disclosure:** the video uses a synthetic voice. If SCF or the platform asks, say so; do not present it as a human recording.

## 6. Production plan (invideo, through its MCP)

**Already done (no credits spent):** invideo project created at <https://invideo.io/@ebubechis-workspac-2/pyxis-scf-demo-video>; brand guide and brief written into it; five real screenshots uploaded (sign-in page, wallet picker, Varial signing prompt, projects page, wallet funnel).

| Phase | What happens | Who | Credits |
|---|---|---|---|
| P0 Review | You review this document and answer Section 7 | You | 0 |
| P1 Voice | Generate eight narration clips, one per scene, with Artaius; check each by transcript (`audio.transcript`) against the script and measure loudness; trim silences | Me | about 7 (3.2 credits per 1,000 characters, about 2,150 characters); cap 12 |
| P2 Timeline | Create a 1920×1080, 30 fps timeline. Tracks: V1 footage and stills, V2 graphics and provenance chips, V3 captions, A1 narration, A2 music. Scene lengths follow the real narration durations, then the whole is fitted under 2:59 | Me | 0 |
| P3 Graphics | Build the on-screen graphics **in the editor from text, shapes and keyframes** (Scene 1 question lines, Scene 3 architecture diagram, Scene 6 status card, Scene 7 roadmap strip, chips, end card). **No AI-generated video or imagery**: it could invent screens that do not exist | Me | 0 |
| P4 Stills first | Place the five uploaded stills in Scenes 4 and 5 with a slow push; add chips and the highlighted "frontend-reported" banner | Me | 0 |
| P5 Your footage | You record or capture C1, C4, C5 (web analytics re-capture), C7 and C8; I upload and swap them in. Until then those slots hold clearly marked placeholder cards that never appear in the export | You, then me | 0 |
| P6 Music and mix | Pick one low instrumental bed (stock library), duck it under narration, set narration near -16 LUFS | Me | stock music licence cost, if any: I will check the price before adding and ask you if it costs credits |
| P7 Captions | Burn in captions from the narration transcript (sentence case, two lines maximum) | Me | 0 or small |
| P8 QA | Render frames at every scene change (`capture`), run `check_timeline`, verify total length, check every spoken and on-screen claim against the truth ledger (Section 8), and confirm no secret, team name, round or dollar figure appears | Me | 0 |
| P9 Export and publish | Export 1080p MP4 and give you the file and project link. You upload it to YouTube (unlisted) or Vimeo and put the URL in field A9 | Me, then you | export cost, if any: I will check first |

**Budget guardrail:** expected spend is under 20 credits of your 172.4. I will do a `dry_run` before every charged action and stop to ask if any step would exceed what I quote here.

**Order of work and what is blocked:** P1–P4 and P6–P8 can run now on the stills and graphics. P5 depends on your captures. Without P5 the video is complete except Scenes 2, 4 (Stellar Expert) and 8 (docs, npm, terminal), so a full first cut needs those captures. Fallback if you cannot record them: I build Scene 2 from a still of the landing page you capture, Scene 8 from text cards, and Scene 4's ledger proof from a text card quoting the Horizon result with the explorer link. It works, but it is flatter.

**Known weak point:** Scenes 4 and 5 are mostly stills with motion, not live screen recordings. That is honest and acceptable, but a 20-second real screen recording of the sign-in and demo flow would make the video feel more alive. Record it if you can; the script works either way.

**What I will not do:** generate fake dashboards, show Soroban visuals, invent numbers, add stock footage of "analytics", use any real person's voice or likeness, or name the team.

## 7. Decisions
**Decided (2026-11-20):**
1. **Voice:** synthetic, **Artaius (calm British narrator)**; no imitation of any real person; no on-camera people, so no likeness consent is needed.
2. **Transaction:** Option A. Reuse the verified hash `9909a163…0322`; record only the Stellar Expert page and use the existing Activity log text and stills. **No new transaction is made.**
3. **Team:** not mentioned anywhere in the video.

**Still open (defaults assumed until you say otherwise):**
4. No SCF round or dollar figures in the video (they belong in the form).
5. Soroban wording "checked against RPC and ledger data" stays as the planned design, chip-marked PLANNED.
6. **Footage:** which captures from Section 4 can you provide (C1, C4, C5, C7, C8 are the needed ones), and do you want to record the optional 20-second sign-in and demo screen recording?
7. **Spending:** is the cap of about 20 credits (of 172.4) acceptable?
8. **Approval:** reply "approved" (or list changes to the script wording) and I start P1.

## 8. Truth ledger for this video

| On-screen or spoken claim | Status | Evidence |
|---|---|---|
| Live app; Apache-2.0; npm SDK; CI green | VERIFIED | [EVIDENCE-REGISTER.md](../EVIDENCE-REGISTER.md) EV-001, EV-005, EV-030 |
| Wallet sign-in with a real wallet (Varial, Testnet) | VERIFIED, internal | [authentication-verification.md](../evidence/wallet/authentication-verification.md) |
| Ledger 5,825,901, successful, 1 XLM, self-payment | VERIFIED on Horizon | [transaction-verification.md](../evidence/wallet/transaction-verification.md) |
| Wallet funnel events are frontend-reported | VERIFIED (UI says so) | [dashboard-verification.md](../evidence/dashboard/dashboard-verification.md) |
| 7 page views, 1 visitor, 0% bounce, 16 s | VERIFIED, one internal session | [analytics-verification.md](../evidence/umami/analytics-verification.md) |
| Isolation enforced by the database | VERIFIED by tests on a real PostgreSQL | EV-006 |
| API ingestion built and tested, not shown live | VERIFIED (tests; screenshot shows 0 requests) | report 02 |
| Soroban observability, hardening, Mainnet | PLANNED, never shown as working | roadmap |
| External adopters | ABSENT, stated on screen | EV-070, EV-071 |
