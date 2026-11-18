"use client";
import { use, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CodeBlock, Empty, fmt, Notice, PageHeader, Panel, Skeleton, Status } from "@/components/pyxis/ui";
import { useCreateKeyMutation, useKeysQuery, useRevokeKeyMutation } from "@/lib/api";

const snippet = (token: string, origin: string) => `# Dual-export: keep your existing APM, add Pyxis.
export OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=${origin}/v1/metrics
export OTEL_EXPORTER_OTLP_METRICS_HEADERS="Authorization=Bearer ${token}"
export OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE=delta
export OTEL_SERVICE_NAME=my-api
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=testnet`;

export default function Keys({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useKeysQuery(id);
  const [create, { isLoading: creating, error }] = useCreateKeyMutation();
  const [revoke] = useRevokeKeyMutation();
  const [name, setName] = useState("production");
  const [fresh, setFresh] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const keys = data?.keys ?? [];

  return (
    <>
      <PageHeader title="Keys & setup" description="An ingest key decides which project a metric belongs to. Create one, then add the generated settings to your service." />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Panel title="1. Create an ingest key">
          <form
            className="grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await create({ id, name, scopes: ["ingest"] }).unwrap().catch(() => null);
              if (r) setFresh(r.token);
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="kname">Label</Label>
              <Input id="kname" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
              <p className="text-xs text-muted-foreground">Name the service or environment that will use it, for example &quot;production&quot;.</p>
            </div>
            {error && <Notice tone="bad">Could not create the key. Check the label and try again.</Notice>}
            <div><Button type="submit" disabled={creating}><Plus /> {creating ? "Creating…" : "Create key"}</Button></div>
          </form>
        </Panel>

        <Panel title="2. Add the settings to your service" aside="OpenTelemetry, metrics only">
          {fresh ? (
            <div className="grid gap-3">
              <Notice tone="warn" title="Copy this now. It will not be shown again.">Only a one-way hash of the secret is stored, so the token cannot be recovered later.</Notice>
              <CodeBlock code={snippet(fresh, origin)} label="Copy settings" />
              <p className="text-xs text-muted-foreground">Set these in the environment of your service, then send some traffic. The Overview page checks for data every 15 seconds. Pyxis accepts metrics only; traces and logs are rejected.</p>
            </div>
          ) : (
            <Empty title="Create a key to see your settings">The environment variables for your exporter are generated with your new key, and are shown once.</Empty>
          )}
        </Panel>
      </div>

      <Panel title="Keys" className="mt-6" flush aside="Revocation takes effect on the next request">
        {isLoading ? (
          <div className="space-y-2 p-4"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
        ) : !keys.length ? (
          <div className="p-4"><Empty title="No keys yet">Keys you create appear here with their last-used time.</Empty></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Label</TableHead><TableHead>Key ID</TableHead><TableHead>Scopes</TableHead><TableHead>Last used</TableHead><TableHead>State</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell className="font-mono text-xs">pyx_live_{k.key_id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{k.scopes.join(", ")}</TableCell>
                  <TableCell className={cn("text-xs text-muted-foreground", k.last_used_at && "tnum")}>{fmt.when(k.last_used_at)}</TableCell>
                  <TableCell>{k.revoked_at ? <Status state="off">Revoked</Status> : <Status state="ok">Active</Status>}</TableCell>
                  <TableCell className="text-right">
                    {!k.revoked_at &&
                      (confirm === k.key_id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Revoke this key?</span>
                          <Button variant="destructive" size="xs" onClick={() => { revoke({ id, keyId: k.key_id }); setConfirm(null); }}>Revoke</Button>
                          <Button variant="ghost" size="xs" onClick={() => setConfirm(null)}>Cancel</Button>
                        </span>
                      ) : (
                        <Button variant="ghost" size="xs" onClick={() => setConfirm(k.key_id)}><Trash2 /> Revoke</Button>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
