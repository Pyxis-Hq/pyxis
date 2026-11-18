"use client";
import { use, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeBlock, Empty, fmt, Mono, Notice, PageHeader, Panel, Skeleton, Stat, StatRow, Status } from "@/components/pyxis/ui";
import { useAddSiteMutation, useSitesQuery, useVerifySiteMutation, useWebQuery, type Site } from "@/lib/api";

function Report({ id, site }: { id: string; site: Site }) {
  const { data, isError, isLoading } = useWebQuery({ id, siteId: site.id, hours: 168 });
  if (isLoading) return <Skeleton className="h-28" />;
  if (isError) return <Notice tone="warn">Report unavailable: the web analytics engine is not configured or is not responding.</Notice>;
  if (!data) return null;
  const list = (t: string, rows: { name: string; count: number }[]) => {
    const top = Math.max(1, ...rows.map((r) => r.count));
    return (
      <div>
        <h4 className="text-xs font-medium text-muted-foreground">{t}</h4>
        <ul className="mt-2 text-sm">
          {rows.length ? rows.slice(0, 5).map((r) => (
            <li key={r.name} className="relative flex justify-between gap-3 border-b border-border py-1.5">
              <span aria-hidden className="absolute inset-y-1 left-0 -z-0 rounded-[2px] bg-primary/10" style={{ width: `${(r.count / top) * 100}%` }} />
              <span className="relative truncate">{r.name || "(direct)"}</span>
              <span className="relative tnum">{fmt.n(r.count)}</span>
            </li>
          )) : <li className="py-1.5 text-muted-foreground">—</li>}
        </ul>
      </div>
    );
  };
  return (
    <div className="grid gap-5">
      <StatRow cols={4}>
        <Stat label="Page views" value={fmt.n(data.pageviews)} hint="Last 7 days" />
        <Stat label="Unique visitors" value={fmt.n(data.visitors)} hint="As defined by Umami" />
        <Stat label="Bounce rate" value={fmt.pct(data.bounce_rate)} hint="Single-page visits ÷ visits" />
        <Stat label="Avg session" value={Math.round(data.avg_session_seconds)} unit="s" hint="Mean visit length" />
      </StatRow>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{list("Referrers", data.referrers)}{list("Countries", data.countries)}{list("Browsers", data.browsers)}{list("Devices", data.devices)}</div>
      <details className="rounded-md border border-border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Tracker snippet</summary>
        <div className="border-t border-border p-3"><CodeBlock code={data.snippet} label="Copy snippet" /></div>
      </details>
    </div>
  );
}

function SiteCard({ id, site }: { id: string; site: Site }) {
  const [verify, { isLoading, data }] = useVerifySiteMutation();
  const verified = site.status === "verified";
  return (
    <Panel
      title={site.domain}
      aside={<Status state={verified ? "ok" : "warn"}>{verified ? "Verified" : "Awaiting verification"}</Status>}
    >
      {site.challenge && (
        <div className="grid gap-4 text-sm">
          <p>Prove you control this domain. Do <strong>either</strong> of these, then verify:</p>
          <ol className="grid list-decimal gap-3 pl-5">
            <li>Add the DNS TXT record <Mono className="break-all rounded-[2px] bg-muted px-1 py-0.5">{site.challenge.dns}</Mono></li>
            <li>Serve the text <Mono className="break-all rounded-[2px] bg-muted px-1 py-0.5">{site.challenge.token}</Mono> at <Mono className="break-all">{site.challenge.http}</Mono></li>
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" disabled={isLoading} onClick={() => verify({ id, siteId: site.id })}>{isLoading ? "Checking…" : "Verify domain"}</Button>
            <span className="text-xs text-muted-foreground">DNS changes can take a few minutes to propagate.</span>
          </div>
          {data && !data.verified && <Notice tone="bad">{data.detail}</Notice>}
        </div>
      )}
      {verified && site.tracker_ready && <Report id={id} site={site} />}
      {verified && !site.tracker_ready && <Notice tone="info">Verified. The tracker is being prepared; check again in a moment.</Notice>}
    </Panel>
  );
}

export default function Sites({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useSitesQuery(id);
  const [add, { isLoading: adding, error }] = useAddSiteMutation();
  const [domain, setDomain] = useState("");
  const sites = data?.sites ?? [];
  return (
    <>
      <PageHeader title="Web analytics" description="Privacy-first page analytics from a pinned, self-hosted Umami. A domain must be verified before a tracker is issued." />
      <div className="grid gap-6">
        <Panel title="Add a site">
          <form className="flex max-w-xl flex-wrap items-end gap-3" onSubmit={async (e) => { e.preventDefault(); if (await add({ id, domain }).unwrap().catch(() => null)) setDomain(""); }}>
            <div className="grid min-w-56 flex-1 gap-1.5">
              <Label htmlFor="d">Domain</Label>
              <Input id="d" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="app.example.com" required />
            </div>
            <Button type="submit" disabled={adding}><Plus /> {adding ? "Adding…" : "Add site"}</Button>
          </form>
          {error && <div className="mt-3 max-w-xl"><Notice tone="bad">Enter a public hostname (no scheme, port, IP or path) that is not already registered.</Notice></div>}
        </Panel>
        {isLoading ? <Skeleton className="h-32" /> : sites.length ? sites.map((s) => <SiteCard key={s.id} id={id} site={s} />) : (
          <Empty title="No sites yet">Add the domain of your app or marketing site. After DNS or file verification, a one-line tracker is issued.</Empty>
        )}
      </div>
    </>
  );
}
