import { z } from "zod";
import { pool } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";

export async function GET() {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { rows } = await pool().query("SELECT * FROM pyxis_user_projects($1)", [u.id]);
  return Response.json({ projects: rows.map((r) => ({ id: r.project_id, name: r.name, status: r.status, role: r.role })) });
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const p = z.object({ name: z.string().trim().min(2).max(100), description: z.string().max(500).optional() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return err(400, "invalid_request", "name must be 2-100 chars");
  const { rows } = await pool().query("SELECT pyxis_create_project($1,$2,$3) AS id", [u.id, p.data.name, p.data.description ?? null]);
  return Response.json({ id: rows[0].id }, { status: 201 });
}
