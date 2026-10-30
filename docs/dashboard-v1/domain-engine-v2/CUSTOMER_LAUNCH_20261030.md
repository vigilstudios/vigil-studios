# Customer domain launch — 30 October 2026

The owner approved a US-only launch, ordinary one-year `.com` registrations, a $20 registrar ceiling, $30 checkout ceiling including tax, a $5 one-time service fee, manual renewals, the versioned domain terms and a seven-year minimum transaction/consent retention policy. Approval does not establish tax classification, a government registration, a supplier tax exemption, prepaid credit or a client's consent.

## Implemented release model

A private immutable merchant launch profile separates read-only discovery from spending. A discovery profile lets existing dashboard/onboarding screens show Name.com availability and prices before tax without sending clients to Vercel. It grants no checkout, registration or DNS authority. Staff impersonation uses this read-only surface.

After a real business tax review and funding acceptance, an operator can replace the discovery profile with an approved purchasing profile, revoking the previous profile. The profile must record the reviewed registration and service-fee tax codes, review references, supplier tax treatment, provider accounts, approved terms, limits and expiry. Do not use a tax-code fixture, generic account default or a guessed zero rate. Creating this profile is a deliberate business release, not a frontend toggle.

The actual customer owner then receives one immutable website-scoped policy automatically. A current unresolved purchase/managed asset prevents a replacement policy. The owner confirms a US registrant address; Stripe Tax calculates explicit registration and service-fee lines. That calculation creates a new immutable quote. Its address digest, account, exact subtotal/tax/total, provider calculation reference and sanitized tax breakdown are saved privately. An address change invalidates displayed consent and requires a new final quote. Preliminary quotes cannot create purchase acceptance. The existing registrar/account, credit, spending, authorization, single-flight registration, receipt reconciliation, capture and unknown-outcome safeguards remain mandatory.

Tax reporting commits a standalone Stripe Tax transaction only after the original Checkout/PaymentIntent/charge proves exact live capture. It uses capture posting time and a stable order reference/idempotency key. A verified full refund creates a separate reporting reversal; this worker never issues a refund or changes ownership. Uncertain submissions older than 23 hours enter manual review before Stripe's idempotency window can expire. No blind reporting resubmission is allowed. The authenticated job runner retries due work; `/admin/domains/engine` shows reporting problems. Stripe's Basil API cannot backdate reversals; cross-period refunds need operator tax-return review. Partial or externally initiated refunds require separate reconciliation; do not mark a full reporting reversal from partial evidence.

## Terms and records

Published terms are `/terms/domains/v1`, linked from the general agreement and the final quote. Future changes require a new version and new acceptance. Clients own the domain through their approved registrant details; Vigil manages it as their agent. Registration and approved website publication remain separate.

Contact payloads stay encrypted and service-only. Quotes, consent and ownership evidence remain immutable; deletion/offboarding cannot cascade through them. Records younger than seven years never enter the retention review queue. Private filing-period reviews can extend the retention floor; explicit audit, dispute, legal, ownership and recordkeeping holds have a permanent history. The operator must verify applicable return due/filing periods, active assets, unresolved billing/transfer states and holds before minimizing records. **No automatic evidence deletion is implemented or promised.** The job runner reports review counts; operators review due records through the controlled service path. Account-wide backup retention and any legal hold also need operator handling.

## Current external acceptance gates

- NY Certificate of Authority is absent, as confirmed by the owner. The inaccurate Stripe NY registration was expired on 30 October; this is not a government filing or exemption determination.
- Obtain the actual domain-registration and mandatory service-fee classification, determine whether NY registration is required, and review other-state economic nexus. Configure only genuine registrations. Zero tax outside configured registrations is not proof of exemption.
- Confirm the supported supplier-tax case with Name.com. Current transport denies unexpected additional supplier tax rather than exceeding consent/cost limits.
- Owner funds Name.com directly or explicitly authorizes an amount. The last verified balance was $0. No automatic credit/card fallback is enabled. $100 working capital and review at $40 remain recommendations, not completed transfers or automated alerts.
- Observe genuine provider-origin webhook delivery separately from locally signed receiver probes.
- Complete a genuine consenting customer registration, verified registrar receipt, exact capture, email verification and separately authorized website DNS/HTTPS acceptance. Sandbox purchases and staff preview are not this acceptance.

Until these are resolved, deploy discovery and engineering safeguards with `purchasing_enabled=false`. Do not describe this as unrestricted live purchasing. Never create fake government/tax approvals, fund an account, charge a card or modify production DNS to manufacture acceptance evidence.
