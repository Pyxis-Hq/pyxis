// A real local HTTP service instrumented with the STOCK OpenTelemetry Node SDK, configured only through the
// environment variables documented in Pyxis' "API metrics" guide. Nothing is inserted into Pyxis any other way.
// The ingest key is read from a private state file and never printed.
const fs = require("node:fs");
const state = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const TOTAL = Number(process.argv[3] || 150);

// Documented configuration (docs.usepyxis.xyz/docs/guides/api-metrics)
process.env.OTEL_EXPORTER_OTLP_METRICS_PROTOCOL = "http/json";
process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT = "https://usepyxis.xyz/v1/metrics";
process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS = "Authorization=Bearer " + state.ingestToken;
process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE = "delta";
process.env.OTEL_SERVICE_NAME = "capture-demo-api";
process.env.OTEL_RESOURCE_ATTRIBUTES = "deployment.environment.name=testnet";
process.env.OTEL_METRIC_EXPORT_INTERVAL = "5000";
process.env.OTEL_SEMCONV_STABILITY_OPT_IN = "http";
process.env.OTEL_LOG_LEVEL = "error";

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const sdk = new NodeSDK({ instrumentations: [new HttpInstrumentation()] });
sdk.start();

const http = require("node:http");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a));

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/health") { await sleep(rnd(1, 8)); res.end("ok"); return; }
  if (u.pathname.startsWith("/accounts/")) { await sleep(rnd(20, 140)); res.setHeader("content-type", "application/json"); res.end("{}"); return; }
  if (u.pathname === "/transactions" && req.method === "POST") {
    await sleep(rnd(90, 700));
    if (Math.random() < 0.08) { res.statusCode = 500; res.end("error"); return; }
    res.statusCode = 201; res.end("{}"); return;
  }
  if (u.pathname.startsWith("/contracts/")) { await sleep(rnd(40, 320)); res.end("{}"); return; }
  res.statusCode = 404; res.end("not found");
});

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  // Plausible Stellar-shaped traffic; identifiers are random public-looking strings, not real accounts.
  const acct = () => "G" + Array.from({ length: 55 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[rnd(0, 32)]).join("");
  const ctr = () => "C" + Array.from({ length: 55 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[rnd(0, 32)]).join("");
  let sent = 0; const counts = {};
  for (let i = 0; i < TOTAL; i++) {
    const r = Math.random(); let url, method = "GET";
    if (r < 0.2) url = "/health"; else if (r < 0.55) url = "/accounts/" + acct(); else if (r < 0.75) { url = "/transactions"; method = "POST"; } else if (r < 0.92) url = "/contracts/" + ctr(); else url = "/unknown/" + rnd(1, 9999);
    const resp = await fetch(base + url, { method }); await resp.text();
    counts[resp.status] = (counts[resp.status] || 0) + 1; sent++;
    await sleep(rnd(60, 220));
  }
  console.log("workload done: requests", sent, "status mix", JSON.stringify(counts));
  await sleep(6000);              // let the periodic reader export the last interval
  await sdk.shutdown();           // final flush
  server.close();
  console.log("sdk flushed and shut down");
  process.exit(0);
});
