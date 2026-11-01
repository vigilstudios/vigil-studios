# Exact domain tax closeout questions — 30 October 2026

## 31 October provider response and test follow-up

- **Funding closed:** Name.com production API and authenticated account page both show $100.00 available, verified at 22:08 New York time on 31 October. No additional funding is requested.
- **Stripe replied:** Christine's response, displayed at 11:18 on 31 October in case `sco_VXOz0CMmX84CTf`, confirms no explicit domain-registration PTC and identifies Professional Services (`txcd_20060000`), Website Hosting (`txcd_10701100`) and General — Services (`txcd_20030000`) as candidates. It expressly leaves legal classification to the business/advisor; this is not provider approval of a specific classification. The exact three identifiers and descriptions were independently verified through the Tax Codes API.
- **Actual TEST comparison completed:** twelve standalone Stripe TEST calculations compare each candidate with separate $12.99 registration/$5 fee lines for NY and WA fixture addresses, before and during simulated state registrations. No card payment, invoice, committed tax transaction, domain or production setting was created. Without simulated collection, WA reasons are `not_collecting`. With both simulated state registrations active, each candidate yields NY `product_exempt`/`not_subject_to_tax` and WA `product_exempt`, with zero tax on both lines. Thus none of these outputs establishes the correct mapping for WA's taxable domain-registration DAS case when collection is required. Hosting/professional labels also must not be substituted merely to obtain a desired calculation.
- **Cleanup verified:** both temporary TEST registrations are expired and the exact original active registration set (empty) is restored. Initial immediate cleanup of the second registration was rejected; a targeted later retry succeeded. Full evidence is stored privately in `stripe-test-classification-matrix-20261031.json`.
- **Sent back to Stripe:** the authorized case now contains the actual per-line reasons/results and requests the supported mapping or escalation path. It also corrects the reply's NY $500k/100-transactions reference: that remote-seller threshold must not excuse taxable sales by Vigil, which is physically present in NY. NY nontaxability research remains a separate fact-specific analysis. Case closure by the helpdesk is not tax approval.
- **Name.com inquiry:** ticket #3106706 remains the supplier all-in-price/tax inquiry. Its helpdesk portal requires a separate login; no substantive supplier answer has been verified. The deposit is independently verified and is no longer part of that open question.

The original request text and submission history are retained below. Production purchasing remains disabled; no new external approval, government registration, exemption or unsupported supplier-tax assumption was recorded.

The owner explicitly authorized sending both provider inquiries in this chat on 30 October 2026. Name.com accepted its reseller-support inquiry as **ticket #3106706**. Stripe's official authenticated contact widget confirmed **“Email received”** after the full question was submitted to human support; its displayed email-response estimate was 24 hours. The dashboard lists open Tax case **`sco_VXOz0CMmX84CTf`**, titled **Stripe Tax Code Classification for Domain Registration**. The preceding automated assistant response is not a specialist's determination. Neither provider has supplied the requested confirmation yet. The separate NY authority/advisor question below remains an unsent brief.

No customer contacts, credentials, tax identifiers, balances, payment details or private transaction references are included in these questions. The Name.com form used the existing owner's reply contact and prefilled registrar username to route the authorized inquiry. Funding is confirmed by the owner; the first genuine purchase is deferred until the first client and is not a prerequisite to launch.

## Stripe Tax support — supported product mapping

Subject: Supported US product tax codes for domain registration and required setup fee

Vigil is a New York website agency launching a US-only domain-registration flow. We register an ordinary, non-premium .com for one year through Name.com, with the end customer named as registrant and retaining the domain rights. The customer pays Vigil the registration price plus a mandatory, separately itemized $5 one-time automated registration/setup fee. The fee is not independently purchasable. Website hosting is billed separately; this checkout does not sell software, hosting, digital media, or a premium/aftermarket domain. The initial supported case uses the same US registrant and billing address.

The active product tax-code catalog has no explicit domain-registration category. Please confirm the exact supported Stripe Tax code for (1) registration and (2) its required associated setup fee, including whether both must share the underlying classification. Is General — Services (`txcd_20030000`) the supported fallback for this offering, or is another verified code appropriate? Your US digital-products guidance advises against General — Electronically Supplied Services (`txcd_10000000`); we have not silently applied that or the Nontaxable override.

Please identify relevant state-specific calculation limitations, including Washington's classification of domain registration as digital automated services. We understand that selecting a code does not establish legal registration obligations, and an unregistered jurisdiction returning zero tax does not establish an exemption. We are not asking you to open a government tax registration or change other products.

## Name.com reseller support — supplier tax and price bounds

Subject: US API domain registration supplier tax and all-in price verification

For a New York agency registering ordinary one-year .com domains through the production API for US end-client registrants, how is US sales/use tax assessed on the agency's purchase? Does the agency's account/billing location or the end registrant location control? Does the quoted registration price include any supplier tax and mandatory fees?

Please identify the supported way to obtain the final all-in payable amount before submitting a billable create request, and how the create price limit is applied if tax is additional. We must reject an amount above the approved ceiling before purchase. We have not supplied a resale/exemption certificate and do not claim an exemption. This inquiry does not authorize a registration, funding, renewal, add-on or account-setting change.

## NY tax authority or sales-tax advisor — actual collection obligation

Using the same facts above, determine whether standalone .com registration and its mandatory automated setup fee are taxable under New York law, and whether these sales alone require a Certificate of Authority. Vigil is operated in New York, has no employees/offices outside New York, and has no current NY Certificate of Authority. Do not infer either exemption or a remote-seller safe harbor from these facts. Review other-state economic nexus against actual all-channel sales if needed; no all-channel revenue statement is fabricated here.

Written tax advice or an actual authority determination may resolve this; a formal binding advisory opinion is an available option, not a universal statutory prerequisite to offering domains. A government filing or representation requiring the owner's certification/signature is a separate action.

## Verified basis and limits

- [Stripe authoritative product tax codes](https://docs.stripe.com/tax/tax-codes): General — Services exists as a fallback when no more specific category fits. The catalog does not itself establish this offering's legal classification.
- [Stripe US digital product guidance](https://docs.stripe.com/tax/digital-products): do not select the broad electronically supplied services code for US sales as a convenience.
- [NY TB-ST-175](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/do_i_need_to_register_for_sales_tax.htm): services are generally exempt unless specifically taxable; a Certificate of Authority is required for taxable New York sales. A certificate is not categorically required for every service business.
- [NY TB-ST-740](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/quick_reference_guide_for_taxable_and_exempt_property_and_services.htm): lists taxable services, including some information services and prewritten software. No exact determination for Vigil's offering was found.
- [Washington domain-registration guidance](https://dor.wa.gov/forms-publications/publications-subject/tax-topics/domain-name-registration-services): domain registration is generally a taxable digital automated service. That fact alone does not establish Vigil's collection nexus there.
- [Name.com registration agreement, fees/taxes](https://www.name.com/policies/registration-agreement): fees exclude applicable taxes unless stated otherwise. A general VAT support article does not prove zero US supplier tax.

## Configuration to complete after the answers

Record the supported registration/fee codes and actual review references in a replacement immutable merchant profile. Retain per-address tax calculations and itemization, US scope, approved $20/$30/$5 limits, sufficient-balance checks, and actual owner consent. Record the supplier's supported tax/price behavior. Configure only genuine government registrations where required; leave correctly empty registration lists empty. Then enable purchasing through the controlled profile release. No artificial paid pilot gate is required.
