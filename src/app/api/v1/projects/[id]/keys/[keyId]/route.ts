import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; keyId: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id, keyId } = await params;
  if (!(await authorize(u, id, "developer"))) return err(404, "not_found", "Project not found");
  const n = await withContext({ projectId: id }, async (c) =>
    (await c.query("UPDATE api_keys SET revoked_at = now() WHERE project_id=$1 AND key_id=$2 AND revoked_at IS NULL", [id, keyId])).rowCount,
  );
  return n ? Response.json({ ok: true }) : err(404, "not_found", "Key not found");
}
