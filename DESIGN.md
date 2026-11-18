---
name: Pyxis
description: A dark mission-control surface for Stellar project analytics. Near-black violet-tinted ground, hairline borders, mono figures, one electric violet for action, selection, focus and the live series. Dark only.
colors:
  ground: "oklch(0.14 0.012 285)"
  rail: "oklch(0.115 0.012 285)"
  panel: "oklch(0.18 0.014 285)"
  panel-muted: "oklch(0.21 0.015 285)"
  panel-secondary: "oklch(0.22 0.016 285)"
  popover: "oklch(0.2 0.016 285)"
  rail-active: "oklch(0.24 0.04 290)"
  hover-wash: "oklch(0.25 0.03 290)"
  ink: "oklch(0.97 0.006 285)"
  ink-muted: "oklch(0.72 0.02 285)"
  hairline: "oklch(1 0 0 / 0.09)"
  hairline-strong: "oklch(1 0 0 / 0.17)"
  field-edge: "oklch(1 0 0 / 0.16)"
  violet: "oklch(0.55 0.22 292)"
  violet-on: "oklch(0.99 0.004 292)"
  violet-text: "oklch(0.8 0.12 292)"
  violet-series: "oklch(0.65 0.15 292)"
  violet-ring: "oklch(0.72 0.17 292)"
  fail-red: "oklch(0.68 0.2 25)"
  warn-amber: "oklch(0.8 0.15 80)"
  warn-ink: "oklch(0.86 0.12 85)"
  redirect-cyan: "oklch(0.78 0.1 215)"
  ok-green: "oklch(0.76 0.15 155)"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.06em"
  figure:
    fontFamily: "Geist Mono Variable, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "1.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
rounded:
  hairline: "1px"
  bar: "2px"
  chip: "3px"
  base: "4px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  rail: "240px"
  page-max: "84rem"
components:
  button-primary:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.violet-on}"
    rounded: "{rounded.base}"
    height: "36px"
    padding: "0 12px"
  button-outline:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    height: "36px"
    padding: "0 12px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "16px"
  stat-cell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    padding: "14px 16px"
  segmented-selected:
    textColor: "{colors.violet-text}"
    rounded: "{rounded.chip}"
    padding: "0 10px"
  delta-chip-bad:
    textColor: "{colors.fail-red}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  delta-chip-good:
    textColor: "{colors.ok-green}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  native-select:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    height: "36px"
  popover:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "10px"
  rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.ink}"
    width: "240px"
---

# Design System: Pyxis

## Overview

**Creative North Star: "Mission Control"**

Pyxis is a console for people watching their own numbers: near-black, hairline-bordered, quiet until something changes. The ground is a near-black tinted toward violet (hue about 285), panels sit one lightness step above it, and 1px low-alpha white lines do the work that shadows and fills do elsewhere. Figures are set in a mono voice and compared against the previous period; labels stay in the sans. One electric violet marks the few things a person can act on or is currently looking at: the primary button, the selected range, the focus ring and the live request series. Everything else is neutral, and the semantic colors (red, amber, cyan, green) each carry exactly one meaning.

The build shows how this landed: the app reads as a dense dashboard with a 240px rail, a breadcrumb bar, and panels laid on a grid and never nested. The landing page uses the same material, adding only a violet atmosphere behind the hero and a stair-step pulse line along its lower edge. Definitions sit beside the numbers they explain, because the product's claims depend on stating what a figure is and is not (PRODUCT.md).

This is a dark system only. The light theme was not designed; `:root` declares `color-scheme: dark` and `<html class="dark">` is fixed. Charts have no annotations beyond the automatic incident window and hover readout.

**Key Characteristics:**
- Near-black violet-tinted ground; panels one step lighter; hairlines instead of shadows.
- Electric violet is the single accent; semantic hues each mean one thing.
- Figures in Geist Mono with tabular numerals; labels and prose in Geist.
- Small multiples on a shared scale; stair-step bars, not smoothed lines.
- 4px corners everywhere; 3px for chips, 1-2px for chart bars and swatches.
- Every metric has a definition one hover, click or focus away.

## Colors

A violet-tinted dark neutral with a single electric accent and four semantic status hues, all in OKLCH.

### Primary
- **Electric Violet** (`{colors.violet}`): primary button fill, selected-state fill (as a 20% wash), sidebar primary, the logo tile. Text on it is `{colors.violet-on}`.
- **Violet Text** (`{colors.violet-text}`): violet as type or icon: the selected segment label, the active nav icon, link buttons, the Empty icon, the current onboarding step, request counts in the chart readout.
- **Series Violet** (`{colors.violet-series}`): the live data series only: request bars in RequestChart, Spark and the wallet funnel bars, and the hero pulse line.
- **Focus Violet** (`{colors.violet-ring}`): the 2px focus-visible outline (2px offset), input caret and field focus ring.

### Neutral
- **Violet-Tinted Ground** (`{colors.ground}`): page background; also the Outline button base and the landing sample frame.
- **Rail Black** (`{colors.rail}`): the sidebar and drawer, one step below the ground.
- **Panel** (`{colors.panel}`): Panel, StatRow, NativeSelect and CodeBlock-adjacent surfaces.
- **Panel Muted** (`{colors.panel-muted}`): segmented track, code blocks, skeletons, chart bar tracks, tinted landing bands (at 60%).
- **Popover** (`{colors.popover}`): Def tooltip and chart hover readout; the only surfaces that are lighter than a panel and carry a shadow.
- **Selection Wash** (`{colors.rail-active}`, `{colors.hover-wash}`): active rail item, accent surfaces.
- **Ink** (`{colors.ink}`) and **Muted Ink** (`{colors.ink-muted}`): primary text and labels, secondary text and axis ticks.
- **Hairline** (`{colors.hairline}`, 9% white): panel borders, table row rules, gridlines. **Strong Hairline** (`{colors.hairline-strong}`, 17% white): chart baselines, Empty dashed border, popover border, landing sample frame. **Field Edge** (`{colors.field-edge}`): input and select borders.

### Semantic
- **Failure Red** (`{colors.fail-red}`): 5xx and failure only: the 5xx overlay and bars, incident window, breach cells, error text, bad delta chips, destructive actions.
- **Warning Amber** (`{colors.warn-amber}`, text `{colors.warn-ink}`): 4xx, warn notices, the synthetic-data label.
- **Redirect Cyan** (`{colors.redirect-cyan}`): 3xx.
- **Success Green** (`{colors.ok-green}`): 2xx, good delta chips, completed onboarding steps, the Live pulse dot, ok notices.

### Named Rules
**The One Accent Rule.** Violet is the only accent and only for action, selection, focus and the live series. If it does not mark something a person can press, has chosen, is focused on, or is the measured series, it is neutral.

**The Red Means Failure Rule.** Red appears for 5xx and failure and nowhere decorative. A bar, cell, chip or window in red is an error condition.

**The Light Theme Is Not Designed Rule.** No light tokens exist. Do not add `dark:` forks or light fallbacks by guesswork; a light theme is a new design task.

## Typography

**Display / Body Font:** Geist Variable (with ui-sans-serif, system-ui, sans-serif)
**Figure / Route Font:** Geist Mono Variable (with ui-monospace, SFMono-Regular, Menlo, Consolas)

**Character:** Geist is a neutral, slightly technical grotesque that stays out of the way; Geist Mono carries every number, route, address and method so columns align and figures read as instrument output. Body sets `ss01` and `cv11` stylistic sets, and prose uses `text-wrap: pretty` with balanced headings.

### Hierarchy
- **Display** (600, 2.75rem to 3.5rem, 1.05, -0.025em): landing hero headline only, max 18ch.
- **Headline** (600, 1.5rem, tight tracking): landing section headings.
- **Title** (600, 1.375rem, 1.75rem line): page titles in PageHeader. Panel titles are 0.875rem at 600.
- **Figure** (Mono 500, 1.75rem, 1, -0.01em, tabular): Stat values; units sit beside at 0.875rem 400 in Muted Ink. Smaller figures use the `tnum` class at 1.25rem (ClassMultiples), 0.75rem (chart axes, ticks, readouts) and inherit it in tables.
- **Body** (400, 0.875rem, prose measure 52 to 65ch): descriptions and table cells. Large landing intro is 1.125rem at 1.75rem.
- **Label** (500, 0.6875rem, 0.06em, uppercase, Muted Ink): Stat labels above a figure only. Table headers, panel asides, hints and legends are sentence-case 0.75rem (500 for headers).

### Named Rules
**The Figures Are Mono Rule.** Anything compared or scanned (counts, latencies, percentages, times, routes, methods, addresses) is Geist Mono with tabular numerals. Labels and sentences are Geist.

## Layout

An app shell over a content column. At 1024px and up, a sticky 240px rail (`15rem`) sits beside the content; below that the rail becomes a 256px drawer opened from a menu button in the 48px top bar. The top bar is sticky, 12 units tall with a 95% ground fill and slight blur, and holds only a breadcrumb (Projects / project / section). Content is capped at 84rem, padded 16px on small screens and 32px from the large breakpoint.

The overview reads top to bottom: PageHeader, an optional onboarding Panel, a five-cell StatRow, then a two-column grid (request chart 1.6fr, status classes 1fr, from the xl breakpoint), then the full-width Endpoints Panel. Spacing is a 4px-based scale in practice: 8, 12, 16 for inside panels, 24px between panels (`gap-6`, `mt-6`). Panels sit on the page grid and are never nested. The landing page uses a 72rem container, full-bleed bands separated by hairlines, and tinted bands at 60% panel-muted.

StatRow is two columns on mobile and three, four or five from the md breakpoint; an odd last cell spans the row on mobile. Endpoint columns drop progressively (p50 and p99 below md, service below lg, trend below sm). Chart SVGs use `preserveAspectRatio="none"` with non-scaling strokes so they stretch to the column.

## Elevation & Depth

Flat and tonal. Depth is conveyed by one lightness step between ground, panel and popover, and by 1px white-alpha hairlines. There are no panel or card shadows.

### Shadow Vocabulary
- **Popover** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4)` approx., Tailwind `shadow-lg shadow-black/40`): the Def tooltip and the chart hover readout only.
- **Selected ring** (`box-shadow: 0 0 0 1px oklch(0.6 0.22 292 / 0.55)`): a 1px violet outline on the selected Segmented option; a ring, not a shadow.
- **Hero atmosphere** (`radial-gradient(60rem 26rem at 75% -4rem, oklch(0.6 0.22 292 / 0.4), transparent 70%)`): landing hero backdrop, the single glow in the system, never used in the app.
- **Drawer scrim** (`bg-black/60`): behind the mobile drawer.

### Named Rules
**The Hairlines Not Shadows Rule.** Surfaces separate with a 1px hairline and a tonal step. Only popovers (Def, chart readout) carry a shadow, because they float over other content.

## Shapes

Small, square-leaning corners. The base radius is 4px (`--radius: 0.25rem`) and applies to panels, buttons, inputs, selects, notices and the drawer's controls. Chips (delta chips, breach cells, the synthetic-data label) use 3px; Segmented options 3px inside a 4px track; chart bars and the stat swatch squares use 1 to 2px; status dots and onboarding step markers are circles. The logo is a 24px tile at 5px radius holding three bars. Borders are always 1px solid hairlines; the Empty state is the one dashed border, and the incident legend swatch is dashed to match the incident window edges.

## Components

Components are instruments: borders over fills, figures over decoration.

**The Definitions Beside Numbers Rule.** A definition (Def) sits beside any number whose meaning is not obvious, and approximations such as percentiles are stated in a hint or footnote.

### Buttons
- **Shape:** 4px radius, 36px default height; sizes xs 24, sm 32, lg 40, plus icon sizes. Text 14px, weight 500.
- **Primary:** Electric Violet fill with near-white text, 12px horizontal padding; hover is the same violet at 90%.
- **Outline / Secondary / Ghost:** Outline is ground-filled with a hairline; ghost shows a panel-muted wash on hover; link variant is Violet Text with underline on hover. Destructive is a red wash, not a solid red.
- **Focus / Press:** a 2px violet-ring outline with 2px offset, plus a 50% ring on controls; pressed buttons shift 1px down.

### PageHeader
Title (1.375rem, 600) with an optional description (max 65ch, Muted Ink) and an actions cluster aligned to the right and bottom. On the project overview the description ends with a Live readout, and the actions are the range Segmented and a Keys action (outline once a key exists, primary when none exists).

### Live readout
A 0.75rem Muted Ink line: a green dot with a ping animation (disabled under reduced motion) and "Live · updated Ns ago" with N in mono, counting seconds since the last successful fetch. The overview refetches every 15 seconds. The dot is green, not violet. It appears only when a fetch time is known.

### Panel
A 4px bordered section on the panel fill with a 44px minimum header row (title 0.875rem 600, optional muted aside on the right) separated by a hairline from a 16px-padded body. A `flush` variant removes body padding for tables.

### StatRow and Stat
A hairline-bordered grid of cells divided by hairlines. Each cell: an 11px uppercase muted label with an optional Def, a 1.75rem mono value with a muted unit, and optional delta chip, then a 12px muted line showing the previous value ("X previously") and a hint. The value turns red when the server error rate is over 1%.

**Delta chips** compare to the previous period via `deltaOf`: a 3px chip with a diagonal arrow (up, down) or a minus, in green wash for good, red wash for bad, muted for flat. Rules: changes under 0.5% read as flat (0%); latency uses lower-is-better with a 5% deadband (`LATENCY_DEADBAND`) inside which the chip stays neutral, because percentiles are histogram approximations; Requests is neutral by definition (never red or green); server errors are lower-is-better and measured in percentage points (shown as "N pt", flat under 0.05 pt). Chips carry a screen-reader "versus the previous period" suffix.

### Def (definition tooltip)
A 14px circle-help icon button beside a label or number. Opens on hover, on keyboard focus, or on click (toggle); Escape closes it and blur outside closes it. The popover is 15rem wide (capped to the viewport), on the popover fill with a strong hairline and the system's single shadow, aligned left or right of the trigger so it never overflows the viewport edge (the last two Stat cells use right). It has `role="tooltip"` and is linked by `aria-describedby`.

### Segmented control
A 32px track on panel-muted with a hairline and 2px inner padding. Options are 12px mono labels; the selected option is a violet 20% wash with Violet Text and a 1px violet 55% ring; unselected is muted, brightening on hover. Uses `aria-pressed` in a labelled group. Violet here means selection.

### NativeSelect
A real `<select>` styled as a field: panel fill, field-edge border, 4px radius, a chevron overlay, height 36px (32px small), hover to the strong hairline, focus to a violet border and 50% ring. Native so it works on touch and with assistive tech. Used for the project switcher and the environment filter.

### Notice
A bordered, tinted block (3.2px radius, 14px text) in four tones: info (violet 5% wash with violet 25% border), bad (red), warn (amber 10% with 50% border), ok (green). Bad notices use `role="alert"`; others `role="status"`. An optional semibold title.

### Empty
A dashed strong-hairline box, centered, with a 36px bordered icon tile (inbox icon in Violet Text), a semibold title, a muted explanation (max 52ch), and an optional action button.

### CodeBlock
A panel-muted block with a hairline: a header row with an "Environment" label and an xs ghost copy button (switches to a check and "Copied" for 1.8s), then a scrollable mono 12px body.

### Status key
An 8px square swatch (1px radius) and a 13px medium label, like a map legend. States: ok green, warn amber, off muted, bad red, info violet.

### ChartSkeleton and Skeleton
Skeleton is a pulsing panel-muted block. ChartSkeleton is 24 pulsing bars of varied height (staggered 40ms) on a strong-hairline baseline, so the chart's footprint does not shift when data arrives.

### RequestChart
A stair of bars, one per time bucket, in Series Violet at 80% of bucket width, with a 5xx overlay in red drawn from the baseline at the same scale. Three horizontal hairline gridlines and a strong baseline; a left axis with 0, half and max (compact numbers). **Incident windows** are runs of buckets where a bucket has at least 3 errors and 5xx at 3% or more of requests: a 10% red wash over the span, dashed red edges, and a label at the top ("hh:mm-hh:mm · worst bucket N% 5xx") in red on a 90% ground chip. **Hover or touch** shows a vertical crosshair, dims the other bars to 55%, and opens a popover readout with the local time, requests in Violet Text and 5xx in red with its share. Three time ticks (start, middle, end, with dates at the ends) in local time; a legend names Requests, 5xx and the incident rule, and states "Times in your local time zone". The SVG has a descriptive `aria-label`. There are no annotations beyond incident windows.

### Spark and ClassMultiples
**Spark** is a 36px small multiple of 24 slices, Series Violet with red 5xx stubs (minimum 1.5 units tall), drawn on a scale shared by every row of the table so a taller bar always means more requests; the column header states the shared maximum. **ClassMultiples** shows 2xx, 3xx, 4xx and 5xx as four small multiples on one 0-100% scale: a code and name, a 1.25rem mono count, a 6px bar on a panel-muted track in green, cyan, amber or red, and a share caption. A non-zero share renders at least 1% wide.

### Endpoints table
Hairline-ruled rows, 36px headers (12px 500 muted), 10px row padding, row hover wash. Method and route are mono 12px; **routes render with dynamic segments dimmed** (`:id`, `[slug]`, `{id}` in muted ink) so the static shape reads first. Figures are right-aligned tabular mono. **Breach-tinted 5xx cells**: a 5xx rate over 1% gets a 3px red 15% pill with red text; zero reads muted. Sortable headers carry `aria-sort` and a down arrow. A filter field and environment select sit in the panel header; a footnote states the latency approximation and the shared trend scale.

### Navigation (app shell)
The 240px rail holds the logo and name, the project switcher (a NativeSelect), the primary nav (API metrics, Web analytics, Wallet funnel, Keys and setup, Settings), a workspace group below a hairline, and at the bottom a "Stellar testnet" line with the Stellar network mark, a truncated mono account and a ghost Sign out. Nav items are 32px, muted by default; the active item gets the rail-active fill, ink text, a Violet Text icon and `aria-current`. The top bar's breadcrumb is muted with the current section in ink 500. On mobile the drawer is 256px, opened over a `black/60` scrim that closes it; it also closes on navigation.

### Onboarding checklist
A Panel titled "Get your first data point" with an "N of 4 done" aside, shown on a project overview until data exists. Four steps in a four-column grid: a 20px circular marker (green fill with a check when done, a violet outline with Violet Text numeral when current, a muted outline when pending), a title, a muted description, and, for the current step only, a small primary button.

### Landing hero and sample
A full-bleed hero: a violet radial atmosphere at the upper right, and along the bottom edge a stair-step pulse line (the same request series as a path, Series Violet at 70% opacity, a faint area fill, masked to fade upward, with a red 8% incident band). Left: a 56px headline, intro, primary and outline CTAs, and a one-line reassurance. Right: a figure framed with a strong hairline holding the incident RequestChart on labeled synthetic data. Below, a tinted band shows a sample project: the five Stat cells, ClassMultiples and an endpoints table with Spark trends, under an amber "Synthetic sample data" label.

### Logo
A 24px violet tile with three white bars on a shared baseline (55%, 100%, 80% opacity), a small multiple whose tallest bar stands for the live series.

## Do's and Don'ts

### Do:
- **Do** use Electric Violet only for primary action, selected state, focus and the live series.
- **Do** put a definition (Def) beside any number whose meaning is not obvious, and state approximations (percentiles) in a hint or footnote.
- **Do** set figures, routes, methods, times and addresses in Geist Mono with tabular numerals; keep labels and prose in Geist.
- **Do** separate surfaces with a 1px hairline and a one-step tonal change; reserve the shadow for popovers.
- **Do** compare against the previous period with delta chips, keep Requests neutral, and keep latency changes under 5% neutral.
- **Do** draw trends as small multiples on a shared scale, and label that scale.
- **Do** keep red for 5xx and failure, amber for 4xx and warnings, cyan for 3xx, green for 2xx and good change.
- **Do** keep corners at 4px (3px chips, 1-2px bars) and panels un-nested on the page grid.
- **Do** disable animation under `prefers-reduced-motion`, as the global rule does.

### Don't:
- **Don't** introduce a second accent hue or use violet for decoration, 4xx, or status.
- **Don't** use red for anything that is not 5xx or failure, and don't use green or red for the Requests delta.
- **Don't** add card shadows, glows, or gradients in the app; the hero atmosphere is landing-only.
- **Don't** nest a panel inside a panel, or round corners beyond 4px.
- **Don't** design or assume a light theme; none exists.
- **Don't** claim chart annotations exist beyond automatic incident windows and the hover readout.
- **Don't** hard-code colors in components; the logo's white bars are the one literal exception in the build and should move to tokens if the mark is reused.
