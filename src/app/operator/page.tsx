"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmt, Notice, PageHeader, Panel, Segmented, Skeleton, Stat, StatRow, Status } from "@/components/pyxis/ui";
import { useMeQuery, useOperatorQuery, useSetStatusMutation } from "@/lib/api";
import { cn } from "@/lib/utils";

type K = "requests" | "p50_ms" | "p95_ms" | "server_error_rate";
const RANGES = [["24h", 24], ["7d", 168], ["30d", 720]] as const;
const RANGE_NAME: Record<number, string> = { 24: "last 24 hours", 168: "last 7 days", 720: "last 30 days" };

export default function Operator() {
  const { data: me } = useMeQuery();
  const [hours, setHours] = useState(168);
  const { data, isError, isLoading } = useOperatorQuery(hours, { skip: !me?.user?.isOperator });
  const [setStatus] = useSetStatusMutation();
  const [sort, setSort] = useState<K>("requests");
  const [picked, setPicked] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const rows = useMemo(() => [...(data?.projects ?? [])].sort((a, b) => ((b[sort] ?? -1) as number) - ((a[sort] ?? -1) as number)), [data, sort]);
  const compare = rows.filter((r) => picked.includes(r.id));
  const maxReq = Math.max(1, ...rows.map((r) => r.requests));

  if (me?.user && !me.user.isOperator) {
    return (
      <>
        <PageHeader title="Operator overview" />
        <Notice tone="bad" title="Operator role required">Your account is not an operator. Ask the operator of this deployment to add your wallet.</Notice>
      </>
    );
  }

  const th = (k: K, l: string) => (
    <TableHead className="text-right" aria-sort={sort === k ? "descending" : "none"}>
      <button onClick={() => setSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", sort === k && "text-foreground")}>
        {l} {sort === k && <ArrowDown className="size-3" aria-hidden />}
      </button>
    </TableHead>
  );

  return (
    <>
      <PageHeader
        title="Operator overview"
        description="Ecosystem-wide aggregates. You see totals per project, never individual users. Opening a project is written to an audit log."
        actions={<Segmented label="Time range" value={hours} onChange={setHours} options={RANGES} />}
      />
      {isError && <div className="mb-6"><Notice tone="bad">Could not load the overview. Try again in a moment.</Notice></div>}

      <StatRow>
        <Stat label="Projects" value={fmt.n(data?.projects.length)} hint="Enrolled, any status" />
        <Stat label="Requests" value={fmt.n(data?.total.requests)} hint={`All projects, ${RANGE_NAME[hours]}`} />
        <Stat label="p50 latency" value={fmt.ms(data?.total.p50_ms)} unit={fmt.msUnit(data?.total.p50_ms)} hint="Merged histograms" />
        <Stat label="p95 latency" value={fmt.ms(data?.total.p95_ms)} unit={fmt.msUnit(data?.total.p95_ms)} hint="Approximate" />
        <Stat label="Server errors" value={data ? fmt.pct(data.total.server_error_rate) : "—"} hint="5xx ÷ all responses" />
      </StatRow>

      <Panel className="mt-6" title="Projects" flush aside="Select up to three rows to compare side by side">
        {isLoading ? (
          <div className="space-y-2 p-4"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><span className="sr-only">Compare</span></TableHead>
                <TableHead>Project</TableHead><TableHead>Status</TableHead>
                {th("requests", "Requests")}{th("p50_ms", "p50 ms")}{th("p95_ms", "p95 ms")}{th("server_error_rate", "5xx")}
                <TableHead>Share of traffic</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><input type="checkbox" className="size-4 accent-primary" aria-label={`Compare ${p.name}`} checked={picked.includes(p.id)} onChange={(e) => setPicked((s) => (e.target.checked ? [...s, p.id].slice(-3) : s.filter((x) => x !== p.id)))} /></TableCell>
                  <TableCell className="font-medium"><Link className="underline-offset-4 hover:underline" href={`/projects/${p.id}`}>{p.name}</Link></TableCell>
                  <TableCell><Status state={p.status === "active" ? "ok" : "warn"}><span className="capitalize">{p.status}</span></Status></TableCell>
                  <TableCell className="text-right tnum">{fmt.n(p.requests)}</TableCell>
                  <TableCell className="text-right tnum">{p.p50_ms ?? "—"}</TableCell>
                  <TableCell className="text-right tnum">{p.p95_ms ?? "—"}</TableCell>
                  <TableCell className={cn("text-right tnum", p.server_error_rate > 0.01 && "font-semibold text-danger")}>{fmt.pct(p.server_error_rate)}</TableCell>
                  <TableCell><span className="block h-2 w-28 rounded-[1px] bg-muted"><span className="block h-full rounded-[1px] bg-series" style={{ width: `${(p.requests / maxReq) * 100}%` }} /></span></TableCell>
                  <TableCell className="text-right">
                    {confirm === p.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="max-w-48 text-left text-xs leading-4 text-muted-foreground">{p.status === "active" ? "Suspending stops this project's ingestion." : "Reinstating resumes its ingestion."}</span>
                        <Button variant={p.status === "active" ? "destructive" : "default"} size="xs" onClick={() => { setStatus({ id: p.id, status: p.status === "active" ? "suspended" : "active" }); setConfirm(null); }}>Confirm</Button>
                        <Button variant="ghost" size="xs" onClick={() => setConfirm(null)}>Cancel</Button>
                      </span>
                    ) : (
                      <Button variant="ghost" size="xs" onClick={() => setConfirm(p.id)}>{p.status === "active" ? "Suspend" : "Reinstate"}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
          Figures cover the {RANGE_NAME[hours]}. Latencies are in milliseconds; percentiles are interpolated from merged fixed-boundary histograms, so they are approximations. 5xx is 5xx ÷ all responses.
        </p>
      </Panel>

      {compare.length > 1 && (
        <Panel className="mt-6" title="Side by side" flush>
          <div className="grid divide-x divide-border" style={{ gridTemplateColumns: `repeat(${compare.length}, minmax(0, 1fr))` }}>
            {compare.map((p) => (
              <div key={p.id} className="p-4">
                <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                <dl className="mt-3 grid gap-3 tnum">
                  <div><dt className="text-xs text-muted-foreground">Requests</dt><dd className="text-xl font-semibold">{fmt.n(p.requests)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">p95 latency</dt><dd className="text-sm">{p.p95_ms ?? "—"} ms</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Server errors</dt><dd className="text-sm">{fmt.pct(p.server_error_rate)}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
