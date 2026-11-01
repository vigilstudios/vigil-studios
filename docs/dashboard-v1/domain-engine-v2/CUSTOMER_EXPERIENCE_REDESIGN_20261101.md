# Customer domain setup redesign · 1 November 2026

Local implementation on `codex/domain-setup-redesign`, based on production revision `2348cdf` (PR #39). Production rollout authorized by the owner on 1 November 2026.

## Customer experience

- Start with a plain explanation of a domain and a concrete browser-address example, followed by two described choices. Optional help explains how to recognize a domain you already own.
- Use one purchase stage at a time: address search, legal owner details, final price approval/payment, then registrar email verification. The progress indicator cannot skip steps.
- Separate required owner/address fields into clear sections. State that the optional organization becomes the legal holder, explain the verification email, and disclose address transmission to Stripe before calculating tax.
- Calculate the address-bound final quote before the approval screen. Keep exact hostname, one-year term, registration fee, Vigil fee, tax, total and manual renewal estimate visible before explicit unchecked consents. Mobile places the price breakdown before the approval form in both visual and reading order.
- Restore saved orders before showing new-purchase controls. A failed restore offers recovery rather than another purchase. Interrupted checkout returns to the existing saved order; client secrets remain in memory.
- Give the saved-order screen one next-step message. Payment, registration, owner-email verification and website connection remain separate. Put receipts, renewal/transfer support and secondary settings behind disclosures.
- Finish customer setup after paid registration and registrar email verification. Record explicit future website-connection permission at purchase; keep exact DNS plans server-side and apply them only at the approved admin production deployment boundary. Preserve mail/security records and authoritative DNS/HTTPS/serving-deployment checks.
- Give owned-domain setup a simpler address form, matching manual guide styling and a distinct Cloudflare token option. Do not imply OAuth or ask for a provider password.
- Apply the same domain entry design in onboarding. Resume managed purchases in the managed workspace rather than reopening the manual guide. Restore managed domains by the already-loaded organization/website rows; expose eligible Cloudflare setup through the existing owner/non-impersonation gate. Keep “Do this later” and the completed-brief lock.
- Use dashboard typography, neutral surfaces for ordinary cards/forms/notices, clear icons, responsive spacing and keyboard focus movement. Reserve green gradients for the selected-address price summary and verified connection success; retain orange for attention alerts.

## Validation

- Initial design validation used a clean dependency install with no dependency/schema changes. The subsequent verified-domain handoff adds the migration documented below.
- Full application suite: 173 files, 3,030 tests passed. Subsequent focused verification including two checkout presentation cases: 4 files, 57 tests passed.
- TypeScript, targeted ESLint, production build and whitespace checks passed.
- Real Chrome: dashboard chooser and owned-address form at desktop and 390px phone width; no horizontal overflow. Onboarding route preserves the submitted Express demo lock.
- Isolated in-memory demo: search, owner details, itemized review, initially disabled purchase, consent reset after editing, simulated registration, email verification, approved simulated launch, successful state after reload, and uncertain-registration recovery. Reviewed dark/light themes and phone layout. After a server restart expired the isolated in-memory session, verified a dedicated fresh-fictional-test action restores the demo; live saved orders retain read-only recovery.
- Browser screenshots are local QA artifacts in `/tmp/vigil-domain-redesign-evidence`, using fictional data.

The live Stripe checkout SDK/card flow and real registrar/DNS consent were not submitted in browser QA. No private Stripe, registrar or service-role credentials are configured in this local preview; no live purchase, payment, domain write, DNS write, support request or production brief change was performed. Existing backend unit/integration coverage passed; a real client/provider acceptance remains separate.

Local preview: `http://127.0.0.1:3191/domain-engine-demo`. It is explicitly labeled simulated and is unavailable in production. Actual dashboard entry: `/dashboard/domain?flow=choose`.

## Combined local preview

The active checkout now also includes the previously approved pre-launch Overview and Website Preview redesigns, restored from the earlier design worktree. Both are served alongside this domain work at port 3191. Their integration preserves production domain purchasing, replaces the obsolete external-purchase overview UI, and does not import unrelated onboarding catalog/team schema changes. Integration checks: 84 focused tests, TypeScript, lint, production build and desktop/mobile Chrome review passed.

## Verified domain handoff

The old “Simulate approved Deploy Live” was a mock-only state change, not a real customer publishing action. It now lives under **Demo operator controls**, labeled **Simulate Vigil admin deployment**. The normal customer flow finishes at registrar email verification, with congratulations, once-only confetti (reduced-motion aware), and a clear handoff to Vigil. The final setup step is **Verify email**, not a customer launch action.

New purchase review explicitly includes permission for Vigil to connect this exact domain to this website when Vigil deploys the finished, approved site, preserving email and unrelated DNS records. `authorize_managed_domain_launch` records this separately from website review approvals. Existing purchases are never silently opted in. Customer UI does not offer publishing, design approval or exact DNS plan submission after verification; legacy purchases without the new permission direct the customer to Vigil assistance.

Migration `20261101000057_domain_launch_handoff.sql` delivers a staff inbox alert and a durable `domain.registration.ready.notify` email job atomically, once per paid, active, registrar-verified live registration. Either payment/verification event ordering works. The worker rechecks registrar truth and payment; frozen messages, provider idempotency and lease checks support safe retries. “Vigil has been notified” means the transactional staff inbox handoff exists; it does not claim successful email delivery. Demo notifications are explicitly simulated. No real notifications were sent during local QA.

The existing production deployment service still checks all client/Vigil website approvals. Its preflight refreshes and binds opted-in registrations, refusing incomplete or ineligible purchases. Only after the approved production build is ready does it prepare and apply exact website-only DNS through the existing managed connection service. Interrupted claims are reconciled rather than resubmitted. Public DNS, HTTPS, provider ownership and serving-deployment checks must still pass before the dashboard becomes live. Email verification never creates a production deployment or changes DNS.

**Rollout:** apply the new migration before shipping its dependent application code. Managed DNS remains disabled in existing merchant profiles/policies. A new immutable, staff-reviewed launch profile must explicitly include `dns_approved=true` before new website policies can use automatic launch connection. Existing policies, credentials, spending limits and production feature flags were not changed. Release-profile consent and customer connection consent are both required; purchase permission alone cannot enable DNS writes. Revoking either the saved connection permission or its release blocks the automated plan at the registrar write boundary. Production rollout/configuration has not been performed in this local design task.

Validation: full Vitest suite, targeted deployment/handoff/notification/presentation tests, TypeScript/build checks, local migration/RLS assertions (including once-only inbox/outbox, both event orders, no publish on verification, no implicit legacy consent, wrong-owner refusal and revoked exact-plan permission), and Chrome dark/light/mobile checks. Local preview remains at `http://127.0.0.1:3191/domain-engine-demo` with fictional registrar/payment/DNS only.


## Production release preparation

Owner explicitly authorized the migration, DNS launch configuration and production deployment. The read-only production preflight found 68 applied migrations (through `20261101000056`), one enabled merchant profile, and zero domain orders, registrations, active website policies or pending domain jobs. A private public/vigil schema/data backup was completed before applying migration 57.

Publish new consent terms at `/terms/domains/v2` (`domain-terms-v2-20261101`). Version 1 remains unchanged. The replacement merchant profile must copy the original account scope, provider account, NY-only admission, $20/$30/$5 ceilings, reserve, tax references, manual-renewal policy, retention and validity. Only the reviewed automatic DNS permission, versioned domain terms and new owner approval reference change. Activate the replacement profile after the deployed version exposes the new terms and UI. New purchases still require their own exact quote, registrant consent and saved connection permission; enabling the merchant profile never publishes a client website.
