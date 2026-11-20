// Tests for the live Pyxis sign-in using throwaway keypairs (never funded; secrets never printed).
// v2: signatures are base64-encoded correctly (Stellar SDK v17 returns a Uint8Array, so Buffer.from(...) is required).
// T0 is a positive control: a correct signature MUST be accepted, which proves the other tests discriminate.
// T0 and T10 create one throwaway user and session in the target deployment.
const { createRequire } = require("node:module");
const { createHash } = require("node:crypto");
const req = createRequire("C:/Users/Ebubechi/Documents/codes/scf-rfp-projects/pyxis-demo-dapp/package.json");
const { Keypair } = req("@stellar/stellar-sdk");
const BASE = process.argv[2] || "https://usepyxis.xyz";
const hash = (m) => createHash("sha256").update("Stellar Signed Message:\n" + m).digest();
const sign = (kp, m) => Buffer.from(kp.sign(hash(m))).toString("base64");
const post = async (p, body) => { const r = await fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); let j = null; try { j = await r.json(); } catch {} return { status: r.status, code: j && j.code, ok: j && j.ok }; };
const challenge = async (kp) => { const r = await fetch(BASE + "/api/v1/auth/challenge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ account: kp.publicKey() }) }); const j = await r.json(); return { status: r.status, ...j }; };
const results = [];
const rec = (id, desc, expect, got) => { const pass = got.status === expect && (expect === 200 ? got.ok === true : !got.ok); results.push({ id, desc, expect, status: got.status, code: got.code, pass }); console.log(`${pass ? "PASS" : "FAIL"} ${id} ${desc} -> HTTP ${got.status} ${got.code ?? ""}`); };

(async () => {
  console.log("target", BASE, "at", new Date().toISOString());
  const A = Keypair.random(), B = Keypair.random(), C = Keypair.random();
  const V = "/api/v1/auth/verify";
  // Sanity: the signature really verifies locally before it is used as a "correct" one.
  { const m = "local check"; console.log("local signature check", A.verify(hash(m), Buffer.from(sign(A, m), "base64")) ? "OK" : "BROKEN"); }
  // T0 positive control (account C)
  let c = await challenge(C); const good = { account: C.publicKey(), nonce: c.nonce, signature: sign(C, c.message) };
  rec("T0", "POSITIVE CONTROL: correct signature over the issued challenge is accepted", 200, await post(V, good));
  // T10 replay of the accepted request
  rec("T10", "replay of the exact accepted request (same nonce)", 401, await post(V, good));
  // T1 signature from a different key over the correct message
  c = await challenge(A); rec("T1", "valid signature by a different key over the correct message", 401, await post(V, { account: A.publicKey(), nonce: c.nonce, signature: sign(B, c.message) }));
  // T2 correct key, wrong message
  c = await challenge(A); rec("T2", "correct key signs a different message", 401, await post(V, { account: A.publicKey(), nonce: c.nonce, signature: sign(A, c.message + "x") }));
  // T3 correct signature with one byte flipped
  c = await challenge(A); { const s = Buffer.from(sign(A, c.message), "base64"); s[10] ^= 1; rec("T3", "correct signature with one byte altered", 401, await post(V, { account: A.publicKey(), nonce: c.nonce, signature: s.toString("base64") })); }
  // T4 malformed signatures
  for (const [n, sig] of [["empty", ""], ["not base64", "!!!notbase64!!!"], ["too short", Buffer.alloc(10).toString("base64")], ["too long", Buffer.alloc(200).toString("base64")]]) {
    c = await challenge(A); rec("T4", `malformed signature (${n})`, 401, await post(V, { account: A.publicKey(), nonce: c.nonce, signature: sig }));
  }
  // T5 unknown nonce
  rec("T5", "unknown nonce", 401, await post(V, { account: A.publicKey(), nonce: "does-not-exist", signature: sign(A, "x") }));
  // T6 burned nonce: forged attempt first, then the CORRECT signature for the same challenge must fail
  c = await challenge(A);
  await post(V, { account: A.publicKey(), nonce: c.nonce, signature: sign(B, c.message) });
  rec("T6", "genuinely correct signature after a failed attempt consumed the nonce", 401, await post(V, { account: A.publicKey(), nonce: c.nonce, signature: sign(A, c.message) }));
  // T7 nonce bound to account: challenge for A, verify claiming B with B's own valid signature over A's message
  c = await challenge(A); rec("T7", "challenge issued for account A presented for account B (B signs it correctly)", 401, await post(V, { account: B.publicKey(), nonce: c.nonce, signature: sign(B, c.message) }));
  // T8 invalid account on the challenge endpoint
  { const r = await post("/api/v1/auth/challenge", { account: "not-a-stellar-key" }); rec("T8", "challenge for an invalid account", 400, r); }
  // T9 missing fields
  rec("T9", "verify with missing fields", 400, await post(V, { account: A.publicKey() }));
  console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.pass).length, results }));
})();
