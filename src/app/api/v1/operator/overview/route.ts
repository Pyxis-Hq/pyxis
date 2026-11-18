import { pool, withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";
import { apiSummary, parseRange } from "@/server/queries";

// Operator view: aggregates only. No keys, members, sites or raw rows are returned.
export async function GET(req: Request) {
  const u = await requireUser();
  if (isRes(u)) return u;
  if (!u.isOperator) return err(403, "forbidden", "Operator role required");
  const range = parseRange(new URL(req.url).searchParams, 7 * 24 * 3600_000);
  if (!range) return err(400, "invalid_range", "from/to invalid or range exceeds 90 days");
  const projects = (await pool().query("SELECT * FROM pyxis_operator_projects()")).rows;
  const out = await withContext({ operator: true }, async (c) => {
    const list = [];
    for (const p of projects) list.push({ id: p.id, name: p.name, status: p.status, ...(await apiSummary(c, p.id, range)) });
    const total = await apiSummary(c, null, range);
    await c.query("INSERT INTO operator_audit_events(actor_user_id, action, target_type, target_id) VALUES ($1,'view_overview','ecosystem','all')", [u.id]);
    return { total, projects: list };
  });
  return Response.json({ range, ...out });
}
