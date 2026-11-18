import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id, userId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(userId)) return err(400, "invalid_request", "Invalid member");
  if (!(await authorize(u, id, "admin"))) return err(404, "not_found", "Project not found");
  const removed = await withContext({ projectId: id }, async (c) =>
    (await c.query("DELETE FROM project_members WHERE project_id=$1 AND user_id=$2 AND role <> 'owner'", [id, userId])).rowCount,
  );
  if (!removed) return err(400, "cannot_remove", "Owners cannot be removed.");
  return Response.json({ ok: true });
}
