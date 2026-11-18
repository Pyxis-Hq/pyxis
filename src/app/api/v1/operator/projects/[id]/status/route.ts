import { z } from "zod";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  if (!u.isOperator) return err(403, "forbidden", "Operator role required");
  const { id } = await params;
  const p = z.object({ status: z.enum(["active", "suspended", "archived"]) }).safeParse(await req.json().catch(() => null));
  if (!p.success || !/^[0-9a-f-]{36}$/.test(id)) return err(400, "invalid_request", "status required");
  const n = await withContext({ operator: true }, async (c) => {
    const r = await c.query("UPDATE projects SET status=$2 WHERE id=$1", [id, p.data.status]);
    await c.query("INSERT INTO operator_audit_events(actor_user_id, action, target_type, target_id, metadata) VALUES ($1,'set_project_status','project',$2,$3)", [u.id, id, { status: p.data.status }]);
    return r.rowCount;
  });
  return n ? Response.json({ ok: true }) : err(404, "not_found", "Project not found");
}
