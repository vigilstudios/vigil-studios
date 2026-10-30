# Domain purchasing and live acceptance — 30 October 2026

## Approved operating policy

The owner requested purchase-policy setup and completion of the remaining nonfinancial live-acceptance work. Earlier approvals establish the following initial scope:

- USD, ordinary non-premium `.com`, one year per registration.
- Name.com registrar cost at most $20.00; customer checkout total at most $30.00, including applicable tax.
- One-time Vigil service fee of $5.00. This is gross service revenue before Stripe fees, taxes and support costs.
- The customer's real approved details are the registrant; Vigil manages the registrar account as the customer's agent. No separate Vercel account is required.
- Manual renewal; no automatic renewal, paid transfer, premium domain, add-on or automatic funding.
- One purchase reservation per immutable website policy. Each policy binds the organization, website, registrar account and Stripe account.
- Client owner approval of contact details and current terms is required. Staff impersonation cannot consent for the customer.
- Production DNS remains separately approved and additionally requires the customer's exact saved plan consent. Preserve mail/security records.
- Do not retry an unknown billable outcome or automatically refund an asset whose registration is uncertain.

These are operating rules, not an installed live website policy. The database deliberately requires actual jurisdiction/tax, terms, retention and expiry evidence before it will authorize spending.

## Recommended funding (not transferred)

Start with **$100 USD** in Name.com prepaid account credit. At the approved $20 registrar ceiling this funds five maximum-cost registrations, subject to the reviewed supplier tax assumption. Review credit at **$40** and top up manually only after checking pending orders and expected demand. Do not configure an automatic card fallback or automatic top-up.

The $40 threshold is an operator recommendation, **not an implemented automatic alert or balance floor**. Existing code checks available credit before live checkout and again before registration. A balance-change webhook wakes authenticated reconciliation; it does not itself replenish credit or send a low-balance alert.

Credit is Vigil's working capital. Stripe does not directly transfer the customer's checkout funds into Name.com. Vigil fronts registrar credit; customer payment is captured after the matching registration/receipt is confirmed, and Stripe payout availability follows the account's normal settlement schedule. A prepaid balance is not a substitute for per-order ceilings or policy limits.

Source: [Name.com account funding](https://docs.name.com/guides/funding-your-namecom-account).

## Policy package staged privately

`$HOME/.local/share/vigil-domain-e2e/purchase-policy-draft-20261030.json` resolves the existing Onboarding Demo — Growth organization/website, live provider account bindings, approved caps, fee and manual-renewal setting. It is explicitly marked incomplete and is **not inserted into production**. A fake customer's address or tax details cannot establish a genuine customer's policy.

The following facts remain required for the first real policy:

1. Genuine customer/website, chosen supported `.com` and actual registrant jurisdiction (country, state/region, postal code).
2. Reviewed customer tax treatment/rate and confirmation of the supported zero-additional-supplier-tax case. An active Stripe Tax registration alone is insufficient.
3. Approved versioned domain terms, their HTTPS publication URL and evidence-retention duration. The current `/terms` page is dated 15 September 2026; the domain addendum draft in this directory has not been approved or published.
4. Exact policy expiry and approval reference. Recommended first admission is one website/domain for seven days; DNS approval stays false until separately scoped.

No placeholder tax rate, address, legal approval, retention attestation or genuine-customer consent is installed. The actual row must satisfy `vigil.domain_live_policies` and the existing immutable policy/reservation guards. There is no wildcard policy or frontend flag that bypasses these requirements.

## Production setup completed this turn

See the private `LIVE_ACCEPTANCE_20261030.md` report for the final deployment, provider subscription readbacks, signature probes and actual vendor-delivery status. Do not use an older release report's “all flags off” statement to infer the current configuration.

Contact-verification, expiration, lock-change, asynchronous rejection, inventory-removal and balance-change callbacks are informational wakeups. Never subscribe to `domain.registry.compliance_notice` unless Vigil separately undertakes the registrar's email responsibility; the current release leaves those emails with Name.com.

## Remaining live acceptance

Funding requires the owner's explicit amount approval or direct deposit. Vendor-signed delivery must be observed independently of locally signed receiver probes. The genuine client must complete their own registrant consent and email verification. One registration/receipt and exact Stripe capture, preserved mail DNS and the approved Vercel deployment serving publicly over HTTPS are the final customer journey acceptance. Do not self-charge or use fake registrant contacts to manufacture this evidence.
