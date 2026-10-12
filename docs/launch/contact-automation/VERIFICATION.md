# Contact automation verification — 12 October 2026

## Implemented and verified

- Existing shared contact/Lead Hub release base: 2317177. This extension adds durable per-website Cloudflare provisioning after existing launch gates, domain/archive hooks, staff pause/retry and server-selected credentials. Scar's browser integration remains compatible without source changes.
- Full Vitest suite: **91 files, 2,160 tests passed**. Focused contact/provider suite: **64 tests passed** (40 existing contact, 24 new automation). Fixtures exercise API methods, paginated exact lookup, duplicates, uncertain creation, provider error redaction, account changes, stale revisions and public-only configuration responses.
- Typecheck with types regenerated from actual production public/vigil schemas passed. ESLint passed. Production Webpack build passed including image runtime guard and unchanged client SDK/design runtime.
- All 35 migration files applied successfully in disposable PostgreSQL 14. Original RLS, shared contact and new automation SQL assertions passed. New SQL assertions cover verified owner defaults, launch gate, arbitrary hostname rejection, domain revocation, tenant/private/Vault privileges, lease exclusivity, null lease rejection, atomic Vault rollback on cross-site widget collision, stale finish and staff pause preservation.
- Two concurrent independent PostgreSQL transactions: one `claimed:true`, one `claimed:false,status:busy`; only one live lease persisted. No provider call was involved.
- Production preflight: Vault exists, create/update functions exist, anonymous/customer schema usage is false, and there were zero existing managed widget associations. Additive migration **20261012000034_contact_provisioning.sql** applied successfully with no other pending migration or seed replay.
- Four dependency-security regression tests passed; npm audit reports **0 vulnerabilities**. No dependency changes were required.

## Release and live acceptance

The approved app source is released through the existing main-branch GitHub/Vercel flow. Record the exact source commit, hosted CI outcome, production deployment and staff-page check in the canonical handoff before closing implementation. Retain evidence beside this document.

Cloudflare account connection is not installed yet. No real widget was created/updated, no real contact inquiry or email was sent, and no booking was made. Fixtures are not evidence of provider permission or inbox delivery. Scar remains subject to its existing website launch gate; contact is disabled pending that gate and the founder connection.

The local Vault shim tests privileges and atomicity only; it does not implement or verify encryption. Production uses the existing real Supabase Vault extension; no global Vault permission change or extra master key is introduced.
