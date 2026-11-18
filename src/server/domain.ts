import { lookup, resolveTxt } from "node:dns/promises";
import { isIP } from "node:net";
import { randomBytes } from "node:crypto";

export const WELL_KNOWN = "/.well-known/pyxis.txt";
export const newVerificationToken = () => "pyxis-verify=" + randomBytes(18).toString("base64url");

/** Normalizes to an ASCII (punycode) registrable-looking hostname. Rejects IPs, localhost, ports, paths, single labels. */
export function normalizeDomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw || /[\s/@:?#\\]/.test(raw)) return null;
  let host: string;
  try { host = new URL("https://" + raw).hostname; } catch { return null; }
  host = host.replace(/\.$/, "");
  if (isIP(host) || host === "localhost" || !host.includes(".") || host.length > 253) return null;
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) return null;
  if (!host.split(".").every((l) => /^[a-z0-9-]{1,63}$/.test(l) && !l.startsWith("-") && !l.endsWith("-"))) return null;
  return host;
}

export function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
    return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

export type Verification = { ok: boolean; method?: "dns" | "http"; detail: string };

/** DNS TXT at _pyxis.<domain>, else HTTP well-known file. HTTP never follows redirects and refuses private addresses (SSRF). */
export async function verifyDomain(domain: string, token: string, deps = { resolveTxt, lookup, fetch }): Promise<Verification> {
  try {
    const txt = (await deps.resolveTxt("_pyxis." + domain)).map((r) => r.join(""));
    if (txt.includes(token)) return { ok: true, method: "dns", detail: "TXT record matched" };
  } catch { /* fall through to HTTP */ }
  try {
    const addrs = await deps.lookup(domain, { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return { ok: false, detail: "Domain resolves to a non-public address" };
    const r = await deps.fetch("https://" + domain + WELL_KNOWN, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    if (r.status !== 200) return { ok: false, detail: `Well-known file returned HTTP ${r.status}` };
    const body = (await r.text()).slice(0, 512).trim();
    return body === token ? { ok: true, method: "http", detail: "Well-known file matched" } : { ok: false, detail: "Well-known file content did not match" };
  } catch {
    return { ok: false, detail: "No matching DNS TXT record and the well-known file was unreachable" };
  }
}
