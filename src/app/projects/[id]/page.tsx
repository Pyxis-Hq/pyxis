"use client";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowDown, Check, KeyRound, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClassMultiples, RequestChart, Spark } from "@/components/pyxis/charts";
import { ChartSkeleton, deltaOf, Empty, LATENCY_DEADBAND, fmt, NativeSelect, Notice, PageHeader, Panel, Segmented, Skeleton, Stat, StatRow } from "@/components/pyxis/ui";
import { useAnalyticsQuery, useKeysQuery, useProjectQuery, type Endpoint } from "@/lib/api";
import { cn } from "@/lib/utils";

const RANGES = [["1h", 1], ["24h", 24], ["7d", 168], ["30d", 720]] as const;
const RANGE_LABEL: Record<number, string> = { 1: "the last hour", 24: "the last 24 hours", 168: "the last 7 days", 720: "the last 30 days" };
type SortKey = "requests" | "p50_ms" | "p95_ms" | "p99_ms" | "server_error_rate";

/** Routes in mono, with dynamic segments (:id, [slug], {id}) dimmed so the static shape reads first. */
function Route({ path }: { path: string }) {
  return (
    <span>
      {path.split("/").map((seg, i) => (
        <span key={i}>
          {i > 0 && "/"}
          {seg.startsWith(":") || seg.startsWith("[") || seg.startsWith("{") ? <span className="text-muted-foreground/80">{seg}</span> : seg}
        </span>
      ))}
    </span>
  );
}

/** "Live" readout for the auto-refreshing overview: when the data last arrived. */
function Live({ at }: { at?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!at) return null;
  const s = Math.max(0, Math.round((now - at) / 1000));
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span aria-hidden className="relative inline-flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok/60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-ok" />
      </span>
      Live · updated <span className="tnum">{s}s</span> ago
    </span>
  );
}

function Setup({ id, hasKey, hasData }: { id: string; hasKey: boolean; hasData: boolean }) {
  const steps = [
    { t: "Create a project", d: "Your data has its own isolated space.", done: true },
    { t: "Create an ingest key", d: "The key decides which project a metric belongs to.", done: hasKey, href: `/projects/${id}/keys`, cta: "Create a key" },
    { t: "Point your exporter at Pyxis", d: "Copy the generated OpenTelemetry settings into your service's environment.", done: hasData, href: `/projects/${id}/keys`, cta: "Get settings", blocked: !hasKey },
    { t: "See your first data point", d: "This page checks again every 15 seconds.", done: hasData },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <Panel title="Get your first data point" aside={`${steps.filter((s) => s.done).length} of ${steps.length} done`} className="mb-6">
      <ol className="grid gap-4 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[0.6875rem] font-medium tnum",
                s.done ? "border-ok bg-ok text-background" : i === current ? "border-primary text-violet-text" : "border-border-strong text-muted-foreground",
              )}
            >
              {s.done ? <Check className="size-3" aria-label="Done" /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{s.t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.d}</p>
              {i === current && s.href && !s.blocked && (
                <Button size="sm" className="mt-3" render={<Link href={s.href} />}>{s.cta}</Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export default function Overview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hours, setHours] = useState(24);
  const [sort, setSort] = useState<SortKey>("requests");
  const [q, setQ] = useState("");
  const [env, setEnv] = useState("");
  const { data: project } = useProjectQuery(id);
  const { data: keys } = useKeysQuery(id);
  const { data, isLoading, isError, fulfilledTimeStamp } = useAnalyticsQuery({ id, hours }, { pollingInterval: 15_000 });
  const { data: prevData } = useAnalyticsQuery({ id, hours, previous: true }, { pollingInterval: 60_000 });
  const s = data?.summary;
  const ps = prevData?.summary && prevData.summary.requests > 0 ? prevData.summary : undefined;
  const hasNow = !!s && s.requests > 0;
  const dReq = hasNow ? deltaOf(s!.requests, ps?.requests, { neutral: true, format: fmt.n }) : undefined;
  const lat = (k: "p50_ms" | "p95_ms" | "p99_ms") => (hasNow && ps ? deltaOf(s![k], ps[k], { lowerIsBetter: true, deadband: LATENCY_DEADBAND, format: (x) => fmt.ms(x) + fmt.msUnit(x) }) : undefined);
  const dErr = hasNow && ps ? deltaOf(s!.server_error_rate, ps.server_error_rate, { lowerIsBetter: true, points: true, format: fmt.pct }) : undefined;
  const hasData = !!s && s.requests > 0;
  const hasKey = !!keys?.keys.some((k) => !k.revoked_at);

  const envs = useMemo(() => [...new Set((data?.endpoints ?? []).map((e) => e.environment))].sort(), [data]);
  const rows = useMemo(() => {
    const list = (data?.endpoints ?? []).filter(
      (e) => (!env || e.environment === env) && (!q || (e.route + e.service + e.method).toLowerCase().includes(q.toLowerCase())),
    );
    return [...list].sort((a, b) => ((b[sort] ?? -1) as number) - ((a[sort] ?? -1) as number));
  }, [data, sort, q, env]);
  const sparkMax = useMemo(() => Math.max(1, ...rows.flatMap((r) => r.spark)), [rows]);

  const th = (k: SortKey, label: string, hide = "") => (
    <TableHead className={cn("text-right", hide)} aria-sort={sort === k ? "descending" : "none"}>
      <button onClick={() => setSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", sort === k && "text-foreground")}>
        {label} {sort === k && <ArrowDown className="size-3" aria-hidden />}
      </button>
    </TableHead>
  );

  return (
    <>
      <PageHeader
        title={project?.name ?? "API metrics"}
        description={<>API requests and latency reported by your OpenTelemetry exporter. <Live at={fulfilledTimeStamp} /></>}
        actions={
          <>
            <Segmented label="Time range" value={hours} onChange={setHours} options={RANGES} />
            <Button variant={hasKey ? "outline" : "default"} render={<Link href={`/projects/${id}/keys`} />}><KeyRound /> {hasKey ? "Keys & setup" : "Create an ingest key"}</Button>
          </>
        }
      />

      {isError && <div className="mb-6"><Notice tone="bad">Could not load analytics for this project. Check your connection and try again.</Notice></div>}
      {!isLoading && !isError && !hasData && <Setup id={id} hasKey={hasKey} hasData={hasData} />}

      <div aria-busy={isLoading}>
        <StatRow>
          <Stat label="Requests" value={fmt.n(s?.requests)} delta={dReq} hint="Compared with the equal period before" def="Total HTTP responses counted by your exporter in the selected range." />
          <Stat label="p50 latency" value={fmt.ms(s?.p50_ms)} unit={fmt.msUnit(s?.p50_ms)} delta={lat("p50_ms")} hint="Median" def="The median response time, interpolated from merged fixed-boundary histograms. An approximation, not an exact value." />
          <Stat label="p95 latency" value={fmt.ms(s?.p95_ms)} unit={fmt.msUnit(s?.p95_ms)} delta={lat("p95_ms")} hint="Approximate" def="95% of responses were faster than this. Interpolated from merged histograms, so approximate." />
          <Stat defAlign="right" label="p99 latency" value={fmt.ms(s?.p99_ms)} unit={fmt.msUnit(s?.p99_ms)} delta={lat("p99_ms")} hint="Approximate" def="99% of responses were faster than this. Responses beyond the top bucket report its lower bound, 10 s." />
          <Stat defAlign="right" label="Server errors" value={s && s.requests > 0 ? fmt.pct(s.server_error_rate) : "—"} delta={dErr} hint="5xx ÷ all" tone={s && s.server_error_rate > 0.01 ? "danger" : undefined} def="5xx responses divided by all responses in the range. Deltas are in percentage points." />
        </StatRow>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Request volume" aside="1-minute buckets, rolled up by range">
          {isLoading ? <ChartSkeleton /> : data?.series.length ? <RequestChart data={data.series} rangeLabel={RANGE_LABEL[hours]} /> : <Empty title="No requests in this range">Send traffic through an instrumented service, or widen the time range.</Empty>}
        </Panel>
        <Panel title="Status classes" aside="Share of all responses">
          <ClassMultiples counts={s?.status_classes} total={s?.requests ?? 0} />
        </Panel>
      </div>

      <Panel
        className="mt-6"
        title="Endpoints"
        flush
        aside={
          <div className="flex flex-wrap items-center gap-2">
            {envs.length > 1 && (
              <div className="w-44"><NativeSelect size="sm" aria-label="Environment" value={env} onChange={(e) => setEnv(e.target.value)}>
                <option value="">All environments</option>
                {envs.map((e) => <option key={e}>{e}</option>)}
              </NativeSelect></div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input aria-label="Filter endpoints" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter route, method, service" className="h-8 w-60 rounded-md border border-input bg-card pl-7 pr-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50" />
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-2 p-4"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <Empty title={data?.endpoints.length ? "No endpoints match this filter" : "No endpoint data yet"} action={!data?.endpoints.length && <Button render={<Link href={`/projects/${id}/keys`} />}>Create an ingest key</Button>}>
              {data?.endpoints.length ? "Clear the filter or choose another environment." : "Once an instrumented service sends metrics, each route appears here with its own trend."}
            </Empty>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead><TableHead>Route</TableHead><TableHead className="hidden lg:table-cell">Service</TableHead>
                {th("requests", "Requests")}{th("p50_ms", "p50", "hidden md:table-cell")}{th("p95_ms", "p95")}{th("p99_ms", "p99", "hidden md:table-cell")}{th("server_error_rate", "5xx")}
                <TableHead className="hidden sm:table-cell">Trend <span className="font-normal">(shared scale, max {fmt.compact(sparkMax)} per slice)</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e: Endpoint) => (
                <TableRow key={e.service + e.environment + e.method + e.route}>
                  <TableCell className="font-mono text-xs font-medium">{e.method}</TableCell>
                  <TableCell className="font-mono text-xs"><Route path={e.route} /></TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{e.service} · {e.environment}</TableCell>
                  <TableCell className="text-right tnum">{fmt.n(e.requests)}</TableCell>
                  <TableCell className="hidden text-right tnum md:table-cell">{e.p50_ms ?? "—"}</TableCell>
                  <TableCell className="text-right tnum">{e.p95_ms ?? "—"}</TableCell>
                  <TableCell className="hidden text-right tnum md:table-cell">{e.p99_ms ?? "—"}</TableCell>
                  <TableCell className="text-right"><span className={cn("tnum", e.server_error_rate === 0 ? "text-muted-foreground/80" : "", e.server_error_rate > 0.01 && "rounded-[3px] bg-danger/15 px-1.5 py-0.5 font-medium text-danger")}>{fmt.pct(e.server_error_rate)}</span></TableCell>
                  <TableCell className="hidden w-full min-w-40 sm:table-cell"><Spark data={e.spark} err={e.spark_err} max={sparkMax} label={`${e.method} ${e.route}: requests over ${RANGE_LABEL[hours]}`} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
          Latencies are in milliseconds. Percentiles are interpolated from merged fixed-boundary histograms, so they are approximations; values in the top bucket report its lower bound (10 s).
          Trend bars share one scale across rows, so a taller bar always means more requests; red is 5xx.
        </div>
      </Panel>
    </>
  );
}
