# Domain Engine UI/UX handoff

The next UI session can restyle the domain experience around the current dashboard. Preserve the backend contracts and consent boundaries below. Deployment to main is a separate owner instruction; check the latest release state rather than assuming this branch is deployed.

## Current integration points

- Dashboard: `app/(vigil)/dashboard/domain/page.tsx` and `DomainOptions.tsx`.
- Onboarding: `app/(vigil)/dashboard/onboarding/page.tsx`, `OnboardingWizard.tsx`, `steps/DomainStep.tsx`.
- Shared client flow: `components/vigil/domain-engine/DomainWorkspace.tsx`.
- Embedded payment: `EmbeddedTestCheckout.tsx`. Despite historical names (`publishableTestKey`), the production caller supplies only its public live key with `live` enabled. Secret keys remain server-only.
- Purchased-domain connection: `ManagedDomainConnection.tsx`.
- Existing Cloudflare connection: `CloudflareDomainConnection.tsx`.
- Operations: `app/(vigil)/admin/domains/engine/`.

Keep existing previews available, existing unsupported-provider guides accurate, and Deploy Preview / Deploy Live approvals intact. Domain registration does not approve publishing a website.

## Client API contracts

All requests are authenticated POSTs, with server-side tenant/owner checks, bounded bodies and rate limits. Error replies are safe customer messages. Do not call registrar, Vercel, Cloudflare or secret Stripe APIs from the browser.

| Route | Actions | Contract source |
| --- | --- | --- |
| `/api/domain-engine/live` | `search`, `quote`, `purchase`, `status`, `resume_checkout`, `reconcile`, `support` | `app/api/domain-engine/live/route.ts`, `live-runtime.ts`, `validation.ts` |
| `/api/domain-engine/live/connection` | `status`, `bind`, `plan`, `apply` | `lib/vigil/domain-engine/connection-api.ts` |
| `/api/domain-engine/cloudflare` | `prepare`, `apply`, `status` | `app/api/domain-engine/cloudflare/route.ts`, `external-dns.ts` |

Use the schemas and response DTOs in these files as the source of truth. Include the required website/order/registration/domain IDs for the chosen action. Purchase responses include an authoritative safe current-order view and null previous-asset fields; replace prior registration/transfer state rather than carrying it into the new order. Discard an initial restore response if a newer interaction has started. Maintain a stable purchase intent across retries and restore the saved order ID. Resume the existing Checkout session instead of creating a replacement after a reload or slow response. Keep its client secret in memory, out of the address bar, logs and persistent browser storage.

`hasLiveWebsitePolicy` controls visibility of the new purchasing surface. Historical policy evidence retains access to saved orders even after new spending is revoked. No frontend toggle can replace that policy. Staff impersonation cannot approve client purchases, payment or DNS consent.

## Required states and disclosures

- Show the exact selected hostname, one-year term, total, separate registration/service fee/tax, renewal estimate and manual-renewal policy before consent. Search/quote is not a reservation.
- Collect actual legal registrant details, contact-transmission consent and versioned service/registrar terms. The organization field determines the registered organization holder when supplied. Never substitute Vigil contacts to remove email-verification friction.
- Prepaid registrar funding failures stop checkout. The client sees an unavailable/help message, not Vigil's account balance. A customer is not asked to fund Vigil's registrar account.
- Stripe first authorizes the exact amount. Registration/owner/receipt confirmation permits capture. A browser completion callback is not payment evidence.
- Keep payment, registration, contact verification, connection and public HTTPS states independent. Distinguish waiting, action required, definitive failure, unknown/reconciliation, capture failure, expired and transferred/released assets.
- An unknown registration never offers “buy again.” A registered-but-unpaid asset is retained and shown for assistance. A refund does not imply domain cancellation.
- A verification email may be required. Name.com sends it; do not promise a fully click-free legal process. The customer never needs a Vercel account.
- Bind the existing website, show the exact DNS plan and obtain explicit plan consent. Preserve mail/security records. The backend verifies actual deployed Vercel recommendations, the approved live build, public DNS and HTTPS before a connected/live claim.
- Cloudflare currently uses a short-lived token for one zone with Zone Read and DNS Edit plus exact plan consent. It is not OAuth. Unsupported DNS hosts keep assistance/guided setup.
- Renewal/release/contact correction actions are support requests; they do not immediately charge, transfer, renew or replace contacts. Automatic paid renewal is off.

## Acceptance for the later UI session

Exercise actual dashboard and onboarding entry points at desktop and mobile widths. Cover first checkout mount, resume, pending registration, verification required, saved/rejected DNS consent, connection progress, errors and final verified website state. Use sandbox/mocks for failure simulation and label them clearly. Do not point a preview's service-role client at the production database to make screenshots work.

The sandbox screenshot gallery is evidence of the provider test flow, not a final visual design or production acceptance. A separately authorized genuine pilot provides final production screenshots; exclude payment secrets, API credentials and private customer details from shareable evidence.
