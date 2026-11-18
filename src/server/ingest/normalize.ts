const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const G_ADDR = /^G[A-Z2-7]{55}$/;
const C_ADDR = /^C[A-Z2-7]{55}$/;
const M_ADDR = /^M[A-Z2-7]{68}$/;
const HASH = /^(0x)?[0-9a-f]{32,}$/i;
const INT = /^\d+$/;

export const MAX_ROUTE_LEN = 200;
export const MAX_SEGMENTS = 12;

function segment(s: string): string {
  if (UUID.test(s)) return "{uuid}";
  if (G_ADDR.test(s)) return "{stellar_account}";
  if (C_ADDR.test(s)) return "{contract_id}";
  if (M_ADDR.test(s)) return "{muxed_account}";
  if (INT.test(s)) return "{id}";
  if (HASH.test(s)) return "{hash}";
  return s;
}

/** Deterministic path templating. Returns "/_unmatched" if a bounded route can't be produced. */
export function normalizePath(raw: string): string {
  let p = raw.split("#")[0].split("?")[0];
  try { p = decodeURIComponent(p); } catch { return "/_unmatched"; }
  const parts = p.split("/").filter(Boolean);
  if (parts.length > MAX_SEGMENTS) return "/_unmatched";
  const out = "/" + parts.map(segment).join("/");
  if (out.length > MAX_ROUTE_LEN || /[\u0000-\u001f]/.test(out)) return "/_unmatched";
  return out;
}

/**
 * Precedence: trusted http.route template (still validated: must look like a template, no raw IDs) →
 * path normalization → /_unmatched.
 */
export function resolveRoute(httpRoute: string | undefined, path: string | undefined): string {
  if (httpRoute && httpRoute.startsWith("/") && httpRoute.length <= MAX_ROUTE_LEN && !/[?#\s]/.test(httpRoute)) {
    return normalizePath(httpRoute); // validates, collapses slashes, scrubs raw ids accidentally included
  }
  if (path) return normalizePath(path);
  return "/_unmatched";
}
