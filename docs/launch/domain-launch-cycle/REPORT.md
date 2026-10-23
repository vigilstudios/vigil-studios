# First-launch content and domain completion — 2026-10-22

Base: production `c68647f`; isolated branch `codex/domain-launch-cycle`. The shared dirty checkout and Scar’s local promo preview are untouched.

## Confirmed production failure

Scar’s public DNS ownership/routing records and SSL are correct. `www.thescarlenedit.com` reaches source `ceb9411`, but its SSR homepage returns 503 because ordinary Content and Blog delivery return 404 until `websites.status=live`. Published-review delivery returns 200. Domain verification requires a successful homepage before setting connected, and final launch requires connected domains: this creates a circular dependency.

A second completion problem exists in customer/manual verification: the currently queued job has an empty payload. It can verify a domain but previously could not finalize launch without `payload.deployment_id`. An older deployment-bound verifier also exhausted its retry budget while waiting.

## Correction

- Added read-only published-delivery readiness for first launch. Ordinary content, published media, runtime pages and Blog can load while Building only after existing database review eligibility, current customer approvals, an exact ready production deployment, exported design/source alignment, provider project/deployment association, valid ownership/routing DNS and SSL all pass. No homepage check is performed by this content-readiness gate, breaking the cycle.
- Published snapshots remain the only delivery source. Draft, trash, tenant, scope, hosting and paused/suspended/archived restrictions remain. Review and live delivery retain their normal fast path. No lifecycle flag is changed merely to make a check pass; there is no schema or approval change.
- Domain verification returns the exact production deployment it verified. Manual and stale jobs use that identity to finalize launch through the existing service after the real HTTPS homepage succeeds and every active domain is connected.
- Expected domain waiting keeps its retry budget; actual provider/application failures retain their failure limit. Existing contact provisioning follows the real Live transition.

## Validation and rollout

Regressions cover the complete Building → published-content readiness → working HTTPS → Connected → Live chain; failure cases retain Building. Tests also cover missing/stale approvals, mismatched source/build/provider/tenant, preview-only deployments, DNS/ownership/SSL failure, inactive lifecycle/scope, manual and stale jobs, expected waiting, real failure exhaustion and published-only media/content behavior. The full suite passes: 128 files / 2,518 tests. Type checking, focused lint and the optimized production build pass. Production verification is recorded in the release response after completion.

Deploy shared Vigil main, then retry only Scar’s existing domain verification job. Verify public homepage/pages and media, matching source, domain/site lifecycle, canonical redirect and contact automation. Do not change customer DNS or approvals, create leads, or manually send messages. Scar’s site source and intended motion/design remain unchanged.
