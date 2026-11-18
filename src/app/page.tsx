"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pyxis/logo";
import { ClassMultiples, RequestChart, Spark } from "@/components/pyxis/charts";
import { CodeBlock, deltaOf, fmt, LATENCY_DEADBAND, Stat, StatRow } from "@/components/pyxis/ui";
import { NetworkStellar } from "@web3icons/react";
import { cn } from "@/lib/utils";

// Synthetic sample data for the specimen below. Deterministic so the page renders identically everywhere.
const SERIES = Array.from({ length: 48 }, (_, i) => {
  const base = 520 + Math.round(210 * Math.sin(i / 5.2)) + (i % 7) * 11;
  const errors = i >= 31 && i <= 35 ? Math.round(base * (0.05 + 0.02 * (i - 31))) : Math.round(base * 0.004);
  return { t: new Date(Date.UTC(2026, 0, 14, 0, 0) + i * 30 * 60_000).toISOString(), requests: base, errors };
});
const ROWS = [
  { m: "GET", r: "/v1/pools", n: 18420, p95: 142, e: 0.002, k: 1 },
  { m: "POST", r: "/v1/quote", n: 9310, p95: 318, e: 0.031, k: 2 },
  { m: "GET", r: "/v1/pools/:id", n: 6204, p95: 96, e: 0.001, k: 3 },
  { m: "POST", r: "/v1/swap/submit", n: 2175, p95: 640, e: 0.012, k: 4 },
].map((x) => {
  const spark = Array.from({ length: 24 }, (_, i) => Math.round((x.n / 24) * (0.7 + 0.5 * Math.abs(Math.sin(i / (2 + x.k))))));
  const spark_err = spark.map((v, i) => (x.e > 0.01 && i > 16 && i < 21 ? Math.round(v * x.e * 4) : 0));
  return { ...x, spark, spark_err };
});
const SPARK_MAX = Math.max(...ROWS.flatMap((r) => r.spark));

// Signature object: the request series as a stair-step line across the hero, with one marked incident.
const SIGNAL = (() => {
  const max = Math.max(...SERIES.map((d) => d.requests));
  const w = 1000 / SERIES.length;
  let d = "";
  SERIES.forEach((p, i) => {
    const y = 180 - (p.requests / max) * 150;
    d += i === 0 ? `M0 ${y}` : ` H${i * w} V${y}`;
  });
  d += ` H1000`;
  return { d, w };
})();

const FEATURES = [
  ["API metrics", "Requests, latency percentiles and error rates per route, from the OpenTelemetry metrics your services already emit. Metrics only; traces and logs are rejected.", "Percentiles are approximations from merged histograms."],
  ["Web analytics", "Page views, referrers and devices from a pinned, self-hosted Umami, issued only after you verify the domain by DNS or a file.", "Visitor counts follow Umami's definitions."],
  ["Wallet funnel", "Where people drop between connecting a wallet and submitting a transaction, counted from event names alone.", "Reported by your frontend. It cannot prove a ledger outcome."],
] as const;

const SNIPPET = `export OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=https://<your-pyxis-host>/v1/metrics
export OTEL_EXPORTER_OTLP_METRICS_HEADERS="Authorization=Bearer <ingest key>"
export OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=delta`;

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-[0.9375rem] font-semibold tracking-tight"><Logo className="size-6" /> Pyxis</Link>
          <nav aria-label="Page" className="ml-4 hidden gap-5 text-sm text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#setup" className="hover:text-foreground">Setup</a>
            <a href="#privacy" className="hover:text-foreground">What it stores</a>
            <a href="#definitions" className="hover:text-foreground">Definitions</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><NetworkStellar variant="mono" size={14} /> Testnet MVP</span>
            <Button render={<Link href="/signin" />}>Open the app</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(60rem_26rem_at_75%_-4rem,oklch(0.6_0.22_292/0.4),transparent_70%)]" />
          <svg aria-hidden viewBox="0 0 1000 200" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-70 [mask-image:linear-gradient(to_bottom,transparent,black_35%)]">
            <path d={SIGNAL.d} fill="none" stroke="var(--series)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d={SIGNAL.d + " V200 H0 Z"} fill="var(--series)" fillOpacity="0.07" />
            <rect x={31 * SIGNAL.w} width={5 * SIGNAL.w} y="0" height="200" fill="var(--danger)" fillOpacity="0.08" />
          </svg>
        <div className="relative mx-auto max-w-6xl px-4 pb-40 pt-14 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h1 className="max-w-[18ch] text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-[3.5rem]">
                Know how your Stellar app is used, without profiling the people using it.
              </h1>
              <p className="mt-5 max-w-[60ch] text-lg leading-7 text-muted-foreground">
                Shared analytics for Stellar projects: API metrics over OpenTelemetry, web analytics, and a wallet funnel. Every number carries its definition, and the operator view only ever sees aggregates.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" render={<Link href="/signin" />}>Connect wallet <ArrowRight /></Button>
                <Button size="lg" variant="outline" render={<a href="#setup" />}>See the setup</Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Signing in uses a one-time wallet signature. No transaction is sent.</p>
            </div>
            <figure className="rounded-lg border border-border-strong bg-card p-4" aria-label="Request volume with an incident window">
              <RequestChart data={SERIES} rangeLabel="the last 24 hours" />
              <figcaption className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                Synthetic sample data. The shaded window is where 5xx rose; every number in the app carries its definition.
              </figcaption>
            </figure>
          </div>
        </div>
        </section>

        <section id="product" aria-label="Product sample" className="border-y border-border bg-muted/60 py-10">
          <div className="mx-auto max-w-6xl px-4 lg:px-8">
            <div className="rounded-lg border border-border-strong bg-background p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Sample project · Overview</p>
                <p className="rounded-[3px] border border-warn/60 bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn-ink">Synthetic sample data. Not a real project.</p>
              </div>
              <StatRow>
                <Stat label="Requests" value={fmt.n(36109)} delta={deltaOf(36109, 31840, { neutral: true, format: fmt.n })} hint="Compared with the equal period before" def="Total HTTP responses counted by your exporter in the selected range." />
                <Stat label="p50 latency" value="48" unit="ms" delta={deltaOf(48, 51, { lowerIsBetter: true, deadband: LATENCY_DEADBAND, format: (x) => x + "ms" })} hint="Median" def="The median response time, interpolated from merged fixed-boundary histograms. An approximation." />
                <Stat label="p95 latency" value="318" unit="ms" delta={deltaOf(318, 262, { lowerIsBetter: true, deadband: LATENCY_DEADBAND, format: (x) => x + "ms" })} hint="Approximate" def="95% of responses were faster than this. Interpolated from merged histograms, so approximate." />
                <Stat defAlign="right" label="p99 latency" value="702" unit="ms" delta={deltaOf(702, 690, { lowerIsBetter: true, deadband: LATENCY_DEADBAND, format: (x) => x + "ms" })} hint="Approximate" def="99% of responses were faster than this. Responses beyond the top bucket report its lower bound, 10 s." />
                <Stat defAlign="right" label="Server errors" value="1.4%" delta={deltaOf(0.014, 0.004, { lowerIsBetter: true, points: true, format: fmt.pct })} hint="5xx ÷ all" tone="danger" def="5xx responses divided by all responses in the range. Deltas are in percentage points." />
              </StatRow>
              <div className="mt-4 grid gap-4">
                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-sm font-semibold">Status classes</p>
                  <ClassMultiples counts={{ "2xx": 34210, "3xx": 612, "4xx": 780, "5xx": 507 }} total={36109} />
                </div>
              </div>
              <div className="mt-4 overflow-x-auto border-t border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="h-9 pl-4 text-left font-medium">Method</th><th className="text-left font-medium">Route</th>
                      <th className="text-right font-medium">Requests</th><th className="text-right font-medium">p95</th><th className="text-right font-medium">5xx</th><th className="pl-4 text-left font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <tr key={r.r} className="border-b border-border last:border-b-0">
                        <td className="py-2.5 pl-4 font-mono text-xs font-medium">{r.m}</td>
                        <td className="font-mono text-xs">{r.r}</td>
                        <td className="text-right tnum">{fmt.n(r.n)}</td>
                        <td className="text-right tnum">{r.p95}</td>
                        <td className={cn("text-right tnum", r.e > 0.01 && "font-semibold text-danger")}>{fmt.pct(r.e)}</td>
                        <td className="py-2.5 pl-4 pr-4"><Spark data={r.spark} err={r.spark_err} max={SPARK_MAX} label={`${r.m} ${r.r} trend`} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <h2 className="max-w-[28ch] text-2xl font-semibold tracking-tight">Three signals, each with its limits stated</h2>
          <dl className="mt-8 grid border-t border-border-strong md:grid-cols-3">
            {FEATURES.map(([t, d, limit], i) => (
              <div key={t} className={cn("py-6 md:pr-8", i > 0 && "md:border-l md:border-border md:pl-8")}>
                <dt className="text-base font-semibold">{t}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">{d}</dd>
                <dd className="mt-3 text-xs font-medium text-foreground">{limit}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="setup" className="border-y border-border bg-muted/60">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_1.1fr] lg:px-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">From sign-in to first data point</h2>
              <ol className="mt-6 grid gap-5 text-sm">
                {[
                  ["Sign in with your wallet", "A one-time signature on testnet. No email, no password."],
                  ["Create a project and an ingest key", "The key, never the payload, decides which project a metric belongs to."],
                  ["Dual-export from your service", "Keep your existing APM and add Pyxis as a second OTLP/HTTP JSON destination."],
                  ["Watch the overview fill in", "It refreshes every 15 seconds, with routes, latency and error rate side by side."],
                ].map(([t, d], i) => (
                  <li key={t} className="grid grid-cols-[1.75rem_1fr] gap-2">
                    <span className="grid size-6 place-items-center rounded-full border border-border-strong bg-background text-xs font-medium tnum">{i + 1}</span>
                    <span><span className="font-medium">{t}.</span> <span className="text-muted-foreground">{d}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="self-start"><CodeBlock code={SNIPPET} label="Copy" /></div>
          </div>
        </section>

        <section id="privacy" className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <h2 className="max-w-[30ch] text-2xl font-semibold tracking-tight">Privacy by omission: no IPs, request bodies or wallet addresses in analytics</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="border-b border-border-strong pb-2 text-sm font-semibold">What Pyxis stores</h3>
              <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                <li>Counters and latency histograms per route, per minute.</li>
                <li>Wallet event names and counts.</li>
                <li>A one-way hash of each ingest key secret.</li>
                <li>Project membership, by Stellar public key, for access control.</li>
              </ul>
            </div>
            <div>
              <h3 className="border-b border-border-strong pb-2 text-sm font-semibold">What Pyxis does not store</h3>
              <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                <li>Traces, spans, logs or request bodies.</li>
                <li>IP addresses in Pyxis&apos;s own tables. Web analytics run on Umami, which has its own data handling.</li>
                <li>Wallet addresses, signatures or transaction XDR in analytics.</li>
                <li>Anything that would let one project read another&apos;s data. Isolation is enforced in the database, not only in the app.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="definitions" className="border-t border-border bg-muted/60">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold tracking-tight">Definitions you can check</h2>
            <dl className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                ["Server error rate", "5xx responses divided by all responses, over the selected range."],
                ["Latency percentiles", "Interpolated from merged fixed-boundary histograms. They are approximations, and the top bucket reports its lower bound (10 s)."],
                ["Wallet events", "Reported by your frontend through the tracker. They are not confirmed on the Stellar ledger."],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="text-sm font-semibold">{t}</dt>
                  <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">{d}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <h2 className="max-w-[26ch] text-2xl font-semibold tracking-tight">Instrument your first service</h2>
            <Button size="lg" render={<Link href="/signin" />}>Connect wallet <ArrowRight /></Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground lg:px-8">
          <span className="flex items-center gap-2"><Logo className="size-4" /> Pyxis · Testnet MVP</span>
          <span>Numbers in the sample above are synthetic.</span>
          <Link href="/demo" className="hover:text-foreground">Wallet funnel demo</Link>
        </div>
      </footer>
    </div>
  );
}
