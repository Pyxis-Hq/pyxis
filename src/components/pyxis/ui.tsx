"use client";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Copy, Inbox, Minus } from "lucide-react";
import { useId, useState, type ReactNode, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const fmt = {
  n: (x: number | null | undefined) => (x == null ? "—" : new Intl.NumberFormat("en").format(x)),
  compact: (x: number | null | undefined) => (x == null ? "—" : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(x)),
  ms: (x: number | null | undefined) => (x == null ? "—" : x >= 1000 ? (x / 1000).toFixed(2) : String(x)),
  msUnit: (x: number | null | undefined) => (x != null && x >= 1000 ? "s" : "ms"),
  pct: (x: number) => (x * 100).toFixed(x > 0 && x < 0.001 ? 2 : 1) + "%",
  when: (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "never"),
  short: (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`,
};

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-6">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold leading-7 tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A bordered region with a header row. Panels sit on the page grid and are never nested. */
export function Panel({ title, aside, children, className, flush }: { title: string; aside?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      <header className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside && <div className="text-xs text-muted-foreground">{aside}</div>}
      </header>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

/** State key: a small square swatch and a label, like a map legend. */
export function Status({ state, children }: { state: "ok" | "warn" | "off" | "bad" | "info"; children: ReactNode }) {
  const c = { ok: "bg-ok", warn: "bg-warn", off: "bg-muted-foreground/40", bad: "bg-danger", info: "bg-primary" }[state];
  return (
    <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium">
      <span aria-hidden className={cn("size-2 rounded-[1px]", c)} />
      {children}
    </span>
  );
}

export function StatRow({ children, cols = 5 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  const grid = { 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5" }[cols];
  return (
    <dl className={cn("grid grid-cols-2 rounded-lg border border-border bg-card [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1", grid)}>{children}</dl>
  );
}

export type DeltaInfo = { text: string; tone: "good" | "bad" | "flat"; dir: "up" | "down" | "flat"; prev: string };
/** Latency percentiles are histogram approximations: changes inside this band stay neutral. */
export const LATENCY_DEADBAND = 5;

/** Change against the previous period. `lowerIsBetter` flips the tone for latency and errors. */
export function deltaOf(now: number | null | undefined, prev: number | null | undefined, opts: { lowerIsBetter?: boolean; neutral?: boolean; deadband?: number; format: (x: number) => string; points?: boolean }): DeltaInfo | undefined {
  if (now == null || prev == null) return undefined;
  const diff = now - prev;
  const rel = opts.points ? diff * 100 : prev === 0 ? (now === 0 ? 0 : 100) : (diff / prev) * 100;
  const small = Math.abs(rel) < (opts.points ? 0.05 : 0.5);
  const dir = small ? "flat" : diff > 0 ? "up" : "down";
  const worse = opts.lowerIsBetter ? diff > 0 : diff < 0;
  const quiet = small || opts.neutral || (opts.deadband != null && Math.abs(rel) < opts.deadband);
  const tone = quiet ? "flat" : worse ? "bad" : "good";
  const abs = Math.abs(rel);
  const text = small ? "0%" : opts.points ? `${abs.toFixed(abs < 10 ? 1 : 0)} pt` : `${abs >= 100 ? Math.round(abs) : abs.toFixed(abs < 10 ? 1 : 0)}%`;
  return { text, tone, dir, prev: opts.format(prev) };
}

/** Help icon with a short definition, reachable by hover and keyboard focus. */
export function Def({ children, label, align = "left" }: { children: ReactNode; label: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="group/def relative inline-flex" onKeyDown={(e) => e.key === "Escape" && setOpen(false)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <button type="button" aria-label={`Definition of ${label}`} aria-describedby={id} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-full text-muted-foreground hover:text-foreground focus-visible:text-foreground">
        <CircleHelp className="size-3.5" aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "absolute top-full z-30 mt-2 w-60 max-w-[calc(100vw-3rem)] rounded-md border border-border-strong bg-popover p-2.5 text-xs font-normal normal-case leading-5 tracking-normal text-popover-foreground shadow-lg shadow-black/40 transition-opacity duration-150",
          align === "right" ? "right-0" : "left-0",
          open ? "visible opacity-100" : "invisible opacity-0 group-hover/def:visible group-hover/def:opacity-100",
        )}
      >
        {children}
      </span>
    </span>
  );
}

export function Stat({ label, value, unit, hint, tone, delta, def, defAlign }: { label: string; value: ReactNode; unit?: string; hint?: string; tone?: "danger"; delta?: DeltaInfo; def?: ReactNode; defAlign?: "left" | "right" }) {
  const chip = delta && {
    good: "bg-ok/15 text-ok",
    bad: "bg-danger/15 text-danger",
    flat: "bg-muted text-muted-foreground",
  }[delta.tone];
  const Arrow = delta?.dir === "up" ? ArrowUpRight : delta?.dir === "down" ? ArrowDownRight : Minus;
  return (
    <div className="border-b border-r border-border px-4 py-3.5 last:border-r-0 md:border-b-0">
      <dt className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
        {def && <Def label={label} align={defAlign}>{def}</Def>}
      </dt>
      <dd className={cn("mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1.5 text-[1.75rem] font-medium leading-none tnum", tone === "danger" && "text-danger")}>
        <span>
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </span>
        {delta && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none", chip)}>
            <Arrow className="size-3" aria-hidden />
            {delta.text}
            <span className="sr-only"> versus the previous period</span>
          </span>
        )}
      </dd>
      {(delta || hint) && (
        <p className="mt-2 text-xs leading-4 text-muted-foreground">
          {delta && <span><span className="tnum">{delta.prev}</span> previously</span>}
          {delta && hint && " · "}
          {hint}
        </p>
      )}
    </div>
  );
}

export function Segmented<T extends string | number>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly (readonly [string, T])[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-8 rounded-md border border-border bg-muted p-0.5">
      {options.map(([l, v]) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={cn(
            "rounded-[3px] px-2.5 text-xs font-medium tnum transition-colors duration-150",
            value === v ? "bg-primary/20 text-violet-text shadow-[0_0_0_1px_oklch(0.6_0.22_292/0.55)]" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "bad" | "warn" | "ok"; title?: string; children: ReactNode }) {
  const t = {
    info: "border-primary/25 bg-primary/5",
    bad: "border-danger/30 bg-danger/5",
    warn: "border-warn/50 bg-warn/10",
    ok: "border-ok/30 bg-ok/5",
  }[tone];
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={cn("rounded-md border px-3.5 py-3 text-sm", t)}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={cn(title && "mt-0.5", "text-foreground/80")}>{children}</div>
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border-strong px-6 py-10 text-center">
      <span className="mx-auto mb-3 grid size-9 place-items-center rounded-md border border-border-strong bg-muted text-violet-text"><Inbox className="size-4" aria-hidden /></span>
      <p className="text-sm font-semibold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-[52ch] text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function CodeBlock({ code, label = "Copy" }: { code: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-xs text-muted-foreground">Environment</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          }}
        >
          {done ? <Check /> : <Copy />} {done ? "Copied" : label}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">{code}</pre>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/** Loading placeholder shaped like the chart it stands in for, so the layout does not jump. */
export function ChartSkeleton({ className }: { className?: string }) {
  const h = [38, 52, 44, 60, 72, 58, 66, 80, 62, 54, 70, 86, 74, 64, 56, 68, 78, 60, 48, 58, 66, 52, 44, 50];
  return (
    <div aria-hidden className={cn("flex h-44 items-end gap-1 border-b border-border-strong", className)}>
      {h.map((v, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-[2px] bg-muted" style={{ height: `${v}%`, animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  );
}

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) => (
  <code className={cn("font-mono text-xs", className)}>{children}</code>
);

/** A standard select with the system's field styling. Native, so it is accessible and works on touch. */
export function NativeSelect({ className, size = "md", children, ...props }: Omit<ComponentProps<"select">, "size"> & { size?: "sm" | "md" }) {
  return (
    <span className="relative inline-block w-full">
      <select
        {...props}
        className={cn(
          "w-full appearance-none rounded-md border border-input bg-card pr-8 text-foreground outline-none hover:border-border-strong focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
          size === "sm" ? "h-8 pl-2 text-xs" : "h-9 pl-2.5 text-sm",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </span>
  );
}
