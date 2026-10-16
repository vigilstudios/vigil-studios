# Vercel connection feasibility receipt — 16 October 2026

Decision: **NO GO for automatic customer DNS connection.** Search and persisted external handoff are an independent partial release. Connect is disabled and makes no provider/job calls. No credential collection, beta access, completed customer authorization, DNS mutation, ownership claim, transfer, registrar purchase, billing operation or successful connection is claimed.

## App registration and account-specific check — 16 October

Registered **Vigil Domain Connect**, slug `vigil-domain-connect`, in the existing
`vigilstudio-projects` team. Public client ID:
`cl_GiSu5jiCuN4CIQlbRkMFDRYmpYc2c3CW`. This is an app definition only, with no
customer installation, resource grant, generated client secret or working
callback. Its unfiltered Permissions page exposes only `openid`, `profile`,
`email` and `offline_access`; Domains and other resource categories are absent.
Only the default required `openid` scope is enabled. Screenshot:
`evidence/domain-center/vercel-app-permissions.jpg`.

This replaces the earlier missing-app assumption with an observed account-level
blocker. The current primary permissions reference still calls resource access
private beta. Context7 returned an `oauth-apps register` example, but the actual
latest Vercel CLI 64.3.1 rejects `oauth-apps` as an unknown command, and the
referenced `/docs/cli/oauth-apps` redirects to the Sign in overview. Registration
was completed through the supported dashboard instead. No CLI example is treated
as proof of resource eligibility.

The original Phase 0 gate still prevents proceeding to a production connection
worker on assumed permissions. [Account-owner next steps and the exact unsent
provider request](./AUTOMATIC_CONNECTION_SETUP.md) identify this app, the minimum
capability needed, the separate authorized fixture, and the implementation that
must follow successful proof. This cannot be resolved by setting a feature flag
or by asking Scar to paste a token.

## Follow-up gate review — 16 October, 14:30 UTC

The initial review was incomplete: private-beta Sign in with Vercel is **not the only documented authorization candidate**. Context7 (library resolution followed by two focused documentation queries) and the current primary [integration API guide](https://vercel.com/docs/integrations/create-integration/vercel-api-integrations) document classic Integration OAuth. An installation returns a one-use code, exchanged server-side at `/v2/oauth/access_token` with the integration client ID/secret and exact redirect URI. Its response identifies the customer team; subsequent customer API requests must include that team ID. Disabled installations reject access, and removal retires the installation ID.

The integration `domain` Read/Write permission includes DNS record APIs, **and also registrar buy/transfer, domain deletion and certificate operations**. Project modification additionally requires `project` Write. That broad provider grant is a candidate for evaluation, not evidence that a DNS-only grant exists. A code-level endpoint allowlist would limit application behavior but would not narrow the provider token's actual authority. The current [Sign in permissions reference](https://vercel.com/docs/sign-in-with-vercel/scopes-and-permissions) still marks resource permissions private beta and separates Domains from Domain Registrar. Confirm exact eligibility and endpoint coverage before choosing either mechanism. Do not request customer Project Write merely to modify Vigil's separately owned project.

The [current domain guide](https://vercel.com/docs/domains/working-with-domains/add-a-domain) documents TXT verification for use in another account's project without moving the domain into that account. This supports the intended architecture on paper; it is not an observed cross-account connection. No fixture challenge, customer DNS write, project verification, revocation or cleanup was executed.

Read-only configuration inspection after refreshing the existing CLI session found no Vercel/OAuth/integration client credential keys configured on the dashboard project. The only matching domain feature key was production `DOMAIN_HANDOFF_ENABLED`. An attempted installation inventory returned HTTP 400 and is **not** evidence that no installations exist. No expressly authorized customer-domain fixture or customer consent token is available to this implementation. The platform credential was used only for configuration reads, never customer DNS.

**Gate remains unproven.** The next concrete dependency is a configured provider-supported customer application/grant with agreed minimum scopes and an explicitly authorized customer-like domain in a separate account. If classic `domain` Write is the minimum supported grant, its extra registrar authority must be resolved explicitly against this workflow's scope; do not silently request it. Prepare configuration and the fixture plan below before any real customer consent or DNS mutation. Existing Connect remains disabled under the original Phase 0 requirement.

### Executable fixture plan once access exists

1. Record the approved app ID, registered callback, exact granted scopes and provider account/team identities. Store app secret and installation credential in server-only encrypted storage; expose only internal bindings. No personal-token paste flow.
2. Start consent from a real customer owner/manager session bound to one organization, website, intent version and normalized hostname. Use single-use expiring state bound to that session and reject staff impersonation, replay, cross-tenant callback and replaced/cancelled intent. Exchange the code server-side; verify the returned installation/team against actual domain ownership and effective permissions before storing the grant.
3. In an explicitly disposable separate customer zone, snapshot registration ownership and DNS, including sentinel MX/TXT and unrelated records. Read the intended Vigil project and current challenge. Use only reversible challenge records before authorized launch; do not point the live hostname at Preview or obtain a challenge by assigning an existing live hostname without first proving assignment has no cutover effect.
4. Prove scoped DNS reads/writes and same-operation retry reconciliation. Revoke the installation and demonstrate rejection on the next worker attempt. Re-authorize as a new grant; stale grant/version/lease workers must remain unable to mutate. Restore only fixture-owned records and project associations and compare the DNS snapshot and unchanged registration ownership.
5. Only after those receipts pass, implement Vault-backed grant bindings, atomic operation/job acceptance, cancellation/revocation CAS guards, narrow conflict-aware DNS planning, guarded production activation tied to the actual approved deployment, expected-site HTTPS checks and a durable completion outbox. Verify delivery retries independently of DNS. A passing mocked adapter test does not satisfy this provider fixture gate.

### Updated provider inquiry — prepared, not sent

Can classic Integration OAuth grant DNS read/write without the registrar buying/transfer/domain-deletion authority currently listed under `domain` Read/Write? Is there a supported domain-scoped grant, or should a third-party DNS-only application use private-beta Sign in Domains Read/Write while excluding Domain Registrar and Billing? Please confirm availability, exact scope strings and endpoint coverage, install/uninstall/expiry/revocation behavior, and the supported cross-account TXT/project association procedure that leaves registration and billing in the customer's team. We need a reversible isolated fixture test and must stage before launch without redirecting an existing live hostname or publishing Preview. No customer Project Write, registrar purchase, renewal, ownership transfer or nameserver change is wanted.

## Refreshed evidence

Context7 resolved Vercel to `/websites/vercel`, then queried resource permissions and the registrar search endpoint. Current primary [permissions documentation](https://vercel.com/docs/sign-in-with-vercel/scopes-and-permissions) still identifies resource API permissions as private beta. Identity scopes do not authorize DNS. Team Domains has read/write access, while project Domain Registrar concerns registration purchasing/transfer; neither a login nor Vigil's hosting token establishes the customer's consent. Registration purchase/billing permissions are unnecessary for the external checkout design.

The [search API](https://vercel.com/docs/rest-api/domains-registrar/get-domain-availability-and-pricing) and [registrar overview](https://vercel.com/docs/domains/registrar-api) document public exact-name discovery, 1–200 candidates, with USD registration/renewal prices. Actual unauthenticated POST with `{"domains":["vigil-evaluation-7f416c29.com","vercel.com","vigil-evaluation-7f416c29.invalid","cars.com"]}` returned the first available for one year, price 11.25, renewalPrice 11.25, premium false; remaining names returned available false and no prices. The endpoint does not distinguish unsupported from unavailable in this response. Vigil searches one registrable exact name per call and labels that distinction honestly. Provider error statuses documented include 400/401/403/429/500; no numerical provider rate ceiling was verified. App-level throttling is separate.

The [working-with-domains guide](https://vercel.com/docs/domains/working-with-domains) and [registration terms](https://vercel.com/legal/domain-name-registration-and-services-terms) were refreshed. A project association alone is not customer DNS authority. No ownership claim or account move is used to circumvent separate customer registration and Vigil hosting scopes.

The actual signed-in Chrome Vercel search page retained the synthetic exact name and displayed $11.25 registration / $11.25 yearly renewal. No cart action, registration or payment occurred. Signed-out and authentication-completion evidence is recorded separately in the browser receipt; earlier planning observations are not promoted to new verification.

## Missing proof and next dependency

Available platform Vercel credentials concern Vigil hosting. No configured customer OAuth app with proven private-beta resource eligibility, explicit customer-like domain fixture authorization, separate customer DNS credential, consent callback, encrypted credential storage integration, revocation fixture or domain-specific grant was established. No customer password or broad token is requested. No DNS mutation was attempted with the platform token. Public DNS observation cannot fill this gap.

Before enabling Connect: establish provider-approved eligibility and exact supported consent/scopes, token lifecycle and revocation; test an expressly authorized customer-owned fixture against a separate Vigil project. Verify team/account identities, narrow DNS changes, cross-team verification without registration ownership transfer, unrelated/email record preservation, current approved-production deployment/expected-site checks, SSL waiting states, cancellation/stale-worker protection and cleanup. Completion event/outbox and deduplicated staff app/email delivery belong to that proven connection slice; this partial release creates neither success events nor connected notifications.

## Provider inquiry — prepared, not sent

Can a third-party Vigil application obtain customer-consented, least-privilege DNS read/write access for a domain registered in the customer's Vercel team, while assigning that hostname to a project in a separate Vigil team and retaining registration, renewals, billing and transfer control in the original customer team? Please confirm eligibility for resource-permission beta, exact Domains permission/API coverage, domain-specific scope options, required team/project permissions, cross-team TXT/project verification procedure that does not claim/transfer registrar ownership, token expiry/refresh/revocation behavior and supported test fixtures. No registrar buying, transfer or Billing permission is wanted. Ordinary identity-only Sign in with Vercel is insufficient.
