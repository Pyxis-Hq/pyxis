import { cookies } from "next/headers";
import { COOKIE, destroySession } from "@/server/auth/session";

export async function POST() {
  await destroySession();
  (await cookies()).delete(COOKIE);
  return Response.json({ ok: true });
}
