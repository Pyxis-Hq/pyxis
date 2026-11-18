import { authenticateKey } from "@/server/keys";
import { withContext } from "@/server/db";
import { persistWalletEvents, validateWalletBatch } from "@/server/wallet-events";

const json = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "access-control-allow-origin": "*" } });

// Browser SDK ingest. The browser holds an ingest key scoped to this project; keep it to public sites only.
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "POST, OPTIONS", "access-control-max-age": "86400" },
  });
}

export async function POST(req: Request) {
  const auth = await authenticateKey(req.headers.get("authorization"), "ingest");
  if (!auth.ok) return json(auth.reason === "scope" ? 403 : 401, { code: `auth_${auth.reason}`, message: "Invalid credential" });
  const text = await req.text();
  if (text.length > 20_000) return json(413, { code: "payload_too_large", message: "Body exceeds limit" });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return json(400, { code: "invalid_json", message: "Malformed JSON" }); }
  const v = validateWalletBatch(body);
  if (!v.ok) return json(400, { code: v.reason, message: "Invalid batch" });
  await withContext({ projectId: auth.key.projectId }, (c) => persistWalletEvents(c, auth.key.projectId, v.events));
  return json(200, { accepted: v.events.length, rejected: v.rejected });
}
