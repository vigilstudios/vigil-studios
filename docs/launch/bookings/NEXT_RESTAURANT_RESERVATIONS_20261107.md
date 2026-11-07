# Next phase: table-based restaurant reservations

Owner selected the first restaurant release on November 7: party sizes, table capacities, dining duration and automatic assignment. Table combinations, waitlists, floor-plan editing, deposits and point-of-sale integration follow later. Account access is the next phase after restaurant reservations; its accepted requirements are in `NEXT_ACCOUNT_ACCESS_20261104.md`.

## Product flow

An eligible restaurant explicitly enables a dining service after entering its tables, seating capacities and dining hours. Existing appointment services remain available. Each dining service controls duration, turnaround time, notice, booking horizon and instant confirmation versus approval, retaining the already accepted choice per service. The website widget shows party size before date/time selection. Guests choose available times; staff manage the assigned table in Bookings. The guest does not choose an arbitrary table or see invented capacity.

The Bookings workspace keeps Calendar, Requests, History and Setup. Restaurant setup exposes Tables and Dining hours directly, beside dining services, time off, website presentation and optional Calendar copy. Each booking shows party size and the assigned table. The first release uses the existing lifecycle and attendance outcomes rather than promising a live floor plan.

## Scheduling architecture

Extend the existing authoritative appointment store and booking resources; do not create an independent list of reservations behind the website. Tables are explicitly typed resources with minimum/maximum party capacity. Dining services use a table pool rather than a fixed person/space. Existing fixed-resource appointments retain their current behavior and constraints.

The server chooses a fitting active table, preferring the smallest sufficient capacity and a deterministic tie-break. It evaluates dining hours, date exceptions, preparation/turnaround time and confirmed overlaps. The reservation and its assigned table commit together under the existing booking transaction boundary. Guest-supplied table/resource identifiers never authorize assignment. Database constraints independently prevent overlapping confirmed reservations on the same table.

Approval requests do not reserve capacity. Approval rechecks the pool and may select another fitting table. Rescheduling preserves the original confirmed allocation until a replacement is accepted. Party-size changes require the same conflict-safe allocation and revision checks. Guest management credentials remain private fragments. The website component, dashboard, Lead Hub outcomes and optional outbound Google copy use this same reservation record.

## Delivery sequence

1. Add backwards-compatible table/pool/party metadata and validation, with explicit business activation and Care eligibility. Retain tenant-scoped foreign keys, RLS, audit evidence and idempotent writes.
2. Implement availability/allocation and conflict-safe create, approval, cancellation and rescheduling. Test boundary capacities, buffer collisions, competing parties/approvals, inactive tables, timezone transitions, downtime, downgrade and cross-tenant denial.
3. Add Tables/Dining hours setup and party-aware list/calendar details without changing the accepted visual framework. Update the website widget and Restaurant Express sample to real dining-reservation semantics only when the engine is ready.
4. Accept against an isolated fictional restaurant with multiple table capacities, both confirmation modes, full-capacity periods and cancellation/rebooking. Back up before production schema rollout; keep every real client paused until their own setup is reviewed.

## Evidence for Insights and Virtue

Track real requested/confirmed/completed/cancelled/no-show outcomes, party size, booking lead time, unavailable-slot results, lead source and assigned capacity. Distinguish booked covers from actual attendance and revenue. Recommendations can reference those records; predictions require sufficient history and evaluation. No automated outreach, deposits, Google connection or AI action is enabled by restaurant eligibility.
