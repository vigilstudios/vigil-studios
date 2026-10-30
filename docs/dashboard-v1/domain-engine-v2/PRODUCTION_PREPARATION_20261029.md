# Domain Engine production preparation — 29 October 2026

This is the current handoff. Earlier checkpoint reports describe earlier states.
The owner requested production preparation, **with deployment to main reserved for a later instruction**. No production migration, application deployment, registration, charge, funding, renewal, transfer or DNS write was performed during this preparation.

## Prepared and verified

- Fetched main and confirmed the feature branch starts at `050b49bce2a9d1b3e6c94435184b11f5782c6126`, also the currently serving production commit. The dashboard redesign is retained.
- Authenticated actual production Name.com read-only requests: connectivity, balance, notification inventory and availability. Existing credentials work; no replacement account/token was created. Do not use the production token's human label to infer its environment: the username, fixed origin and successful authenticated requests establish it.
- Authenticated the actual Stripe live account and checked its identity, submitted account details and ability to accept charges. Stripe Tax settings and an active tax registration were retrieved. **This does not determine the correct tax treatment of a customer's domain purchase.**
- Installed twenty domain-specific environment variables on the existing Vercel project, **Production only**. Provider credentials, the new encryption key and webhook signing material are Secret variables. Test/demo approval, search, engine, live registration, Cloudflare and lifecycle worker flags remain off. Existing shared website billing/deployment credentials were retained.
- Created the separate domain Stripe webhook using API version `2025-08-27.basil` and eight supported events; saved its signing secret in Vercel. The endpoint is **disabled**, pending deployment and delivery acceptance. Existing website/hosting webhook destinations were not changed.
- Confirmed the complete production migration history: all 51 existing source migrations are applied, with no unknown production versions. Exactly fourteen domain migrations are pending. The CLI dry run agrees with the saved release manifest.
- Saved fresh private application schema and application data backups for `public` and `vigil`. These are not full auth/storage backups; the provider's managed backup remains relevant to a full project restore. No customer data was imported into the rehearsal database.
- Restored today's actual production application schema locally, applied all fourteen pending migrations, and passed the domain engine/RLS, existing handoff, domain readiness, administrator domain setup and Gmail SQL assertions. The local auth/storage/Vault stand-ins support tests; they do not verify production Vault encryption or email delivery.
- Added prepaid-credit checks before creating live checkout and immediately before a live registration submission. Insufficient/unreadable funds stop checkout. A funding failure proven to precede registration releases authorization; an uncertain billable registration remains paused for reconciliation and never triggers a blind repurchase/refund.
- Added the registrar's organization ownership disclosure to the registrant form. No visual redesign was undertaken.

## Validation

The final source passes 167 test files / 2,949 tests, TypeScript, full lint and a production webpack build using isolated test configuration. The 122 changed source files were stable throughout the build. A scan of 170 browser JavaScript files against ten configured private values found zero matches.

Fresh browser checks also confirmed that embedded Stripe test Checkout mounts on the first attempt without Resume. A second unpaid checkout exposed and verified the fix for prior-order UI state: the purchase response now supplies a safe current-order view and clears the previous registration/transfer state. A late initial workspace restore cannot overwrite a newer interaction. Payment and progress both showed the newly selected domain; neither check entered a card or submitted payment, and both unused Stripe test sessions were expired afterward. Production Checkout still requires the genuine customer acceptance.

The previous actual Name.com sandbox/Stripe test purchase and DNS walkthrough remains documented in `SANDBOX_WALKTHROUGH_20261029.md`. It demonstrated a single registration and exact capture, recovery and preservation of mail records. It does not establish production registrar email delivery, a real deployment, public DNS or HTTPS.

Account-specific evidence and backups are local private artifacts under `$HOME/.local/share/vigil-domain-e2e/`; do not commit credentials, financial account reports or customer backups. The reusable read-only `scripts/domain-engine-production-audit.mjs` accepts its credentials from the environment, contacts fixed provider destinations, reports sanitized checks and makes no mutations. `scripts/domain-engine-preflight.mjs` remains configuration-only.

## Release sequence for the later deployment instruction

1. Re-fetch main. Reconcile any newer dashboard work into this branch, review the complete intended diff and rerun checks for any resulting changes. Do not use the stale dirty shared checkout as the release source.
2. Reconfirm the production migration history and exact manifest in `evidence/release-migrations-20261029.json`. Run `npx supabase@latest db push --dry-run --linked` from the linked feature checkout. Review any additional pending migration; never apply an unreviewed new list automatically.
3. Take a fresh private backup at release time. Apply the fourteen reviewed migrations using the linked Supabase CLI, then regenerate database types for `public` and `vigil`. Preserve all existing data and historical decryption keys. No policy/consent example is an authorization to purchase or change DNS.
4. Deploy the reviewed code with all admission flags still off. Verify login, current dashboard/onboarding, existing domain guides, Deploy Preview, Deploy Live, website/hosting Stripe webhook and authenticated job runner. Test/demo transaction routes must return 404 in production.
5. Configure Name.com contact-verification and expiration notifications to `/api/webhooks/namecom-live` using the supported subscription API. Verify the account's HMAC token selection and exact public URL. **Do not subscribe to `domain.registry.compliance_notice`**: that replaces registrar email with a webhook; Vigil has not undertaken that email responsibility. Do not disable registrar-sent verification/renewal/compliance email.
6. Confirm registrar credit covers the approved spending ceiling. The initial production transport requires prepaid credit and does not add funds or configure a card fallback. The owner completes funding in Name.com; deployment itself needs no purchase.
7. Install the exact restricted website policy through the privileged operator path. It binds organization/website, registrar account hash, expected Stripe account, spending ceilings, service fee, reviewed customer tax jurisdiction/rate, supplier tax assumption, versioned terms, manual renewal, retention, approver/reference and expiry. Keep the approved $20 registrar ceiling, $30 client ceiling and $5 fee unless the owner changes them. An active Stripe Tax registration is not permission to assume zero tax. Use no placeholder address or unreviewed tax rate.
8. Enable only the restricted engine/live/lifecycle settings and Stripe destination after the handler is deployed. An approved website policy remains mandatory; flags alone grant no purchasing or DNS authority. Cloudflare has a separate gate and exact customer token/plan consent. Verify signed vendor delivery and authenticated cron execution; locally signed events are not vendor acceptance.
9. The separately authorized genuine customer purchase completes owner email verification and actual Vercel/public DNS/HTTPS checks. Capture desktop/mobile client screenshots for approval before wider admission. Do not perform fake-customer live Stripe charges or self-charges as tests.

No owner needs to copy API keys into chat. Remaining operator setup is engineering work. Funding, actual customer consent, reviewed business policy inputs and genuine live acceptance remain separate from code preparation.

## Scope of the initial release

Ordinary, non-premium `.com`, one year, manual renewal, a restricted set of approved websites. Name.com stores the explicit customer registrant; Vigil administers its agency account. The customer needs no Vercel login. Registration/payment/connection/contact/HTTPS status remain independent. Transfer and renewal requests reach staff; paid automated renewal, automatic transfers and automated evidence erasure are not implemented.

The published [Name.com agent agreement](https://www.name.com/policies/registration-agreement), [reseller quickstart](https://docs.name.com/guides/quickstart) and [registrant communications guide](https://docs.name.com/guides/registrant-communications) support the selected customer-contact approach. The customer must authorize Vigil to act and accept the applicable agreement. Name.com retains required email delivery; whitelabeling or self-operated verification requires additional provider arrangements. Actual client contact/receipt/email acceptance is still part of the genuine pilot.

## Recovery and rollback

Close new admission/revoke the affected policy while preserving orders, registrant evidence and keys. Keep reconciliation available for pending financial work; turning every engine flag off also pauses workers and needs deliberate staff handling. Reconcile an unknown registration by the original account/order reference, never by buying again. Preserve a registered asset after capture/refund failures. For a changed DNS snapshot, require a fresh plan and client consent; uncertain writes get read-only recovery.

Use an application rollback and retained additive schema for an evidence-bearing database. Do not run the historical `rollback-empty.sql` against production. A destructive SQL rollback is not prepared or authorized.
