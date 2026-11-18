import { authenticateKey } from "@/server/keys";
import { withContext } from "@/server/db";
import { LIMITS, parseOtlpMetrics, persist } from "@/server/ingest/otlp";

const json = (status: number, body: unknown) => Response.json(body, { status });

// OTLP/HTTP (JSON) metrics receiver. Authentication happens BEFORE the body is read.
export async function POST(req: Request) {
  const auth = await authenticateKey(req.headers.get("authorization"), "ingest");
  if (!auth.ok) return json(auth.reason === "scope" ? 403 : 401, { code: `auth_${auth.reason}`, message: "Invalid credential" });

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json"))
    return json(415, { code: "unsupported_content_type", message: "MVP supports OTLP/HTTP JSON only. Set OTEL_EXPORTER_OTLP_PROTOCOL=http/json." });
  if (Number(req.headers.get("content-length") ?? 0) > LIMITS.maxBodyBytes) return json(413, { code: "payload_too_large", message: "Body exceeds limit" });

  const text = await req.text();
  if (text.length > LIMITS.maxBodyBytes) return json(413, { code: "payload_too_large", message: "Body exceeds limit" });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { code: "invalid_json", message: "Malformed JSON" });
  }

  const parsed = parseOtlpMetrics(body as Record<string, unknown>);
  const dpTotal = parsed.accepted + Object.values(parsed.dropped).reduce((s, n) => s + n, 0);
  if (dpTotal > LIMITS.maxDataPoints) return json(413, { code: "too_many_data_points", message: "Batch too large" });

  const dropped = await withContext({ projectId: auth.key.projectId }, async (c) => {
    const d = await persist(c, auth.key.projectId, parsed);
    await c.query("UPDATE api_keys SET last_used_at = now() WHERE id = $1", [auth.key.id]);
    return d;
  });
  const rejected = Object.values(dropped).reduce((s, n) => s + n, 0);
  // Acknowledged only after the DB commit: the durability boundary is a committed row.
  return json(200, rejected ? { partialSuccess: { rejectedDataPoints: String(rejected), errorMessage: Object.keys(dropped).join(",") } } : {});
}
