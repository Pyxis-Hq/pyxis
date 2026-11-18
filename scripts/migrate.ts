import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { Client } from "pg";

export async function migrate(adminUrl: string, dir = join(process.cwd(), "db", "migrations")) {
  const c = new Client({ connectionString: adminUrl });
  await c.connect();
  await c.query("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ DEFAULT now())");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(dir, f), "utf8");
    const sum = createHash("sha256").update(sql).digest("hex");
    const prev = await c.query("SELECT checksum FROM _migrations WHERE name=$1", [f]);
    if (prev.rowCount) {
      if (prev.rows[0].checksum !== sum) throw new Error(`Migration ${f} was modified after being applied`);
      continue;
    }
    await c.query("BEGIN");
    try { await c.query(sql); await c.query("INSERT INTO _migrations(name, checksum) VALUES ($1,$2)", [f, sum]); await c.query("COMMIT"); }
    catch (e) { await c.query("ROLLBACK"); throw e; }
    console.log("applied", f);
  }
  await c.end();
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  migrate(process.env.ADMIN_DATABASE_URL ?? "postgres://postgres:postgres@localhost:54329/pyxis").catch((e) => { console.error(e); process.exit(1); });
}
