# Task 02 verification and release record

## Verified before publication

- Read original request, master plan, dashboard handoff/architecture/log, current published source, Scar's separate repository and existing preview-only contact adapter.
- Reconciled all 32 pre-existing migration versions against production through authenticated Supabase CLI migration fetch; SQL matches ignoring comments/whitespace. No previous migrations repaired/replayed.
- Additive contact migrations 0032 and 0033 validated on fresh local PostgreSQL 14 with the repository auth/storage shim, original RLS assertions and new contact assertions. Applied to the existing linked production project using checked dry runs; generated database types from that actual public/vigil schema.
- New SQL assertions verify tenant list/search/known-ID reads and writes, immutable captured contact/message/metadata, timeline/recipient isolation, internal notes/status/read state, origin restrictions, service-only ingestion, provider acknowledgement idempotency, paused/disabled sites, per-site quotas and child-row identity.
- Two simultaneous SQL transactions against a disposable database returned the same submission: exactly 1 lead, 1 received event, 1 notification row and 1 leased-queue job.
- Focused unit suite: 40 tests for strict payload/recipient/tenant rejection, registered origin, mandatory CAPTCHA hostname/action, fail-closed provider/limiter errors, bounded streamed payload, client no-token rejection, immutable notification retries, provider deduplication expiry, tenant job binding and engine/legacy export behavior.
- Initial full suite: 90 files / 2135 tests passed. Final candidate adds one export-binding regression (2136 total); one run hit the existing 5-second render-all component test timeout under concurrent browser load. Unchanged isolated rendering test passed (13 tests), and the final full rerun passed 90 files / 2136 tests after closing the animated local preview; threshold/assertions are unchanged.
- Production build, generated-type check, lint, dependency-security regressions and npm audit completed. Native guard prints sharp 0.35.5, librsvg 2.63.2, libvips 8.18.7 and successful benign SVG decode. Audit: 0 vulnerabilities.
- Scar Vite build passed. Browser checks at mobile 390px and desktop 1440px verified required fields, unchanged stationery design, input preservation, preview receipt explicitly saying nothing sent, and no mobile horizontal overflow (390px content / 390px viewport).

## First-site activation state

Scar's existing website/organization were found in production. Website is still `building` and has only a ready `preview` deployment. Registered its existing public client email destination, disabled with zero allowed origins; no lifecycle/customer approval state changed. No real lead test, customer mail, booking, payment, provider job batch or appointment webhook was executed.

Vercel project environment search shows no Turnstile variables. Production activation needs a real widget and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / server-only `TURNSTILE_SECRET_KEY`, then reviewed website launch and verified production origin registration. A test destination must be explicitly authorized before a real notification test. Until these steps, shipped code remains fail-closed and Scar clearly offers her existing email fallback. Booking URL remains optional; none supplied.

## Release evidence

Source commits, deployment status/URLs, hosted CI and live health checks are recorded after publication. Distinguish deployed implementation from active, end-to-end first-site delivery. Do not describe the task's activation acceptance as complete while the external setup remains pending.
