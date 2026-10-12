# Task 02 — shared contact, Lead Hub and booking V1

Authorized by the founder on 11 October 2026, including integration with Vigil Lab, Express and Scar's first site and live deployment of approved updates. One task; preserve designs and unrelated work.

## As-is and ownership

- Production base fb550c0. Work in /tmp/vigil-contact-booking-release; original dashboard checkout has unrelated unpublished work.
- Leads table and tenant RLS exist; dashboard route is a premium-gated placeholder. Basic website inquiries must work for applicable customers; premium Virtue entitlements remain unchanged.
- Design Engine InquiryForm already accepts a FormSubmissionProvider. Published runtime has no adapter. Lab previews must explicitly simulate and never transmit client entries.
- Scar: separate client-scar-lopez React/Vite repository. Existing contact adapter explicitly previews and sends nothing. Preserve its stationery design.
- Express: engine snapshots and legacy HTML exports; bind shared integration at host/export boundary, with safe demo behavior and a reusable bridge for legacy templates.
- Remote migration fetch confirms all 32 current published SQL sources match production ledger (ignoring comments/whitespace). Prior assessment's source gap is no longer present; no repair/replay needed.
- This task owns contact contract, database migration, notification handler, dashboard lead routes, runtime adapters/export binding and Scar contact adapter.

## Implementation sequence

1. Registered website settings; immutable lead events; transactional idempotent submission plus existing durable provisioning job. Tenant resolved exclusively from website registry. Independent SQL/RLS verification with two tenants.
2. Bounded public JSON API: strict schema/body limits, registered live origin, mandatory server Turnstile verification with hostname/action checks, fail-closed distributed IP/site quotas. No user-controlled recipient or organization.
3. Durable notifications through Resend; stable message/idempotency key, bounded retry inside provider deduplication window, visible queued/sent/failed state. Preserve inquiry on mail failure. No autonomous AI/acknowledgement mails.
4. Lead Hub list/search/status/source filters, pagination, detail/activity, notes/read state/status; authorized tenant queries and database protections. Staff configure site integration and owner/manager set notification/booking preferences.
5. Common browser adapter and optional booking link; Lab explicit simulation; engine/Express runtime/export binding and legacy bridge. Scar adapter, anti-bot widget, truthful success/error and privacy copy, optional booking link. No appointment-confirmation claim.
6. Tests: forged org/recipient, invalid/replayed CAPTCHA, body limits, duplicate concurrency/conflict, disabled site/organization, abuse quota outages, notification failure/retry, cross-tenant list/detail/write/events, preview no-network behavior, booking URL validation. Run full type/lint/unit/SQL/security/build and browser desktop/mobile checks.
7. Additive migration first, deploy app from fresh main, configure only verified first-site registration/provider settings, deploy Scar adapter, verify deployment source and public health. Test mail only to explicitly authorized test destination; never send to a real client as a test.

## Acceptance and rollout

Visitor submission saves exactly one inquiry/event/job for the registered organization; its owner sees the inquiry and notification status; a second tenant cannot read/change it. Provider outages never erase inquiries or fake successful delivery. Live activation needs real Turnstile configuration and verified website/recipient; missing settings show a clear email fallback. Booking is optional V1 link, without provider appointment sync.

Rollback: disable per-site contact settings (email fallback), revert code commits; retain additive migration and captured leads. Never drop tenant data or roll back unrelated migrations. Record evidence and remaining external configuration precisely; distinguish deployed code from active end-to-end delivery.
