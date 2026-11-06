# Optional Google Calendar copies — review and activation

## Product behavior

Bookings is a premium sidebar destination with a crown. Below Care, customers briefly see an inert, fictional calendar illustration before the shared blurred upgrade wall. Care+ customers without native scheduling see an included setup offer; Requests access opens a prefilled request for their website. No request is submitted automatically, and no site is activated by entitlement alone.

Each actual business owner/manager may optionally connect their own Google account for one website. Vigil creates a separate `Vigil · <website>` calendar owned by that Google user. Appointment creation, rescheduling, cancellation, attendance and unavailable-time changes flow outward from the native booking source. Requests are tentative/transparent; confirmed appointments and blocked time are busy. Google edits and other Google calendar busy time are not imported into Vigil. No customer attendees, invitations, email addresses, phone numbers, private appointment notes or default Google reminders are added.

## Google setup decision

Use a **dedicated Web OAuth client**, separate from Gmail reply credentials and from future Google sign-in. Request `openid`, `email` and `https://www.googleapis.com/auth/calendar.app.created`. This scope permits creating secondary calendars and managing their events; no broad calendar, free/busy, Gmail or contacts scope is requested.

Consent brand: **Vigil Studios**, project **vigil-studios**, support/contact **hello@vigilstudios.co**, external audience initially in testing mode. The public data-use disclosure is `/calendar-privacy`. The owner explicitly approved the API Services User Data Policy, Calendar API enablement, dedicated testing/production clients and storage in Vercel server settings. This configuration was completed on 5 November 2026; only `hello@vigilstudios.co` is allowlisted for testing. General customer access still requires completing the public branding/publishing requirements.

Production redirect: `https://www.vigilstudios.co/api/booking-calendar/callback`. Test with a separate client and the exact trusted isolated-preview callback after that deployment exists; do not use wildcard callbacks or expose credentials to unrelated previews. Enable Calendar API in Vigil's approved Google Cloud project, review the consent brand/audience/domain/privacy requirements, and complete Google's publishing/verification requirements as applicable before opening general customer access. Testing-mode consent is not evidence of production readiness.

Server settings: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI`, `VIGIL_GOOGLE_CALENDAR_ENABLED=true`. The flag stays off until setup and live acceptance pass. Client secret is a server setting; refresh tokens are encrypted in Supabase Vault and never stored in Auth metadata or browser-readable rows. Provider ids exist only in `provider_links`.

## Security and consistency

- OAuth PKCE/state binds the current user, organization and website; fresh ownership, Care eligibility, configured booking settings and exact callback host are checked. Staff impersonation cannot connect an administrator's personal calendar to a customer business.
- Private connection/queue tables have no customer/service direct-table grants. Narrow service RPCs gate credential reads and scoped writes. Ordinary members cannot connect; revoked ownership/manager membership removes credentials and queued work.
- The existing minute scheduler drains a bounded queue, with per-connection leases, source-version checks, retries/backoff, stable Google event ids and conditional ETag writes. Concurrent changes are retained for the next sync; failed sync does not affect a reservation.
- Backfill covers upcoming/current appointments and blocks plus reconciliation of prior copies. Historical appointments are not bulk-exported merely by purchasing a plan. No Google calls run from dashboard rendering.
- Disconnect waits for an active short lease, deletes the saved refresh token and pending work, and preserves Google copies and the calendar mapping for reconnect. Google's app permission is not globally revoked, avoiding disruption to other website connections. The user can revoke the application through Google Account controls. Membership removal and hard deletion clean server credentials/mappings.
- Below-Care customers can still disconnect saved access at `/dashboard/settings/calendar`. New connections/resuming copies require Care eligibility. Loss of entitlement stops queue claims; no website booking is enabled automatically.

## Acceptance and rollout

Local unit tests cover access walls without appointment reads, narrow scope/PKCE binding, paid/owner/tenant guards, transparent requests, conditional writes, revocation, worker validation and safe failure states. Disposable database tests cover consent-before-queue, Vault privacy, wrong tenant/role/Basic, competing leases, changes during sync, disconnect/reconnect and membership revocation. Existing appointment conflict tests remain required.

Before production enablement: back up schema/data, validate migration 63 in isolation, regenerate database interfaces without dropping production legacy definitions, pass CI/build and browser checks, then apply the additive schema. Review the prepared Google client/configuration and obtain the required approval before creating credentials or granting Google access. Use an explicitly approved owner and fictional appointments in an isolated business for live creation/update/cancellation, expiry, retry and disconnect checks. Scar's site remains contact-only; do not use it as a booking business.

This adds no separate hosting service or fixed model/GPU subscription. Google quotas, existing hosting/database usage and consent maintenance still apply.

## Primary references

- [Google Calendar scopes](https://developers.google.com/workspace/calendar/api/auth)
- [Calendar ownership and calendar lists](https://developers.google.com/workspace/calendar/api/concepts/events-calendars)
- [Conditional ETag modifications](https://developers.google.com/workspace/calendar/api/guides/version-resources)
- [Event identifiers and fields](https://developers.google.com/workspace/calendar/api/v3/reference/events)

Validation: the full local application run passed 3,372 tests (one skipped), followed by the added Google-quota retry regression in the focused suite (33 booking tests passed). Typecheck, changed-file lint, production build, complete migration/RLS checks and real competing booking/calendar lease transactions passed. Calendar interfaces were regenerated from the disposable migrated database, retaining existing production/legacy definitions. Both full CI runs, Supabase Preview and Vercel Preview passed for the implementation commit.

## Isolated Google acceptance — 5 November 2026

The owner separately approved the actual Google grant for `hello@vigilstudios.co`. A fictional Care business in the PR's isolated Supabase branch connected through the real dashboard and exact preview callback. Its public booking remained paused outside the fixture transaction; no client website, subscription or booking settings were modified. The preview's existing production URL setting was overridden with its own origin, and server RPC access was explicitly limited to that database/branch. Fresh previews lacked production's legacy table grants; the test database received only the dashboard's required SELECT grants, with RLS retained. No production ACLs were changed.

- Created instant-confirmed and approval-request appointments through the native booking function. The existing scheduler copied both to a separate Google calendar. Google's interface showed confirmed time as Busy, requests as Free, private visibility, no guests or reminders, and no private notes, email addresses or phone numbers.
- Rescheduled through the dashboard from 10:00 to 11:00; Google updated the existing copy without a duplicate. Confirming the approval request updated its title/status. Native cancellation removed its copy.
- Added unavailable time through the dashboard. Google received the unavailable period and resource name, without the private reason. Removing the native block removed its copy.
- Cancelled remaining fictional appointments and removed blocks, drained the queue, then disconnected through the dashboard. Verified disabled/disconnected status, no Vault credential, no queued work after subsequent native changes, and no claimable work. The test calendar is empty; the optional Google grant itself is not globally revoked by disconnect.

OAuth client secrets were saved as sensitive Vercel server settings: production separately from the single `codex/bookings-premium-google` preview branch. Temporary local secret files were removed after verifying the scope metadata. Production sync remains off during the code/schema release and public consent configuration review. No customer has been connected automatically. Expiry, quota/retry, stale-write and reconnect behavior have automated coverage; they were not simulated by interfering with Google's live service.
