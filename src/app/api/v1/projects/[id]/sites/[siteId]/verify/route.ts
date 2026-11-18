import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";
import { verifyDomain } from "@/server/domain";
import { Umami, umamiConfig } from "@/server/umami";

export async function POST(_: Request, { params }: { params: Promise<{ id: string; siteId: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id, siteId } = await params;
  if (!(await authorize(u, id, "admin")) || !/^[0-9a-f-]{36}$/.test(siteId)) return err(404, "not_found", "Site not found");
  const site = await withContext({ projectId: id }, async (c) => (await c.query("SELECT domain, verification_token, umami_website_id FROM sites WHERE id=$1 AND project_id=$2", [siteId, id])).rows[0]);
  if (!site) return err(404, "not_found", "Site not found");

  const v = await verifyDomain(site.domain, site.verification_token);
  if (!v.ok) return Response.json({ verified: false, detail: v.detail });

  // Verified: create the Umami website through its supported API (once), then mark active.
  let websiteId: string | null = site.umami_website_id;
  const cfg = umamiConfig();
  if (!websiteId && cfg) {
    try { websiteId = (await new Umami(cfg).createWebsite(site.domain, site.domain)).id; }
    catch { return Response.json({ verified: true, tracker_ready: false, detail: "Domain verified, but the web analytics engine is unavailable. Retry shortly." }); }
  }
  await withContext({ projectId: id }, (c) => c.query("UPDATE sites SET verification_status='verified', umami_website_id=$3 WHERE id=$1 AND project_id=$2", [siteId, id, websiteId]));
  return Response.json({ verified: true, method: v.method, tracker_ready: !!websiteId, detail: websiteId ? "Verified. Install the tracker snippet." : "Verified. Web analytics engine is not configured on this deployment." });
}
