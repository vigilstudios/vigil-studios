# US domain tax and retention review — 30 October 2026

## Decision record and limits

The owner confirmed US customers only and approved the domain terms and proposed seven-year transaction/consent retention policy in this chat. These decisions are recorded in `DOMAIN_TERMS_DRAFT_20261030.md` (approved text, publication pending). No additional approval of those same business decisions is needed.

This is researched implementation guidance, not a licensed accountant's attestation, state tax ruling or confirmation of Vigil's governmental registrations. No tax collection setting, exemption, registration, payment, purchase, DNS operation or live website policy was changed during this research.

## Findings supported by current sources

1. Stripe account readback during the preceding review showed a US/New York business, active Stripe Tax, one recorded New York state sales-tax registration and account default `txcd_10000000`. A registration recorded in Stripe does not independently establish the actual state Certificate of Authority or complete other-state obligations.
2. This review queried the authoritative live Stripe Tax Codes API read-only. It returned **682 active codes**. No code name/description explicitly identifies standalone domain registration. Stripe also documents these codes in its [product tax-code catalog](https://docs.stripe.com/tax/tax-codes).
3. The account-wide default `txcd_10000000` is General — Electronically Supplied Services. Stripe's [US digital-product guidance](https://docs.stripe.com/tax/digital-products) advises against using that broad category for US sales because the product distinctions affect taxability. Do not change the existing website/hosting account default as a side effect of domain work; assign reviewed domain-specific mappings.
4. Candidate codes are listed below solely for provider/advisor review. The absence of a dedicated code does not establish exemption. Stripe's calculator still needs a defensible product mapping.
5. A blanket zero-tax rule for all US domain registrations is unsupported. For example, the [Washington Department of Revenue](https://dor.wa.gov/forms-publications/publications-subject/tax-topics/domain-name-registration-services) describes domain registration as generally taxable digital automated services. That does not by itself establish that Vigil must collect Washington tax; the seller's actual obligations must be determined separately.
6. Itemizing the $5 fee improves transparency but does not independently establish an exemption. The fee is required for this Vigil purchasing service, not presently an optional separately purchasable service. New York's [taxable-receipt guidance](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/taxable_receipt.htm) explains that the treatment of packaged charges depends on the underlying sales and separate-purchase conditions. Do not assume only the $5 fee is taxable, or that only the registrar cost is taxable, without a reviewed basis.
7. Stripe [registration guidance](https://docs.stripe.com/tax/registering) distinguishes actual tax-authority registration from recording registrations for calculation. Its [threshold monitoring](https://docs.stripe.com/tax/monitoring) can surface potential economic-nexus issues; it does not cover all possible sales channels or replace a review of physical presence and actual obligations. A zero calculation because no registration is configured is not a determination that a sale is legally exempt.
8. Name.com's cost to Vigil is a separate supplier transaction. Do not infer zero supplier tax from the retail/customer tax result or treat the pass-through cost as automatically outside the taxable retail amount. Current registrar transport only admits its reviewed zero-additional-supplier-tax case; broader supplier tax handling remains engineering work.

## Verified Stripe catalog candidates, not final classifications

| Exact supported code | Catalog category | Relevance / limitation |
| --- | --- | --- |
| `txcd_20030000` | General - Services | Documented fallback when no specific category fits. Provider/advisor must confirm suitability for standalone registration and the required associated fee. |
| `txcd_10701100` | Website Hosting | Describes making a website accessible online. Does not explicitly classify standalone domain registration; do not relabel the domain as hosting merely to select a code. |
| `txcd_20060017` | Technical Support Services | Description specifies labor-only installing/configuring/debugging hardware, networks or software. Minimal-human automated registration is not established as matching that description. |
| `txcd_10000000` | General - Electronically Supplied Services | Existing account default; broad digital treatment is explicitly cautioned against for US sales. Not a verified domain classification. |
| `txcd_00000000` | Nontaxable | Forces no tax even in taxing jurisdictions. Do not use as a convenience or unreviewed default. |

## Precise external classification question (prepared, not sent)

Vigil is a New York website agency launching for US customers. We register an ordinary non-premium `.com` for one year through Name.com in our reseller/agency account. The end customer is the registrant and retains domain ownership. The customer pays Vigil the registrar registration cost plus a mandatory, separately displayed $5 one-time fee for automated registration and technical setup. Hosting is a separate subscription. Registration/setup is primarily automated and includes customer authorization, registrant email verification and separately approved DNS changes. We do not offer the registration without the $5 fee through this flow.

Please confirm:

- Which exact supported Stripe Tax product code maps to this standalone domain-registration offering?
- Should the mandatory $5 associated fee use the same classification/tax base, or a separately supported classification? What changes if the fee becomes genuinely optional and independently purchasable?
- For New York sales, what is the applicable taxability and authority for registration plus this required fee? How should the classification reflect state-specific differences for other US customers where Vigil has a collection obligation?
- Does Name.com charge supplier sales/use tax on this reseller account's purchases, and is valid resale/exemption documentation needed where applicable? Do not assume an exemption certificate can be used in every state or for every service.

Stripe Tax support can confirm its supported category mapping and calculation behavior. A qualified US sales-tax advisor or the relevant tax authority can provide the unresolved legal taxability/registration determination. This brief is prepared; no message was sent and no authority to represent Vigil before a tax agency is claimed.

## Approved retention policy and verified requirements

- **Vigil business policy:** retain transaction and consent evidence for seven years, with longer retention where an applicable obligation, active ownership need, dispute, audit or legal hold requires it. Preserve Name.com receipts, customer invoices, Stripe references, line-item/tax breakdown, address/jurisdiction evidence, terms acceptance and reconciliation history. Keep contact information necessary to manage an active domain, then minimize operational copies where possible.
- **New York source:** [Tax Bulletin ST-770](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/record-keeping_requirements_for_sales_tax_vendors.htm) requires detailed sales/purchase records for at least three years from the relevant return due date or filing date, whichever is later; pending proceedings can extend retention. Retain auditable, readable transaction-level evidence rather than totals alone.
- **Federal source:** [IRS record-retention guidance](https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records) generally describes a three-year income-tax period with six-year, seven-year and indefinite exceptions. Seven years is Vigil's approved policy, not an all-purpose legal maximum. Do not delete evidence merely because seven years since payment elapsed if another obligation still applies.
- **Credential distinction:** the seven-year policy does not justify storing card numbers or retaining temporary DNS tokens. Existing short-lived encrypted DNS-token cleanup remains in effect.
- **Implementation status:** a policy field records a duration today; automatic evidence deletion/redaction is not implemented. Final enforcement must preserve active ownership evidence and holds, use the correct retention anchors, handle backups/exports and audit deletions. Do not publish a promise of automatic erasure until it works.

## What information still cannot be inferred from current account settings

The owner need not provide customers' tax returns, SSNs, EINs or addresses in chat. The unresolved factual checks are whether the recorded New York registration reflects an actual current state registration, and whether Vigil has employees/offices or sales outside the available Stripe history that affect other-state obligations. A US-only customer launch does not mean New York-only tax rules.

The remaining technical work is automatic address-based tax quoting with the reviewed classification, consistent tax recording/reversal after confirmed payment/refund, the US-only admission restriction, publication of approved versioned terms and enforcement of the approved retention policy. Those are implementation tasks, not customer-by-customer tax approvals for the owner.
