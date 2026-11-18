import { z } from "zod";
import { createChallenge } from "@/server/auth/session";
import { err } from "@/server/api";

export async function POST(req: Request) {
  const p = z.object({ account: z.string() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return err(400, "invalid_request", "account required");
  try {
    return Response.json(await createChallenge(p.data.account));
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_account") return err(400, "invalid_account", "Not a valid Stellar public key");
    console.error("challenge failed", e);
    return err(503, "service_unavailable", "Could not create a sign-in challenge. The database may be unavailable.");
  }
}
