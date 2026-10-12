# Contact provisioning automation — authorized extension of Task 02

Founder approved adding Turnstile to the existing automation process on 11 October 2026. Production base: 2317177. Worktree: /tmp/vigil-contact-automation-release. Preserve earlier contact evidence and unrelated original checkout work.

## Flow

1. Existing deployment/customer-review/DNS gates promote a website to live. Database lifecycle hooks enqueue one durable `website.contact.configure` job; connected-domain changes enqueue a new revision and immediately restrict stale origins.
2. Derive website/organization and origins exclusively from operated website + connected verified domain records. Reuse configured client destination, or default to an active owner's verified Auth email. Missing owner/destination pauses contact setup visibly.
3. Acquire a website provisioning lease. A deterministic widget name is scoped to the Supabase project and website. Recover existing widgets after uncertain provider creation; never create another widget while creation is uncertain. Ambiguous duplicate names require review.
4. Cloudflare account token manages one widget per website, reusing it on domain updates. Enforce provider limits; no paid upgrades or wildcard/all-hostname authorization. Managed mode, no pre-clearance.
5. Keep provider sitekey only in provider_links. Store generated secret encrypted in existing Supabase Vault; private reference table and service-only RPCs. Never put secrets in metadata, job payloads/results, client responses, logs, fixtures or screenshots. No extra encryption-key setup.
6. Atomically persist credential/reference and activate contact only if the current verified registry still matches the provisioned origins and automatic mode is enabled. Staff can pause/retry; owner preferences preserve staff pause decisions. Public endpoint dynamically selects each website's credentials; existing browser SDK/Scar requires no per-client key redeploy.
7. Staff integration page shows automation state and precise missing connection settings. Website clients see status/optional booking and Lead Hub as before. Lab and catalogue previews still simulate only. Customer review/launch approval remains a gate.

## Required one-time connection

Production Vercel `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_TURNSTILE_API_TOKEN` (account-scoped Turnstile Sites Write). Existing Resend configuration remains. Secrets must be entered through Vercel securely, not chat. No widget creation or real notification test until the account connection/test recipient is provided.

## Verification and release

Provider API contract tests including pagination, invalid credentials/quota, secret redaction, duplicate/uncertain creation; lease/race/stale-origin recovery; SQL service-role/Vault isolation and tenant/public grants; launch/domain trigger queue tests; existing deployment tests and contact tests; full type/lint/unit/SQL/security/build. Apply additive migration after dry run, regenerate actual database types, deploy approved source and verify hosted CI/production UI. Ship fail-closed if account is not connected; finish provider acceptance after founder supplies connection.

Rollback: pause automatic contact per website and revert app source. Retain Vault secrets and captured leads; no destructive widget/secret deletion, account permission widening, or customer-launch bypass. Automation should consume only existing provider quotas; quota exhaustion stays actionable and blocked.
