// Pyxis stores metrics only. Traces are rejected explicitly (RFP: the collector discards traces/spans/deep logs).
export async function POST() {
  return Response.json({ code: "signal_not_supported", message: "Pyxis accepts OTLP metrics only (/v1/metrics)." }, { status: 404 });
}
