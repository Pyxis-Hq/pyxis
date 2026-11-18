"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Notice, PageHeader, Panel, Skeleton, Status } from "@/components/pyxis/ui";
import { useCreateProjectMutation, useProjectsQuery } from "@/lib/api";

function CreateForm({ first }: { first?: boolean }) {
  const [create, { isLoading, error }] = useCreateProjectMutation();
  const [name, setName] = useState("");
  const router = useRouter();
  return (
    <form
      className="grid max-w-md gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await create({ name }).unwrap().catch(() => null);
        if (r) router.push(`/projects/${r.id}`);
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="pname">Project name</Label>
        <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required placeholder="e.g. Payments API" autoFocus={first} />
        <p className="text-xs text-muted-foreground">One project holds the API metrics, websites and wallet funnel for one product. You can rename it later.</p>
      </div>
      {error && <Notice tone="bad">Could not create the project. The name must be 2 to 100 characters.</Notice>}
      <div>
        <Button type="submit" disabled={isLoading}><Plus /> {isLoading ? "Creating…" : "Create project"}</Button>
      </div>
    </form>
  );
}

export default function Projects() {
  const { data, isLoading } = useProjectsQuery();
  const projects = data?.projects ?? [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Projects" />
        <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
      </>
    );
  }

  if (!projects.length) {
    return (
      <>
        <PageHeader title="Welcome to Pyxis" description="Create a project, add an ingest key, and send your first metrics. Setup usually takes a few minutes." />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Panel title="Create your first project"><CreateForm first /></Panel>
          <Panel title="What happens next">
            <ol className="space-y-4 text-sm">
              {[
                ["Create a project", "This gives your data its own isolated space."],
                ["Mint an ingest key", "The key decides which project a metric belongs to."],
                ["Point your exporter at Pyxis", "Copy the generated OpenTelemetry settings."],
                ["See your first data point", "The overview updates every 15 seconds."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[1.5rem_1fr] gap-2">
                  <span className="grid size-6 place-items-center rounded-full border border-border-strong text-xs font-medium tnum">{i + 1}</span>
                  <span><span className="font-medium">{t}.</span> <span className="text-muted-foreground">{d}</span></span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Projects" description="Projects you belong to. Each one is isolated: you only ever see its own data." />
      <Panel title={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`} flush>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Your role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id} className="group">
                <TableCell className="py-3 pl-4"><Link className="font-medium hover:underline underline-offset-4" href={`/projects/${p.id}`}>{p.name}</Link></TableCell>
                <TableCell className="capitalize text-muted-foreground">{p.role}</TableCell>
                <TableCell><Status state={p.status === "active" ? "ok" : "warn"}><span className="capitalize">{p.status}</span></Status></TableCell>
                <TableCell><Link href={`/projects/${p.id}`} aria-label={`Open ${p.name}`}><ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground" /></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <Panel title="New project" className="mt-6"><CreateForm /></Panel>
    </>
  );
}
