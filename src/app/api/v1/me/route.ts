import { currentUser } from "@/server/auth/session";

export async function GET() {
  return Response.json({ user: await currentUser() });
}
