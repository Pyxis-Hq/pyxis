// Local Postgres without Docker: embedded real PostgreSQL on :54329, data in .pyxis-data/. Docker Compose is the documented path.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { migrate } from "./migrate";

const dir = join(process.cwd(), ".pyxis-data");
const fresh = !existsSync(join(dir, "PG_VERSION"));
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port: 54329, persistent: true });
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("pyxis");
await migrate("postgres://postgres:postgres@localhost:54329/pyxis");
console.log("Postgres ready on :54329 (db pyxis). Ctrl+C to stop.");
process.on("SIGINT", async () => { await pg.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
