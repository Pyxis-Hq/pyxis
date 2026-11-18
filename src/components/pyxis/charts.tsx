"use client";
import { useState } from "react";
import { fmt } from "./ui";
import { cn } from "@/lib/utils";

type Point = { t: string; requests: number; errors: number };

const timeOf = (s: string, withDate: boolean) =>
  new Date(s).toLocaleString(undefined, withDate ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" });

/**
 * Request volume over time. Bars are requests; the red overlay is the 5xx share of the same bucket.
 * Incident windows are runs of buckets where 5xx is at least 3% of requests and at least 3 errors.
 * Hover or touch a bar for an exact readout.
 */
export function RequestChart({ data, rangeLabel }: { data: Point[]; rangeLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.requests), 1);
  const w = 100 / data.length;
  const total = data.reduce((a, d) => a + d.requests, 0);
  const errs = data.reduce((a, d) => a + d.errors, 0);
  const bands: { from: number; to: number; peak: number }[] = [];
  data.forEach((d, i) => {
    const bad = d.requests > 0 && d.errors >= 3 && d.errors / d.requests >= 0.03;
    if (!bad) return;
    const last = bands[bands.length - 1];
    const rate = d.errors / d.requests;
    if (last && last.to === i - 1) { last.to = i; last.peak = Math.max(last.peak, rate); } else bands.push({ from: i, to: i, peak: rate });
  });
  const ticks = [0, 0.5, 1].map((f) => Math.min(data.length - 1, Math.round(f * (data.length - 1))));
  const h = hover != null ? data[hover] : null;
  const pointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.max(0, Math.min(data.length - 1, Math.floor(((e.clientX - r.left) / r.width) * data.length))));
  };
  return (
    <figure>
      <div className="grid grid-cols-[3rem_1fr] gap-x-2">
        <div className="relative h-44 text-right text-[0.6875rem] text-muted-foreground tnum">
          <span className="absolute right-0 top-0 -translate-y-1/2">{fmt.compact(max)}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">{fmt.compact(Math.round(max / 2))}</span>
          <span className="absolute bottom-0 right-0 translate-y-1/2">0</span>
        </div>
        <div className="relative">
          {bands.map((b) => (
            <span
              key={b.from}
              className="pointer-events-none absolute top-1 z-10 max-w-[calc(100%-0.5rem)] rounded-[3px] bg-background/90 px-1.5 py-0.5 text-[0.6875rem] font-medium text-danger"
              style={{ left: `min(${(b.from / data.length) * 100}%, calc(100% - 15rem))` }}
            >
              <span className="tnum">{timeOf(data[b.from].t, false)}–{timeOf(data[b.to].t, false)}</span> · worst bucket <span className="tnum">{(b.peak * 100).toFixed(1)}%</span> 5xx
            </span>
          ))}
          {h && (
            <div
              className="pointer-events-none absolute z-20 -translate-y-full rounded-md border border-border-strong bg-popover px-2.5 py-1.5 text-xs shadow-lg shadow-black/40"
              style={{ left: `clamp(0px, calc(${((hover! + 0.5) / data.length) * 100}% - 5.5rem), calc(100% - 11rem))`, top: "-0.25rem" }}
            >
              <p className="text-muted-foreground tnum">{timeOf(h.t, true)}</p>
              <p className="mt-0.5 tnum"><span className="text-violet-text">{fmt.n(h.requests)}</span> requests</p>
              <p className="tnum"><span className={h.errors ? "text-danger" : "text-muted-foreground"}>{fmt.n(h.errors)}</span> 5xx{h.requests ? <span className="text-muted-foreground"> ({((h.errors / h.requests) * 100).toFixed(1)}%)</span> : null}</p>
            </div>
          )}
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className="h-44 w-full overflow-visible border-b border-border-strong touch-pan-y"
            role="img"
            aria-label={`Requests over ${rangeLabel}: ${fmt.n(total)} requests, ${fmt.n(errs)} server errors${bands.length ? `, ${bands.length} incident window${bands.length > 1 ? "s" : ""}` : ""}`}
            onPointerMove={pointer}
            onPointerDown={pointer}
            onPointerLeave={() => setHover(null)}
          >
            {[0, 20, 40].map((y) => (
              <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            {bands.map((b) => (
              <g key={b.from}>
                <rect x={b.from * w} width={(b.to - b.from + 1) * w} y="0" height="40" className="fill-danger/10" />
                <line x1={b.from * w} x2={b.from * w} y1="0" y2="40" stroke="var(--danger)" strokeOpacity="0.5" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <line x1={(b.to + 1) * w} x2={(b.to + 1) * w} y1="0" y2="40" stroke="var(--danger)" strokeOpacity="0.5" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </g>
            ))}
            {data.map((d, i) => {
              const bh = (d.requests / max) * 39;
              const eh = (d.errors / max) * 39;
              return (
                <g key={d.t} opacity={hover == null || hover === i ? 1 : 0.55}>
                  <rect x={i * w + w * 0.1} width={w * 0.8} y={40 - bh} height={bh} className="fill-series" />
                  {eh > 0 && <rect x={i * w + w * 0.1} width={w * 0.8} y={40 - eh} height={eh} className="fill-danger" />}
                </g>
              );
            })}
            {hover != null && <line x1={(hover + 0.5) * w} x2={(hover + 0.5) * w} y1="0" y2="40" stroke="var(--foreground)" strokeOpacity="0.5" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
          </svg>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-[3rem_1fr] gap-x-2 text-[0.6875rem] text-muted-foreground">
        <span />
        <span className="relative h-4 tnum" aria-hidden>
          {ticks.map((t, i) => (
            <span key={i} className="absolute whitespace-nowrap" style={{ left: `${(t / (data.length - 1 || 1)) * 100}%`, transform: i === 0 ? "none" : i === ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}>
              {timeOf(data[t].t, i === 0 || i === ticks.length - 1)}
            </span>
          ))}
        </span>
      </div>
      <figcaption className="mt-2 grid grid-cols-[3rem_1fr] gap-x-2 text-xs text-muted-foreground">
        <span />
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-[1px] bg-series" />Requests</span>
          <span className="flex items-center gap-1.5"><i className="size-2 rounded-[1px] bg-danger" />5xx</span>
          {bands.length > 0 && <span className="flex items-center gap-1.5"><i className="h-2 w-3 rounded-[1px] border border-dashed border-danger/60 bg-danger/10" />Incident: a bucket with at least 3 errors and 5xx at 3% or more</span>}
          <span className="ml-auto">Times in your local time zone</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** One small multiple per endpoint: 24 slices of the range on a scale shared by every row, so rows compare. */
export function Spark({ data, err, max, label }: { data: number[]; err: number[]; max: number; label: string }) {
  const w = 100 / data.length;
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-9 w-full max-w-56" role="img" aria-label={label}>
      <line x1="0" x2="100" y1="23.5" y2="23.5" stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {data.map((v, i) => {
        const h = max ? (v / max) * 23 : 0;
        const eh = max ? ((err[i] ?? 0) / max) * 23 : 0;
        return (
          <g key={i}>
            <rect x={i * w + w * 0.12} width={w * 0.76} y={23 - h} height={h} className="fill-series" />
            {eh > 0 && <rect x={i * w + w * 0.12} width={w * 0.76} y={23 - Math.max(eh, 1.5)} height={Math.max(eh, 1.5)} className="fill-danger" />}
          </g>
        );
      })}
    </svg>
  );
}

const CLASSES = [
  ["2xx", "Success", "bg-ok"],
  ["3xx", "Redirect", "bg-info"],
  ["4xx", "Client error", "bg-warn"],
  ["5xx", "Server error", "bg-danger"],
] as const;

/** Four status classes as small multiples on one 0-100% scale. */
export function ClassMultiples({ counts, total }: { counts: Record<string, number> | undefined; total: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
      {CLASSES.map(([k, name, bg]) => {
        const n = counts?.[k] ?? 0;
        const share = total ? n / total : 0;
        return (
          <li key={k}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm"><span className="font-medium">{k}</span> <span className="whitespace-nowrap text-xs text-muted-foreground">{name}</span></span>
            </div>
            <p className="mt-1 text-xl font-medium leading-none tnum">{total ? fmt.n(n) : "—"}</p>
            <div className="mt-2.5 h-1.5 rounded-[1px] bg-muted" role="img" aria-label={`${k}: ${total ? fmt.pct(share) : "no data"} of responses`}>
              <div className={cn("h-full rounded-[1px]", bg)} style={{ width: `${Math.max(share * 100, share > 0 ? 1 : 0)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{total ? <><span className="tnum">{fmt.pct(share)}</span> of responses</> : "No responses yet"}</p>
          </li>
        );
      })}
    </ul>
  );
}
