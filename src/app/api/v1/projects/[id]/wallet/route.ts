import { authorize } from "@/server/auth/session";
import { withContext } from "@/server/db";
import { err, isRes, requireUser } from "@/server/api";
import { parseRange } from "@/server/queries";
import { walletFunnel } from "@/server/wallet-events";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  if (isRes(u)) return u;
  const { id } = await params;
  const a = await authorize(u, id, "viewer", { operatorRead: true });
  if (!a) return err(404, "not_found", "Project not found");
  const range = parseRange(new URL(req.url).searchParams);
  if (!range) return err(400, "invalid_range", "from/to invalid or range exceeds 90 days");
  const funnel = await withContext({ projectId: id, operator: !a.role }, (c) => walletFunnel(c, id, range.from, range.to));
  return Response.json({ reported_by: "frontend", verified_on_ledger: false, funnel });
}
