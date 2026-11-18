// Pyxis stores metrics only. Logs are rejected explicitly.
export async function POST() {
  return Response.json({ code: "signal_not_supported", message: "Pyxis accepts OTLP metrics only (/v1/metrics)." }, { status: 404 });
}
