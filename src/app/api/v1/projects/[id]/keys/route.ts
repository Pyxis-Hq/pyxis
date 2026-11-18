import { z } from "zod";
import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { createKey } from "@/server/keys";
import { err, isRes, requireUser } from "@/server/api";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  if (!(await authorize(u, id, "developer"))) return err(404, "not_found", "Project not found");
  const rows = await withContext({ projectId: id }, async (c) =>
    (await c.query("SELECT id, key_id, name, scopes, created_at, last_used_at, revoked_at FROM api_keys WHERE project_id=$1 ORDER BY created_at DESC", [id])).rows,
  );
  return Response.json({ keys: rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  if (!(await authorize(u, id, "developer"))) return err(404, "not_found", "Project not found");
  const p = z.object({ name: z.string().trim().min(1).max(60), scopes: z.array(z.enum(["ingest", "query"])).min(1) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return err(400, "invalid_request", "name and scopes required");
  const k = await withContext({ projectId: id }, (c) => createKey(c, id, p.data.name, p.data.scopes));
  return Response.json({ keyId: k.keyId, token: k.token, note: "Store this token now. It is never shown again." }, { status: 201 });
}
