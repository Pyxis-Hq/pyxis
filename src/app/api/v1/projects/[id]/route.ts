import { z } from "zod";
import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  const a = await authorize(u, id, "viewer");
  if (!a) return err(404, "not_found", "Project not found");
  const row = await withContext({ projectId: id }, async (c) =>
    (await c.query("SELECT id, name, description, status, created_at FROM projects WHERE id=$1", [id])).rows[0],
  );
  if (!row) return err(404, "not_found", "Project not found");
  return Response.json({ ...row, role: a.role });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  if (!(await authorize(u, id, "admin"))) return err(404, "not_found", "Project not found");
  const p = z
    .object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).nullable().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success) return err(400, "invalid_request", "name must be 2-100 chars");
  await withContext({ projectId: id }, (c) =>
    c.query("UPDATE projects SET name=$2, description=$3 WHERE id=$1", [id, p.data.name, p.data.description || null]),
  );
  return Response.json({ ok: true });
}
