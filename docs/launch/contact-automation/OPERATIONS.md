# Automatic contact setup

This extension supersedes the manual per-widget key setup in the earlier contact-booking handoff. One Cloudflare connection serves the operated websites; each website keeps its own widget and encrypted verification secret.

## Founder connection — once per production account

1. In Cloudflare, select the account that will own Vigil-managed widgets. Copy its Account ID. Scar does not need a purchased domain; an approved production Vercel hostname is valid.
2. Create a custom Cloudflare API token with **Account → Turnstile Sites → Write**, restricted to that specific account. Do not grant DNS, zone, billing or account administration permissions. Keep the token private; do not send it in chat.
3. In the **Vigil Studios** Vercel project (not Scar's project), add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_TURNSTILE_API_TOKEN` to **Production** environment variables. Existing `RESEND_API_KEY`, `EMAIL_FROM`, Supabase service configuration and cron secret remain required. Redeploy the current approved main commit so the server receives the variables. No per-widget global keys or new encryption key are needed.
4. Tell the coordinator that the connection is installed. After redeployment, staff can use **Verify Cloudflare connection** on the contact page to check widget API access without creating a widget or sending email. This checks listing access; actual create/update permission is checked by the approved launch job. Staff can choose **Automatic / retry setup** on the website contact page. The existing minute cron also resumes eligible sites waiting for this connection. Presence of environment settings is not proof of valid permissions; the provider job verifies access.

Provider references: [Cloudflare widget API](https://developers.cloudflare.com/turnstile/get-started/widget-management/api/), [Cloudflare API tokens](https://dash.cloudflare.com/profile/api-tokens), [Supabase Vault](https://supabase.com/docs/guides/database/vault).

## Launch and operation

Website approval and existing deployment/DNS launch checks remain mandatory. Contact automation cannot promote a building website to live. Origins come from connected DNS/TLS verified domains or a matching ready production deployment. A Vercel stable alias requires the matching operated project association. Arbitrary `live_url` values never authorize a hostname.

The database launch/domain/archive hooks disable stale capture and enqueue a revision of `website.contact.configure`. The handler claims a five-minute lease, provisions/reuses a managed Cloudflare widget with no pre-clearance, then stores the secret in Vault and the public sitekey/account association in provider_links. Activation occurs atomically only for the current revision, allowed origins and automatic mode. The HTTP endpoint reads per-site credentials on the server; GET exposes only the public sitekey and optional booking URL. Browser SDK, Scar, Lab and Express bindings use the existing website ID; no client-specific key build is needed.

An approved configured notification destination takes precedence. Otherwise, the first active organization owner's **verified Auth email** supplies the destination. Missing destination is visible as `needs_recipient`. Staff save preferences on the contact page; organization owners/managers can change existing notification/booking preferences in Lead Hub. Preferences do not override a staff pause. Notifications remain durable `lead.notify` jobs with the existing provider idempotency and retry behavior. No automatic visitor replies are added. Booking is an optional scheduler link, not appointment synchronization.

Pause disables submissions. Retry queues a new revision while preserving the existing widget and Vault secret. Provider quota/permission errors remain visible; no paid plan upgrade occurs. Unknown failures use bounded retries, sanitized errors, and the existing staff failure notification path. A disconnected account records `waiting_connection` without sending repeated failure alerts.

## Interrupted creation and account changes

A deterministic name includes the database project and website ID. Before any POST, the database durably records that creation started. A retry lists widgets by name, exact-matches within at most ten pages, and recovers one existing match. No second POST is allowed while prior creation is uncertain. Duplicate exact matches or no visible match after an interrupted create require staff review. The retry button intentionally does not clear this marker. An operator must reconcile the account/widget state first; do not clear it solely because a network request timed out. Changing the owning Cloudflare account also requires review; the job refuses automatic reassignment.

Existing minute cron performs bounded reconciliation before draining jobs. Do not invoke the general production runner as a smoke test: it also executes real order, deployment and email jobs. Use isolated provider fixtures for verification; perform the final live contact test only after the founder authorizes a test recipient. Provider acceptance and inbox delivery must be recorded separately.

## Scar handoff

Website `490498f3-fa5f-4c08-a6d3-4943cb055795` currently awaits website launch approval. Its configured notification destination is retained and optional booking remains unset. Install the account connection first, finish the existing launch gate, then verify its widget/configuration and an authorized inquiry in Lead Hub. No domain purchase is required to use its operated production Vercel hostname.

## Rollback and retention

Pause automatic contact per website before reverting source. Retain captured leads, Vault records and provider associations. Migration is additive; no destructive down migration, widget deletion or account-wide permission change is included. The disposable PostgreSQL Vault shim tests access control and transaction behavior only; production encryption is provided by the installed Supabase Vault extension.
