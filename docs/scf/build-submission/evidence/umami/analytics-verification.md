# Analytics verification (Umami API, read by the auditor)

**Method:** logged in to the Umami instance with the service account and queried the website's stats, metrics, events and sessions for the previous two hours (2026-11-20). The values below are copied from those responses.

## Observed values

| Metric | Umami result | Observed in test | Visible in Pyxis dashboard |
|---|---|---|---|
| Page views | 7 (`/` 2, `/about` 2, `/pricing` 1, `/wallet` 2, from the events list) | Yes | **Not checked** |
| Unique visitors | 1 | Yes | Not checked |
| Visits (sessions) | 1; 7 views | Yes | Not checked |
| Session duration | `totaltime` 16 seconds for the 1 visit | Yes | Not checked |
| Bounce rate | 0 bounces of 1 visit | Yes (a single multi-page visit) | Not checked |
| Referrers | none (direct visit) | Empty result; **not tested** with a referring site | Not checked |
| Country | `NG` 1 (region NG-RI, city Port Harcourt) | Yes | Not checked |
| Device | `laptop` 1 | Yes | Not checked |
| Browser | `edge-chromium` 1 | Yes | Not checked |
| OS | `Windows 10` 1 | Yes | Not checked |
| Custom events | `demo_cta_click` 10 | Yes | Not checked; the Pyxis reader does not request events |

Per-page counts by event time: `/` 05:37:30 and 05:37:35, `/about` 05:37:32 and 05:37:35, `/pricing` 05:37:33, `/wallet` 05:37:34 and 05:37:46 (7 page views). The metrics `type=url` query returned one view per path, so Umami's URL metric must not be summed against the event list without care; the events list is the source used here.

## Privacy observations
- Umami stores country, region, city, browser, OS and screen size per session. City and region were stored for this session. Whether the IP address itself is stored was **not verified**; Umami documents that it does not store it, and this was not tested.
- The tracker request bodies were **not inspected** in browser developer tools. The claim "no signatures, keys or form values are sent" is **not demonstrated** here. The custom event sent only a fixed name and a `location` string.
- No GDPR statement is made. Using Umami is not a compliance claim.

## Not verified
- The Pyxis web dashboard figures against these numbers (needs a signed-in session and a capture).
- A referrer, a campaign or a returning visitor.
- Any value from a user other than the team.
