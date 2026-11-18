import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";
import { apiEndpoints, apiSummary, apiTimeseries, parseRange } from "@/server/queries";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  const a = await authorize(u, id, "viewer", { operatorRead: true });
  if (!a) return err(404, "not_found", "Project not found");
  const range = parseRange(new URL(req.url).searchParams);
  if (!range) return err(400, "invalid_range", "from/to invalid or range exceeds 90 days");
  const data = await withContext({ projectId: id, operator: !a.role }, async (c) => {
    // Operator access to a tenant's endpoint-level view is always audited.
    if (!a.role) await c.query("INSERT INTO operator_audit_events(actor_user_id, action, target_type, target_id) VALUES ($1,'view_project','project',$2)", [u.id, id]);
    return {
      summary: await apiSummary(c, id, range),
      series: await apiTimeseries(c, id, range),
      endpoints: await apiEndpoints(c, id, range),
    };
  });
  return Response.json({ range, ...data });
}
