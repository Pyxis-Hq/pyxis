import { z } from "zod";
import { StrKey } from "@stellar/stellar-sdk";
import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";

const ROLES = ["admin", "developer", "analyst", "viewer"] as const;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  if (!(await authorize(u, id, "viewer"))) return err(404, "not_found", "Project not found");
  const rows = await withContext({ projectId: id }, async (c) =>
    (
      await c.query(
        "SELECT m.user_id, u.stellar_account AS account, m.role, m.created_at FROM project_members m JOIN users u ON u.id = m.user_id WHERE m.project_id=$1 ORDER BY m.created_at",
        [id],
      )
    ).rows,
  );
  return Response.json({ members: rows.map((r) => ({ userId: r.user_id, account: r.account, role: r.role, createdAt: r.created_at, you: r.user_id === u.id })) });
}

/** Adds a member by Stellar account. The person is created on first add and signs in later with that wallet. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  if (!(await authorize(u, id, "admin"))) return err(404, "not_found", "Project not found");
  const p = z.object({ account: z.string().trim(), role: z.enum(ROLES) }).safeParse(await req.json().catch(() => null));
  if (!p.success || !StrKey.isValidEd25519PublicKey(p.data.account)) return err(400, "invalid_account", "Enter a valid Stellar public key (starts with G).");
  await withContext({ projectId: id }, async (c) => {
    const user = await c.query(
      "INSERT INTO users(stellar_account) VALUES ($1) ON CONFLICT (stellar_account) DO UPDATE SET stellar_account = EXCLUDED.stellar_account RETURNING id",
      [p.data.account],
    );
    await c.query(
      "INSERT INTO project_members(project_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = CASE WHEN project_members.role = 'owner' THEN 'owner' ELSE EXCLUDED.role END",
      [id, user.rows[0].id, p.data.role],
    );
  });
  return Response.json({ ok: true }, { status: 201 });
}
