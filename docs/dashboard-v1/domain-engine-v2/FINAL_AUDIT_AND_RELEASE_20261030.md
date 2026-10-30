# Domain Engine final audit and production release — 30 October 2026

The owner authorized the final audit, repairs and production deployment. This supersedes the deployment reservation in the previous preparation report. The safe initial release keeps admission flags off; deployment does not authorize a purchase, charge, renewal, transfer or production DNS write.

## Audit scope and fixes

Reviewed client/server boundaries, same-origin protection, real owner identity and impersonation denial, organization/website/account bindings, request limits, encrypted registrant/provider tokens, row permissions and privileged RPCs, atomic purchase/DNS claims, registrar receipt/owner matching, exact Stripe authorization/capture/cancel/refund reconciliation, signed webhook deduplication, lifecycle and expiry workers, deployment targets/public verification, retirement/retention safeguards and default-off rollout configuration.

The audit found and repaired:

- Published dependency advisories: Next and eslint-config-next are now 16.4.3, Zod 4.6.7, Resend 6.35.0, Vitest 4.1.12 and Vite 7.3.7, with patched transitive qs. Existing native sharp/librsvg security checks remain. CI now rejects moderate or higher dependency advisories.
- Preserved existing editor/navigation behavior during the security upgrade: object defaults still run inner validation/defaults via Zod prefault, record schemas use explicit key/value types, and collection limits use JSON Schema rather than removed private Zod 3 fields. Resend uses its current replyTo field. Existing preview/content/history regression tests cover this compatibility.
- A failed read-only availability/price lookup after the single-flight claim now records definitive non-submission and releases the card authorization. A failed or uncertain billable submission still pauses for read-only/manual reconciliation, without re-registration or refund.
- Expired encrypted DNS credentials are cleaned up by the authenticated cron even when Cloudflare/new domain admission is disabled.
- The legacy existing-domain request now uses a bounded stream before parsing, consistent with the live routes.

Key paths: `lib/vigil/domain-engine/{orchestrator,live-policy,live-providers,live-runtime,store,stripe-payments,namecom-core,managed-connection,external-dns,secrets}.ts`, `app/api/domain-engine/`, `app/api/webhooks/{domain-stripe-live,namecom-live}/`, `app/api/jobs/run/route.ts`, and the fourteen migrations listed in `evidence/release-migrations-20261029.json`.

## Release verification

The final source passed 168 test files / 2,952 tests, TypeScript, full lint, the four installed dependency compatibility/security assertions, a production webpack build and all local migration/RLS assertions. A separate clean npm ci reproduced the lockfile; npm audit reports zero known vulnerabilities including development packages. All fourteen reviewed production migration hashes matched the manifest, the migrations were applied successfully, and a subsequent CLI dry run reports no pending migrations. Types were regenerated from the linked production schemas and pass TypeScript. Hosted CI/deployment and production smoke results are recorded in the release evidence. A green dependency audit is a known-advisory check, not a guarantee that no vulnerability can exist.

Fresh private schema and application-data backups were taken before the release. They cover public/vigil application schemas, not a full auth/storage project restore. Migration rollback must retain additive evidence tables and encryption keys; do not use the historical destructive rollback script.

## Client activation limits

The production registrar currently has no prepaid credit. Checkout fails closed rather than requesting card funding or registering on credit. The release installs no spending/DNS approval policy. Name/Stripe notification destinations remain staged while their handlers are disabled. Existing website/hosting billing and deployment workflows remain in service.

A genuine client activation still needs funded registrar credit, accurate client contact consent, reviewed terms and customer/supplier tax inputs, an exact expiring website policy, enabled notification delivery and genuine live acceptance of registrant email, the approved deployment, public DNS and HTTPS. No fake-customer live Stripe charge is acceptable as a test. Ordinary one-year non-premium .com registrations only; $20 registrar/$30 checkout ceilings and the $5 one-time service fee remain the approved recommendation.

Manual renewal, registrar contact correction and transfer/release require staff review and separate spending/transfer authorization. Stripe disputes are handled through Stripe's existing operator notification/dashboard process; this release does not automate dispute submission or revoke a customer's domain after a payment dispute/refund. Evidence erasure remains a reviewed operator process. The later UI/UX session should use CLIENT_UI_HANDOFF.md and preserve the current consent, pricing, state and authorization contract.
