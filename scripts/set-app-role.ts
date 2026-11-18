import { Client } from "pg";

// Migrations 001 and 002 create the pyxis_app role with a development password. In a deployed environment, replace it
// with the secret from PYXIS_APP_PASSWORD. Runs after db:migrate; safe to repeat.
async function main() {
  const admin = process.env.ADMIN_DATABASE_URL;
  const password = process.env.PYXIS_APP_PASSWORD;
  if (!admin || !password) throw new Error("ADMIN_DATABASE_URL and PYXIS_APP_PASSWORD are required");
  const c = new Client({ connectionString: admin });
  await c.connect();
  const { rows } = await c.query("SELECT format('ALTER ROLE pyxis_app PASSWORD %L', $1::text) AS q", [password]);
  await c.query(rows[0].q);
  await c.end();
  console.log("pyxis_app password updated");
}

main().catch((e) => { console.error(e); process.exit(1); });
