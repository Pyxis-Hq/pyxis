import { currentUser, type Me } from "./auth/session";

export const err = (status: number, code: string, message: string) => Response.json({ code, message }, { status });

export async function requireUser(): Promise<Me | Response> {
  return (await currentUser()) ?? err(401, "unauthenticated", "Sign in required");
}
export const isRes = (x: unknown): x is Response => x instanceof Response;
