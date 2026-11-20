# Umami deployment verification

**Status:** VERIFIED. Provisioned and verified on 2026-11-20 during this work.

| Item | Value |
|---|---|
| Version | Umami `2.20.2`, image `ghcr.io/umami-software/umami:postgresql-v2.20.2` (pinned tag; not a digest) |
| URL | <https://umami-production-ce478188.up.railway.app> (Railway service `umami`, own Postgres service, separate from the Pyxis database) |
| Health | `/api/heartbeat` returned `{"ok":true}`; `/script.js` 200 with CORS `*`; `/api/send` preflight 204 |
| Tracker | `<UMAMI_PUBLIC_URL>/script.js`. **The tracker file itself is not version-pinned**: it is served by the pinned server, but the snippet carries no version |
| Website | id `e23233f9-a2fe-4aad-ba10-5908704cce83`, domain `pyxis-demo-dapp.vercel.app`, created **by the Pyxis code** through the Umami API after a domain check |
| Authentication | Pyxis logs in with an admin account (`UMAMI_USER`, `UMAMI_PASSWORD` on the `web` service). The default `admin/umami` password was changed before use; between provisioning and the change it was publicly reachable for about a minute |
| Pyxis variables | `UMAMI_URL` (internal address), `UMAMI_PUBLIC_URL`, `UMAMI_USER`, `UMAMI_PASSWORD` set on `web`; `web` redeployed |

Observations to disclose:
- Port mismatch: the image listens on 8080; `PORT=3000` was set to match the domain target.
- The APP_SECRET appeared in a command output during setup; it guards only this Umami instance and should be rotated if the transcript is shared.
- Umami has no backups, monitoring or access limits beyond its login. It is a demonstration instance, not the production plan.
- This is the first time Pyxis's `src/server/umami.ts` ran against a real Umami: login and website creation worked. The statistics reader (`report`) has not been exercised through Pyxis yet; see [analytics-verification.md](analytics-verification.md).
