import type { PoolClient } from "pg";
import { HISTOGRAM_BUCKETS, rebucket } from "./histogram";
import { resolveRoute } from "./normalize";

// Canonical mapping (ADR-004): duration histograms only; request count = histogram count, so nothing is double counted.
const ALLOWED_METRICS = new Set(["http.server.request.duration", "http.server.duration"]);
const METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "CONNECT", "TRACE"]);
export const LIMITS = {
  maxBodyBytes: 1_000_000,
  maxDataPoints: 5_000,
  maxServicesPerProject: 10,
  maxRoutesPerService: 200,
  maxAgeMs: 24 * 3600_000,
  maxFutureMs: 5 * 60_000,
};
export const BUCKET_SECONDS = 60;

type KV = { key: string; value: Record<string, string | number | boolean | undefined> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

function attrs(list: KV[] | undefined): Record<string, string> {
  const o: Record<string, string> = {};
  for (const a of list ?? []) {
    const v = a.value ?? {};
    const val = v.stringValue ?? v.intValue ?? v.doubleValue ?? v.boolValue;
    if (val !== undefined) o[a.key] = String(val);
  }
  return o;
}

export type AggRow = {
  bucketStart: Date;
  service: string;
  environment: string;
  method: string;
  route: string;
  status: number;
  count: number;
  sumMs: number;
  hist: number[];
};

export type Parsed = { rows: AggRow[]; dropped: Record<string, number>; accepted: number };

const drop = (d: Record<string, number>, r: string, n = 1) => {
  d[r] = (d[r] ?? 0) + n;
};

const DELTA = new Set([1, "AGGREGATION_TEMPORALITY_DELTA"]);

/** Pure: OTLP/JSON ExportMetricsServiceRequest -> bounded aggregates. Tenant is NOT read from the payload. */
export function parseOtlpMetrics(body: AnyObj, now = Date.now()): Parsed {
  const dropped: Record<string, number> = {};
  const map = new Map<string, AggRow>();
  let accepted = 0;

  for (const rm of body.resourceMetrics ?? []) {
    const res = attrs(rm.resource?.attributes);
    const service = (res["service.name"] ?? "").slice(0, 80);
    const environment = (res["deployment.environment.name"] ?? res["deployment.environment"] ?? "default").slice(0, 40);
    for (const sm of rm.scopeMetrics ?? [])
      for (const m of sm.metrics ?? []) {
        const hist = m.histogram;
        const npts = hist?.dataPoints?.length ?? m.sum?.dataPoints?.length ?? m.gauge?.dataPoints?.length ?? 1;
        if (!ALLOWED_METRICS.has(m.name)) { drop(dropped, "metric_not_allowed", npts); continue; }
        if (!hist) { drop(dropped, "wrong_metric_type", npts); continue; }
        if (!DELTA.has(hist.aggregationTemporality)) { drop(dropped, "cumulative_temporality_unsupported", npts); continue; }
        if (!service) { drop(dropped, "missing_service_name", npts); continue; }
        if (!["s", "ms", "us", "ns", ""].includes(m.unit ?? "")) { drop(dropped, "unsupported_unit", npts); continue; }
        const factor = m.unit === "s" ? 1000 : m.unit === "us" ? 0.001 : m.unit === "ns" ? 1e-6 : 1;

        for (const dp of hist.dataPoints ?? []) {
          const a = attrs(dp.attributes);
          const status = Number(a["http.response.status_code"] ?? a["http.status_code"]);
          if (!Number.isInteger(status) || status < 100 || status > 599) { drop(dropped, "invalid_status_code"); continue; }
          let t = 0;
          try { t = Number(BigInt(dp.timeUnixNano ?? "0") / 1_000_000n); } catch { t = 0; }
          if (!t || t < now - LIMITS.maxAgeMs) { drop(dropped, "timestamp_too_old"); continue; }
          if (t > now + LIMITS.maxFutureMs) { drop(dropped, "timestamp_in_future"); continue; }
          const bounds = (dp.explicitBounds ?? []).map((x: number) => x * factor);
          const counts = (dp.bucketCounts ?? []).map((x: string | number) => Number(x));
          if (counts.length !== bounds.length + 1 || counts.some((n: number) => !Number.isFinite(n) || n < 0)) {
            drop(dropped, "malformed_histogram");
            continue;
          }
          const count = counts.reduce((s: number, n: number) => s + n, 0);
          const method = (a["http.request.method"] ?? a["http.method"] ?? "").toUpperCase();
          const route = resolveRoute(a["http.route"], a["url.path"] ?? a["http.target"]);
          const row: AggRow = {
            bucketStart: new Date(Math.floor(t / (BUCKET_SECONDS * 1000)) * BUCKET_SECONDS * 1000),
            service,
            environment,
            method: METHODS.has(method) ? method : "_OTHER",
            route,
            status,
            count,
            sumMs: Number(dp.sum ?? 0) * factor,
            hist: rebucket(bounds, counts),
          };
          const k = [row.bucketStart.getTime(), service, environment, row.method, route, status].join("|");
          const ex = map.get(k);
          if (ex) {
            ex.count += row.count;
            ex.sumMs += row.sumMs;
            ex.hist = ex.hist.map((n, i) => n + row.hist[i]);
          } else map.set(k, row);
          accepted++;
        }
      }
  }
  return { rows: [...map.values()], dropped, accepted };
}

/** Persist for an ALREADY-authenticated project. Enforces service and route cardinality caps. */
export async function persist(c: PoolClient, projectId: string, parsed: Parsed): Promise<Record<string, number>> {
  const dropped = { ...parsed.dropped };
  const known = new Set<string>(
    (await c.query("SELECT service_name||'|'||environment AS k FROM services WHERE project_id=$1", [projectId])).rows.map((r) => r.k),
  );
  const routeSets = new Map<string, Set<string>>();
  const setFor = (k: string) => {
    let s = routeSets.get(k);
    if (!s) routeSets.set(k, (s = new Set()));
    return s;
  };
  const existing = await c.query(
    "SELECT DISTINCT service_name, environment, normalized_route FROM endpoint_metric_buckets WHERE project_id=$1 AND bucket_start > now() - interval '7 days'",
    [projectId],
  );
  for (const r of existing.rows) setFor(r.service_name + "|" + r.environment).add(r.normalized_route);

  for (const row of parsed.rows) {
    const sk = row.service + "|" + row.environment;
    if (!known.has(sk)) {
      if (known.size >= LIMITS.maxServicesPerProject) { drop(dropped, "service_quota_exceeded", row.count); continue; }
      await c.query("INSERT INTO services(project_id, service_name, environment) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [projectId, row.service, row.environment]);
      known.add(sk);
    }
    const routes = setFor(sk);
    let route = row.route;
    if (!routes.has(route)) {
      if (routes.size >= LIMITS.maxRoutesPerService) { route = "/_other"; drop(dropped, "route_cardinality_capped", row.count); }
      routes.add(route);
    }
    if (row.hist.length !== HISTOGRAM_BUCKETS) throw new Error("histogram length");
    await c.query(
      `INSERT INTO endpoint_metric_buckets(project_id,bucket_start,bucket_seconds,service_name,environment,http_method,normalized_route,status_code,request_count,duration_sum_ms,histogram_counts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (project_id,bucket_start,bucket_seconds,service_name,environment,http_method,normalized_route,status_code)
       DO UPDATE SET request_count = endpoint_metric_buckets.request_count + EXCLUDED.request_count,
                     duration_sum_ms = endpoint_metric_buckets.duration_sum_ms + EXCLUDED.duration_sum_ms,
                     histogram_counts = pyxis_add_arrays(endpoint_metric_buckets.histogram_counts, EXCLUDED.histogram_counts)`,
      [projectId, row.bucketStart, BUCKET_SECONDS, row.service, row.environment, row.method, route, row.status, row.count, row.sumMs, row.hist],
    );
  }
  const droppedTotal = Object.values(dropped).reduce((s, n) => s + n, 0);
  await c.query(
    "INSERT INTO ingestion_audit(project_id, signal_type, outcome, reason_code, data_point_count) VALUES ($1,'metrics',$2,$3,$4)",
    [projectId, droppedTotal ? "dropped" : "accepted", Object.keys(dropped).join(",") || null, parsed.accepted],
  );
  return dropped;
}
