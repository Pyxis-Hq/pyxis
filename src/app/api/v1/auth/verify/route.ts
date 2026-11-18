import { z } from "zod";
import { cookies } from "next/headers";
import { COOKIE, verifyChallenge } from "@/server/auth/session";
import { err } from "@/server/api";

export async function POST(req: Request) {
  const p = z.object({ account: z.string(), nonce: z.string(), signature: z.string() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return err(400, "invalid_request", "account, nonce, signature required");
  try {
    const token = await verifyChallenge(p.data.account, p.data.nonce, p.data.signature);
    (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
    return Response.json({ ok: true });
  } catch {
    return err(401, "auth_failed", "Challenge invalid, expired or signature mismatch");
  }
}
