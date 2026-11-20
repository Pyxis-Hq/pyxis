# Forged-signature test against the live sign-in (v2, corrected)

**Run:** 2026-11-20 at 09:19:04 UTC against <https://usepyxis.xyz> (`/api/v1/auth/challenge`, `/api/v1/auth/verify`), authorised by the team. **Result: 14 of 14 checks behaved as required, including a positive control.**
**Files:** script [forged-signature-test.cjs](forged-signature-test.cjs) (needs `@stellar/stellar-sdk`; it resolves it from the demo app's `node_modules`), output [../logs/forged-signature-test-output.txt](../logs/forged-signature-test-output.txt).

## Correction to the first version of this test
The first run (05:51 UTC, reported as "12 of 12") was **flawed and its conclusions are withdrawn**. In Stellar SDK v17 `Keypair.sign()` returns a `Uint8Array`, and the script called `.toString("base64")` on it, which yields a comma-separated string, not base64. So every "signature" it sent, including the ones described as "a correct signature" or "from a different key", was effectively garbage, and the server would have rejected them regardless. The first run therefore did **not** prove that a real but wrong signature is rejected. The bug was found when a later sign-in with the same encoding failed with 401. This version fixes the encoding, checks each signature locally, and adds a **positive control** (a correct signature is accepted), which the first run lacked.

## Method and safety
- Three **throwaway keypairs generated in memory** (never funded, never printed, never stored). No team key or wallet was used.
- The script checks locally that its signing produces a verifiable signature before using it.
- **T0 and T10 create one throwaway user and session** on the target deployment (accepted sign-in). Other cases create only short-lived challenge rows.

## Results
| ID | Case | Expected | Observed |
|---|---|---|---|
| T0 | **Positive control:** correct signature over the issued challenge | 200 | 200 (accepted) |
| T10 | **Replay** of the exact accepted request (same nonce) | 401 | 401 `auth_failed` |
| T1 | Valid signature by a *different* key over the correct message | 401 | 401 `auth_failed` |
| T2 | Correct key signs a *different* message | 401 | 401 `auth_failed` |
| T3 | Correct signature with one byte altered | 401 | 401 `auth_failed` |
| T4a-d | Malformed signature: empty, not base64, too short, too long | 401 | 401 for all four, no crashes |
| T5 | Unknown nonce | 401 | 401 `auth_failed` |
| T6 | A genuinely correct signature sent after a failed attempt burned the nonce | 401 | 401 `auth_failed` |
| T7 | Challenge issued for account A presented for account B (B signs it correctly) | 401 | 401 `auth_failed` |
| T8 | Challenge request for an invalid account | 400 | 400 `invalid_account` |
| T9 | Verify with missing fields | 400 | 400 `invalid_request` |

## What this shows
- The server accepts a correct signature (T0) and **rejects** every wrong-key, wrong-message, altered, malformed, unknown-nonce and cross-account variant, so the rejections are meaningful, not an artefact of broken test input.
- A challenge is **single-use**: the accepted request cannot be replayed (T10), and a failed attempt burns it so even a correct signature afterwards fails (T6). It is also bound to its account (T7).
- All rejections return the same error code, so the response does not reveal which part failed. Malformed input does not crash the endpoint.

## Not tested
- **Expiry:** an unused challenge rejected after its 5-minute lifetime (not waited for).
- **Rate limiting:** none exists, and the challenge endpoint writes a row per call. This run sent about 25 requests.
- Session cookie handling after sign-in, logout, concurrent sessions, timing side channels.

## Limits
One run from one machine against one deployment. Evidence of correct behaviour for these cases, not a security audit.
