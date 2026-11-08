# Table-based restaurant reservations

Prepared on `codex/restaurant-reservations` after the booking redesign shipped in PR #50. Migration 66 is validated locally; it has not been applied to production. No client has been enabled for dining reservations.

Release update, November 8: PR #51 shipped migration 66 after fresh private schema/data backups. Production generated types match all 44 booking/reservation/appointment definitions, allowing generator-only metadata notation differences. PR #52 then versioned widget JS/CSS by their content hash; browser review at the existing production restaurant preview confirmed the reservation widget and party-size selector load even after caching the prior script. Production has only the paused fictional booking demo, with component readiness off; Scar has no booking settings and remains contact-only. No restaurant client was activated. Account access is the next phase.

## Customer and business experience

Restaurant guests choose a dining service, party size, date and available time in the same embedded/popup widget. Party size follows through to the confirmation step and private receipt. Requests explicitly do not reserve capacity until confirmed. Table names and identifiers stay private.

Setup includes Tables & dining hours, with directly accessible Tables and Dining hours controls. Each table has a name, minimum party, seating capacity and active state. A dining service selects Automatic table assignment, dining duration, turnaround and instant confirmation or approval. Time off can close one table or all dining tables. The dashboard calendar shows party counts, and appointment details show the confirmed assignment. The website retains contact capture until the existing Care, compatibility, origin, availability review and explicit activation requirements pass.

The first release supports one table per party, up to 100 tables and 30 guests per party. Tables are never combined. Waitlists, deposits, floor-plan editing, classes/group sessions and point-of-sale integrations remain separately scoped. Opening hours are not automatically copied into dining hours.

## Scheduling and evidence

The existing `appointments` store remains authoritative. A table is a typed booking resource with validated capacity. Dining services use a pool of the website's active tables and shared dining hours. The allocator prefers the smallest fitting available table, with deterministic ties. The existing site transaction lock serializes allocation; the database exclusion constraint independently prevents confirmed overlaps. A capacity trigger rejects invalid assignments even outside the normal lifecycle RPC.

Approval rechecks capacity and can choose a different table from a provisional request. Rescheduling preserves the original allocation until the replacement commits. Pausing a table or changing hours never silently cancels an existing reservation; reducing capacity cannot invalidate an upcoming confirmed party. Contact-only sites, fixed-resource appointments and existing guest cancellation after downgrade retain their behavior. API fingerprints preserve compatibility for appointment submissions and bind party size for dining submissions.

Party size is recorded on the appointment, lead evidence and lifecycle receipts; private lifecycle events retain assignment changes. This supports later evidence-based booking/attendance/no-show and booked-cover analytics. It does not assert actual attendance or revenue. No AI action, customer message, Google connection or recurring provider expense is introduced. Optional existing Google copies continue to use the same appointment lifecycle.

## Validation

- 3,385 tests passed, one skipped; production build/typecheck and changed-source lint passed.
- Full migration/RLS suite passed, including tenant/member/anonymous refusal, plan/activation gates, capacity boundaries, smallest-fit allocation, private table data, party-bound retries, turnaround, cancellation/reuse, approval reassignment, failed reschedule preservation and whole-restaurant closures.
- Actual simultaneous PostgreSQL transactions proved that competing parties receive separate tables when available, and only one receives the final fitting table. Existing appointment, approval, reschedule and Google-copy concurrency checks also passed.
- Hosted isolated Supabase acceptance passed for both the existing booking/RLS suite and the new restaurant suite. Each fixture/temporary test grant was inside a rolled-back transaction; no real business settings or production grants changed.
- Browser review verified Tables/Dining hours navigation, unsaved table-name preservation, party-size selection through customer details, fictional submission with no write, and no horizontal overflow at 390 × 844.

Fictional review: `http://127.0.0.1:4194/dashboard/bookings?view=setup&business=restaurant` and `http://127.0.0.1:4194/express-preview/restaurant#reserve`.

Evidence: [tables](evidence/restaurant-tables-20261107.png), [dining hours](evidence/restaurant-dining-hours-20261107.png), [website widget](evidence/restaurant-widget-20261107.png), [phone widget](evidence/restaurant-widget-mobile-20261107.png).

Before production rollout, accept against the hosted isolated preview, back up production schema/data, apply migration 66 and compare generated types. Deploy matching server/browser assets together; preserve existing per-site activation states. Scar remains contact-only. The account-access phase remains recorded in `NEXT_ACCOUNT_ACCESS_20261104.md`.
