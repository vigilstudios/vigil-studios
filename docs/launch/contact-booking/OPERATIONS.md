# Contact and booking operations

## Client integration

Use the website record's UUID; never an organization ID or mail recipient from the browser. Staff opens Website → Contact & booking settings, sets the approved client email and verified production origin, and activates after the website is live and providers are ready. Owners/managers can subsequently update the notification email and optional public HTTPS booking link from Lead Hub. Origin registration remains staff-only. Paused/suspended/archived sites and archived organizations cannot capture submissions.

- Vigil Lab/Express catalogue: preview submissions send/store nothing; host forms clearly say preview. Newsletter remains a separate unavailable/draft integration; no marketing subscriptions are created.
- Design Engine live export: `data-vigil-contact` on root binds the runtime to `/api/contact/<website UUID>`. New Express exports use the current compatible schema-v1 runtime and bind inquiry forms at export; original published snapshots/old distributions are retained. Existing deployed customer copies require an explicit republish; no mass redeployment.
- Legacy HTML: new customer exports bind only marked forms or contact/inquiry/booking form IDs through `/integrations/vigil-contact-v1.js`. Use name/email and message/notes fields; provider-specific booking links remain the client's choice.
- Scar's Vite site uses the same public SDK. Registered ID is 490498f3-fa5f-4c08-a6d3-4943cb055795. It preserves preview/no-delivery copy until its current origin is registered and contact configuration is active. Client public destination is scarcollabs@gmail.com; do not send a test to it without authorization. Existing website record is building with only a preview deployment; do not bypass the customer launch gate or invent a production origin.
- Booking V1 is a configured external scheduler link, with a mobile-friendly fallback. No appointment webhook synchronization, automatic AI processing, or implied confirmation.

## Provider setup and release order

Production Vercel requires `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, server-only `TURNSTILE_SECRET_KEY` and existing `RESEND_API_KEY`/`EMAIL_FROM`. Never paste the Turnstile secret into chat, client code, repositories or screenshots. Use a real Turnstile widget authorized for registered client domains, with action `contact`; server verifies exact hostname/action, not success alone. Cloudflare dummy keys are rejected in the production contract. Use separate test configuration in an isolated environment.

No new paid service or quota upgrade is introduced. Default cap: 100 accepted inquiries per site/day (staff-controlled range 1–1000), 12 POST attempts per platform-reported IP/10 minutes, 300 verification requests/site/hour. Every accepted inquiry queues one client notification; no visitor acknowledgements/AI calls. Email usage consumes the existing Resend account quota; actual unit price follows its existing plan, not a new fixed promise. Check remaining account quota before activating additional sites. Database rate-limit failure blocks submissions; customer sees email fallback. Browser origin is a supplementary check; mandatory CAPTCHA and independent quotas remain the abuse boundary.

1. Validate migration and two-tenant RLS on a disposable database; dry-run remote push shows only migrations 0032–0033.
2. Apply additive migrations 0032–0033 without replay/repair of previous history. Regenerate database types from the linked public/vigil schemas.
3. Deploy the approved app/source and Scar adapter. Keep new site settings disabled until real providers and a reviewed, live production website are configured.
4. Authorized owner test: submit one inquiry on the registered site; confirm exactly one lead/event/job, correct owner inbox and email recipient; simulate retry in isolated fixtures. Do not invoke the general live job runner for an ad-hoc test; cron already handles due work and also has other provider jobs.

## Delivery, reliability and recovery

The lead, received event, notification snapshot and `lead.notify` job commit in one transaction. Submission UUID plus canonical content hash deduplicate concurrent/repeated requests; reusing a key for changed content returns conflict. CAPTCHA must be refreshed on retry; the browser retains the idempotency key after uncertainty.

Existing job leases and exponential backoff process up to eight attempts. Recipient is frozen at capture; sender and payload are frozen before the first provider call. Resend's idempotency key `lead-notify/<lead UUID>` stays fixed. Provider acceptance and timeline event commit atomically. `sent` means accepted by Resend, not guaranteed inbox delivery; bounce/webhook tracking is deferred and must not be advertised as implemented. Provider deduplication expires after 24 hours; automatically delayed work older than 23 hours requires review rather than risking a duplicate. Lead Hub exposes queued/sent/failed/review-required status, attempts and safe errors. Permanent job failure uses existing staff alerts.

Staff recovery: inspect Lead Hub and Jobs; verify recipient/provider state. Contact the visitor manually if urgent. Review uncertain provider delivery before requeuing; do not reset first-attempt timestamp to bypass deduplication guard. No public resend endpoint. Pause contact settings to stop new inquiries; saved leads survive delivery failure. Retention follows existing tenant retirement/soft archival; no unsolicited destructive cleanup job.

Rollback: deactivate new contact settings and revert app/Scar commits. Retain additive tables and saved leads; avoid schema drops and unrelated rollbacks. Preserve original worktrees/customer artwork.
