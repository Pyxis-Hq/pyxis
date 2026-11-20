# Forged-signature test against the live sign-in

**Run:** 2026-11-20 at 05:51:29 UTC against <https://usepyxis.xyz> (`/api/v1/auth/challenge`, `/api/v1/auth/verify`), authorised by the team. **Result: 12 of 12 checks behaved as required.**
**Files:** script [forged-signature-test.cjs](forged-signature-test.cjs) (needs `@stellar/stellar-sdk`; it resolves it from the demo app's `node_modules`), output [../logs/forged-signature-test-output.txt](../logs/forged-signature-test-output.txt).

## Method and safety
- Two **throwaway keypairs generated in memory** (never funded, never printed, never stored). No team key, wallet or secret was used.
- Only signatures that must be **rejected** were sent. A correct signature was sent only after its nonce had been consumed by a failed attempt, so it also had to fail. No session was created on purpose.
- Production side effects: about 12 rows in `auth_challenges` (expire in 5 minutes). No `users` or `sessions` rows should exist for the throwaway accounts; this was **not checked in the database**, only inferred from every verify call returning 401.

## Results
| ID | Case | Expected | Observed |
|---|---|---|---|
| T1 | Signature from a different key over the correct message | 401 | 401 `auth_failed` |
| T2 | Correct key signs a different message | 401 | 401 `auth_failed` |
| T3 | Correct signature with one byte altered | 401 | 401 `auth_failed` |
| T4a-d | Malformed signature: empty, not base64, too short, too long | 401 | 401 `auth_failed` for all four (no 500 errors) |
| T5 | Unknown nonce | 401 | 401 `auth_failed` |
| T6 | **Replay:** correct signature sent after a failed attempt used up the nonce | 401 | 401 `auth_failed` |
| T7 | Challenge issued for account A presented for account B (with B's own valid signature) | 401 | 401 `auth_failed` |
| T8 | Challenge request for an invalid account | 400 | 400 `invalid_account` |
| T9 | Verify with missing fields | 400 | 400 `invalid_request` |

## What this shows
- A forged, altered, wrong-key, wrong-message or malformed signature is rejected by the **server** with a single uniform error, so the response does not reveal which part failed.
- A challenge is **single-use and bound to its account**: a failed attempt burns it, and it cannot be reused or moved to another account. This matches the code (`session.ts`: `UPDATE … used_at IS NULL … RETURNING` before verification).
- Malformed input does not crash the endpoint.

## Not tested
- **Expiry:** an unused challenge rejected after its 5-minute lifetime (not waited for).
- **A successful replay of an accepted signature.** Doing it needs a valid sign-in for a throwaway account, which would create a production user and session; not done. T6 covers nonce consumption without that.
- Rate limiting: none exists (a known gap), and the unauthenticated challenge endpoint writes a row per call. This test sent about a dozen requests only.
- Session cookie handling, logout, concurrent sessions.
- Timing side channels.

## Limits
One run from one machine against one deployment, by the team's authorised tester. It is evidence of correct behaviour for these cases, not a security audit.
