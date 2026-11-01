# Interim domain purchasing release

Owner instruction: enable purchasing using a Vigil-funded contingency reserve while provider classification/supplier inquiries remain open. Funding ($100) is verified; no paid pilot is required before clients can purchase. No customer tax surcharge, government registration, supplier exemption or vendor approval is invented.

## Merchant decision and scope

Automatic checkout is initially restricted to US/New York billing/registrant addresses, ordinary non-premium .com names, one year and manual renewal. Customer consent, immutable address-bound quotes and current terms remain mandatory. Existing-domain DNS authorization and Deploy Preview / approved Deploy Live are unchanged. Staff impersonation cannot provide financial consent.

Use the supported General - Services fallback `txcd_20030000` explicitly on registration and service-fee lines; leave unrelated products and Stripe account defaults unchanged. Stripe support identified this fallback, but has not approved Vigil's legal classification. The business position for this limited release is NY nontaxable agency domain registration/setup, based on [TSB-A-97(87)S](https://www.tax.ny.gov/pdf/advisory_opinions/sales/a97_87s.pdf) and current [Tax Law §1105](https://www.nysenate.gov/legislation/laws/TAX/1105). The opinion concerns comparable web agency domain charges with no sale of prewritten software; applying it to the separate mandatory $5 administrative setup service is a documented inference. It is not a ruling binding NY to Vigil, a nationwide exemption, or tax advice from Stripe/Name.com. This policy does not classify Vigil's other website/software offerings.

No NY registration is fabricated in Stripe. Other states are refused before calculation/payment, and SQL independently refuses a final quote with a missing/unadmitted state. Expanding the state list requires a replacement reviewed merchant profile. Existing NY address validation and address-digest matching still apply at checkout.

## Reserve and supplier accounting

The private immutable merchant policy specifies the existing $20 registrar ceiling, $30 customer ceiling, $5 service fee, a supplier-tax allowance no larger than that fee, and full service-fee reservation. The server derives each order's supplier ceiling as the lesser of $20 and its exact quoted base plus the allowance. No browser-supplied price or allowance is accepted.

Name.com's current Core API documents an exact base-price match when `purchasePrice` is supplied. It does **not** establish an all-in pre-submission debit cap; unexpected supplier behavior cannot be undone by a post-purchase receipt check. The supported contract is therefore a base-price guard plus bounded receipt reconciliation, not a guarantee that an external vendor cannot over-debit. We do not raise the owner's approved ceiling: an excess/unexplained bill enters reconciliation, never another purchase or an extra customer charge. The outstanding supplier ticket remains useful evidence, not a universal release permission.

Supplier base must equal the saved quote; actual receipt/capture must equal that base plus separately stated nonnegative supplier tax, within both the per-order allowance and merchant ceiling. Paid add-ons, price drift, unexplained totals, refunds, other owners/domains/accounts and extra items remain refused. The original receipt reference survives uncertainty. Available credit must cover the entire approved supplier allowance before submission; no automatic top-up is introduced.

The ledger `vigil.domain_order_financials` stores exact supplier cost/tax separately from customer tax and the original full service-fee reserve. Supplier tax is Vigil's expense; customer authorization/capture does not increase. The ledger and registration are saved atomically. The reserve is pending before capture, held after confirmed payment, and no longer counted as held after a confirmed full refund; its original evidence remains. Duplicate reconciliation cannot duplicate a reserve or replace a receipt. There is no automatic release as profit.

This is an **accounting allocation**, not a Stripe hold, escrow account or bank transfer. Vigil must keep the displayed held amount available in cash; the ledger does not segregate cash, pay tax, file returns or cure a collection obligation. Supplier tax/payment fees can reduce net margin below the reserved gross fee, requiring existing Vigil working capital. Admin → Domains → Engine displays the aggregate and per-order amounts.

## Validation and release procedure

- Full application suite: 171 files / 3,009 tests, plus the added checkout-state regression (focused final run: 3 files / 55 tests). Hosted CI runs the final combined suite.
- TypeScript, lint, production build and all migration/RLS assertion suites, including the new reserve SQL workflow.
- Patched newly reported GHSA-g3hv-75wg-m249 in development lint dependencies using minimatch 11.0.3 behind a narrow CommonJS compatibility adapter. All installed lint consumers are checked; the import-boundary rule retains its test-predicate behavior without regex compilation. Eight dependency security assertions pass; npm audit reports zero vulnerabilities.
- New SQL happy-path coverage exposed and repaired a preexisting ambiguous quote alias and a shared trigger referencing a field absent from registration rows. The test now reaches registration persistence, duplicate reconciliation, capture-state reserve activation and full-refund accounting.
- Production read-only checks: matching live registrar/Stripe accounts, $100 available credit, six registrar subscriptions, enabled separate Stripe webhook, no active tax-registration claims; no purchase/payment/DNS operation.
- Fresh private public/vigil schema/data backup before migration; exact pending migration is `20261101000056_domain_contingency_reserve.sql`.

Apply the reviewed migration with the supported linked Supabase CLI, regenerate public/vigil schema types, require hosted checks, merge against the latest main and verify Vercel's actual production SHA/aliases. Only then revoke the discovery-only merchant profile and install the immutable NY/reserve profile. Record actual outcomes in the private release evidence; this document alone is not proof of deployment or activation.

Rollback: revoke the new merchant profile to stop new checkout/registration admission. Preserve existing receipts/orders and allow the new runtime to reconcile already-submitted purchases and captures. Do not drop retention/financial tables, clear evidence, run a registrar refund, or attempt another registration as rollback. Production DNS still requires its separate exact-plan authorization.
