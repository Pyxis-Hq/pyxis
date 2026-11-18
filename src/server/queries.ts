import type { PoolClient } from "pg";
import { mergeCounts, quantile } from "./ingest/histogram";

export type Range = { from: Date; to: Date };
export const MAX_RANGE_MS = 90 * 24 * 3600_000;

export function parseRange(sp: URLSearchParams, def = 24 * 3600_000): Range | null {
  const to = sp.get("to") ? new Date(sp.get("to")!) : new Date();
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(to.getTime() - def);
  if (isNaN(+from) || isNaN(+to) || from >= to || +to - +from > MAX_RANGE_MS) return null;
  return { from, to };
}

type Row = { request_count: string; duration_sum_ms: number; histogram_counts: string[]; status_code: number };

export function summarize(rows: Row[]) {
  let total = 0, sum = 0, hist = new Array(12).fill(0);
  const classes: Record<string, number> = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, other: 0 };
  for (const r of rows) {
    const n = Number(r.request_count);
    total += n; sum += r.duration_sum_ms;
    hist = mergeCounts(hist, r.histogram_counts.map(Number));
    const k = Math.floor(r.status_code / 100) + "xx";
    classes[k in classes ? k : "other"] += n;
  }
  const r1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10);
  return {
    requests: total,
    status_classes: classes,
    server_error_rate: total ? classes["5xx"] / total : 0, // 5xx / all responses (docs/04 §6)
    success_rate: total ? (classes["2xx"] + classes["3xx"]) / total : 0,
    avg_ms: total ? r1(sum / total) : null,
    p50_ms: r1(quantile(hist, 0.5)), p95_ms: r1(quantile(hist, 0.95)), p99_ms: r1(quantile(hist, 0.99)),
  };
}

export async function apiSummary(c: PoolClient, projectId: string | null, r: Range) {
  const where = projectId ? "project_id=$3 AND" : "";
  const args: unknown[] = [r.from, r.to, ...(projectId ? [projectId] : [])];
  const { rows } = await c.query(
    `SELECT request_count, duration_sum_ms, histogram_counts, status_code FROM endpoint_metric_buckets WHERE ${where} bucket_start >= $1 AND bucket_start < $2`, args);
  return summarize(rows);
}

export async function apiTimeseries(c: PoolClient, projectId: string, r: Range) {
  const step = +r.to - +r.from > 3 * 24 * 3600_000 ? "day" : +r.to - +r.from > 6 * 3600_000 ? "hour" : "minute";
  const { rows } = await c.query(
    `SELECT date_trunc('${step}', bucket_start) AS t, sum(request_count)::bigint AS requests,
            sum(request_count) FILTER (WHERE status_code >= 500)::bigint AS errors
     FROM endpoint_metric_buckets WHERE project_id=$3 AND bucket_start >= $1 AND bucket_start < $2 GROUP BY 1 ORDER BY 1`,
    [r.from, r.to, projectId]);
  return rows.map((x) => ({ t: x.t, requests: Number(x.requests), errors: Number(x.errors ?? 0) }));
}

export async function apiEndpoints(c: PoolClient, projectId: string, r: Range) {
  const { rows } = await c.query(
    `SELECT bucket_start, service_name, environment, http_method, normalized_route, status_code, request_count, duration_sum_ms, histogram_counts
     FROM endpoint_metric_buckets WHERE project_id=$3 AND bucket_start >= $1 AND bucket_start < $2`, [r.from, r.to, projectId]);
  const SLICES = 24;
  const span = Math.max(1, +r.to - +r.from);
  const g = new Map<string, (Row & { bucket_start: Date })[]>();
  for (const x of rows) {
    const k = [x.service_name, x.environment, x.http_method, x.normalized_route].join("\u0000");
    (g.get(k) ?? g.set(k, []).get(k)!).push(x);
  }
  return [...g.entries()].map(([k, v]) => {
    const [service, environment, method, route] = k.split("\u0000");
    // Shared-scale small multiples: request and 5xx counts over SLICES equal slices of the range.
    const spark = new Array(SLICES).fill(0), spark_err = new Array(SLICES).fill(0);
    for (const x of v) {
      const i = Math.min(SLICES - 1, Math.max(0, Math.floor(((+new Date(x.bucket_start) - +r.from) / span) * SLICES)));
      spark[i] += Number(x.request_count);
      if (x.status_code >= 500) spark_err[i] += Number(x.request_count);
    }
    return { service, environment, method, route, ...summarize(v), spark, spark_err };
  }).sort((a, b) => b.requests - a.requests).slice(0, 500);
}
