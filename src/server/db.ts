import { Pool, type PoolClient } from "pg";

// Runtime connection uses the non-owner pyxis_app role; RLS applies to every query.
const g = globalThis as unknown as { __pyxisPool?: Pool };

export function pool(): Pool {
  if (!g.__pyxisPool) {
    g.__pyxisPool = new Pool({
      connectionString: process.env.DATABASE_URL ?? "postgres://pyxis_app:pyxis_app@localhost:54329/pyxis",
      max: 10,
      statement_timeout: 15_000,
    });
  }
  return g.__pyxisPool;
}

export type Ctx = { projectId?: string; operator?: boolean };

/** Runs fn in a transaction with tenant context set transaction-locally (never session-level). */
export async function withContext<T>(ctx: Ctx, fn: (c: PoolClient) => Promise<T>, p: Pool = pool()): Promise<T> {
  const c = await p.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('app.project_id', $1, true), set_config('app.is_operator', $2, true)", [
      ctx.projectId ?? "",
      ctx.operator ? "on" : "",
    ]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
