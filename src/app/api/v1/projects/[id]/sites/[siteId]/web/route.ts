import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";
import { parseRange } from "@/server/queries";
import { Umami, umamiConfig } from "@/server/umami";

// Tenant-scoped: the Umami website id is looked up from OUR sites table under RLS, never taken from the request.
export async function GET(req: Request, { params }: { params: Promise<{ id: string; siteId: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id, siteId } = await params;
  if (!(await authorize(u, id, "viewer")) || !/^[0-9a-f-]{36}$/.test(siteId)) return err(404, "not_found", "Site not found");
  const range = parseRange(new URL(req.url).searchParams, 7 * 24 * 3600_000);
  if (!range) return err(400, "invalid_range", "from/to invalid or range exceeds 90 days");
  const site = await withContext({ projectId: id }, async (c) => (await c.query("SELECT domain, umami_website_id FROM sites WHERE id=$1 AND project_id=$2 AND verification_status='verified'", [siteId, id])).rows[0]);
  const cfg = umamiConfig();
  if (!site?.umami_website_id || !cfg) return err(404, "not_ready", "Site is not verified or web analytics is not configured");
  const um = new Umami(cfg);
  try {
    return Response.json({ domain: site.domain, snippet: um.snippet(site.umami_website_id, site.domain), ...(await um.report(site.umami_website_id, range.from, range.to)) });
  } catch {
    return err(502, "engine_unavailable", "Web analytics engine did not respond");
  }
}
