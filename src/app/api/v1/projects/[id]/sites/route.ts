import { z } from "zod";
import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";
import { newVerificationToken, normalizeDomain, WELL_KNOWN } from "@/server/domain";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  if (!(await authorize(u, id, "viewer"))) return err(404, "not_found", "Project not found");
  const sites = await withContext({ projectId: id }, async (c) =>
    (await c.query("SELECT id, domain, verification_status, verification_token, umami_website_id IS NOT NULL AS tracker_ready FROM sites WHERE project_id=$1 ORDER BY created_at", [id])).rows);
  return Response.json({
    sites: sites.map((s) => ({
      id: s.id, domain: s.domain, status: s.verification_status, tracker_ready: s.tracker_ready,
      // The challenge token is not a secret credential; it only proves domain control when published.
      challenge: s.verification_status === "verified" ? null : { token: s.verification_token, dns: `_pyxis.${s.domain} TXT "${s.verification_token}"`, http: `https://${s.domain}${WELL_KNOWN}` },
    })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  if (!(await authorize(u, id, "admin"))) return err(404, "not_found", "Project not found");
  const p = z.object({ domain: z.string().max(253) }).safeParse(await req.json().catch(() => null));
  const domain = p.success ? normalizeDomain(p.data.domain) : null;
  if (!domain) return err(400, "invalid_domain", "Enter a public hostname such as app.example.com (no scheme, port, IP or path)");
  try {
    const row = await withContext({ projectId: id }, async (c) =>
      (await c.query("INSERT INTO sites(project_id, domain, verification_token) VALUES ($1,$2,$3) RETURNING id", [id, domain, newVerificationToken()])).rows[0]);
    return Response.json({ id: row.id, domain }, { status: 201 });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return err(409, "duplicate_domain", "Domain already registered in this project");
    throw e;
  }
}
