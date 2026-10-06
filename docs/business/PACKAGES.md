# Vigil website packages and recurring services

Current language reference · 6 October 2026. This supersedes historical package positioning in `specs.md`, the site-redesign brief and older implementation logs. Do not use historical claims as current sales promises.

## Authority and naming

- `lib/vigil/site-tiers.ts` is the canonical one-time build scope, short/long definition and Professional fit-routing source.
- `lib/site-copy.ts` provides contextual marketing prose consistent with that scope. Keep page-specific storytelling local where useful.
- `build_prices`, `plans`, `plan_prices` and `plan_features` own commercial names, prices, subscription periods and enabled entitlements. Both public pricing and checkout read those rows. Organization overrides remain part of entitlement resolution.
- `lib/vigil/plan-presentation.ts` supplies shared customer feature labels and current rollout status. Feature visibility comes from database values, not a marketing plan-name lookup.
- The user's Growth website positioning maps to the existing `custom` build kind, publicly named **Custom Build**. No catalog/product rename is authorized by this refresh. **Vigil Growth** is an independent recurring subscription. Do not label the Custom build as a Growth subscription or imply one grants the other.
- Existing orders and bespoke contracts retain their agreed scope. This reference does not retroactively change them.

## Express

**Short:** A polished single-page website, customized around your brand.

**Customer:** A business that needs an excellent site quickly, with a straightforward offer and a clear next action.

**Design:** A curated Vigil industry design system and a proven layout. Vigil applies the client's brand, colours, logo, words, services, imagery and business details. Responsive production quality and basic SEO are included. The controlled design direction makes the process streamlined and less complex.

**Scope:** One page; one consolidated revision round. First look within two business days after completed onboarding. Launch follows client review, approval and domain setup; this is not an unconditional two-day launch promise.

**Capabilities:** Contact and click-to-call/social links, plus booking, maps, reviews and payment links or embeds supported by the selected design. Compatibility matters; do not promise every integration on every design. Only `available` catalog entries can be bought; the dedicated creator design remains `coming`.

**Limits:** No arbitrary multi-page architecture, unrestricted structural customization, bespoke art direction, custom apps/APIs, complex commerce or advanced automation. Public language can say curated industry design, proven layout or professionally designed foundation; explain reuse accurately when asked about templates.

## Professional

**Short:** A premium multi-page website, composed and art-directed for your brand.

**Customer:** An established business or personal brand that needs a premium experience, richer content and a deliberate customer journey across multiple pages.

**Design:** The Vigil Professional Design Engine provides a curated library of mature design systems. Vigil composes and configures these around the client; the customer is not merely choosing a complete template. Tailored composition, typography, art direction, brand colours, client imagery, selected layouts and compatible motion provide substantial flexibility and reliable responsive production.

**Section families:** Navigation, heroes, brand/story, media/portfolio, services/capabilities, product presentation and social proof/results. Mention outcomes and flexibility in marketing; implementation registries, typed capabilities, ASTRA/Sol and Lab names belong in internal engineering documentation.

**Architecture:** Up to eight primary pages with independent compositions, nested pages/navigation, internal links and contextual calls to action. Nesting does not create an unlimited page allowance. Simple legal and utility pages do not count toward the eight; additional primary pages require an agreed quote.

**Capabilities:** Standard third-party booking links/embeds; contact, quote and multi-step forms; simple payments/deposits; maps/reviews; social, chat, CRM forms and marketing integrations; analytics/conversion tracking and SEO foundations; CMS where appropriate. These are build capabilities, not a grant of Vigil Lead Hub, Insights or ongoing Virtue. Website analytics and Vigil Insights are different products.

**Revisions/timing:** Two consolidated revision rounds. Timeline and first look are confirmed after intake; no fixed Professional turnaround is established.

**Boundary:** Customized composition, not new component invention. Do not promise completely original UI, every section invented from zero, no reusable systems, arbitrary unsupported behavior, custom portals/apps, native booking infrastructure, operationally complex ecommerce, custom APIs or complex automation. Original components/design systems/experimental interactions need a separately agreed bespoke scope. The fit guide routes that need to consultation before online purchase.

## Growth-level bespoke work — current product name: Custom Build

**Short:** Bespoke design and advanced functionality, scoped around your ambitions.

**Customer:** A brand or product that needs visual direction, interactions or functionality beyond the existing Professional systems, including an original creative experience without complex business software.

**Design/development:** Invent original design systems, components, specialized functionality, motion and interactions where the project requires them. Advanced commerce, native booking, custom apps/portals, APIs and complex integrations are scoped here. Reuse sound infrastructure and primitives where useful; bespoke is not an obligation to rebuild everything.

**Scope:** Price, pages, integrations, revisions and timeline follow the written agreement. Quoted after consultation; staff-created orders retain their existing checkout path. No unlimited entitlement is implied.

**Scar:** Her standalone creator site is bespoke/Growth-level work. It is not a Professional library implementation and its proprietary creative language is not reusable Professional stock. The marketing showcase explicitly identifies its bespoke nature; source and client assets are unchanged.

## Recurring plans

Every Vigil-hosted website requires an active recurring plan, separately from the one-time build. Basic is the hosting floor. The build does not bundle ongoing service. Cancel at the end of the paid period; exports and ownership follow the service agreement.

The read-only live catalog audit on 6 October 2026 confirmed these names (not the historical aliases Basic Hosting or Vigilance Care):

| Code | Current catalog name | Enabled service features |
| --- | --- | --- |
| `basic` | Vigil Basic | Managed hosting and domain management |
| `care` | Vigil Care | Hosting/domain plus website change requests |
| `growth` | Vigil Growth | Care features; eligible for Lead Hub, Insights and Virtue |
| `priority` | Vigil Priority | Same enabled customer feature families as Growth; different file allowance |

Virtue's guided onboarding is available for every customer. Ongoing Virtue automation, Lead Hub and Insights remain in development, as shown by their dashboard coming-soon routes. An enabled catalog entitlement is eligibility, not proof that a workflow has launched. Keep that status visible in marketing and before checkout.

Request allowances, support levels, Insights depth and Virtue levels have no approved values in the inspected catalog. Do not claim a larger change allowance, higher messaging allowance, custom workflows, priority support or a more capable Virtue solely from the plan name. Existing file-count limits are not website page limits. Ask the team to confirm unspecified allowances before purchase.

Prices remain editable rows. The audit confirmed Express $599 and Professional $1,499 base builds; Custom quoted. Existing automatic 15% creator promotion discounts eligible self-service Express/Professional builds only. Recurring monthly/annual/three-year prices match migration `20260914000010_billing_periods.sql`. No price, promotion, subscription, provider link or entitlement was changed.

## Writing rules

Make the ladder legible: Express = fast curated single page; Professional = tailored premium multi-page composition; Custom = bespoke invention and advanced work. Use “tailored,” “composed,” “art-directed” and “premium design systems” naturally. Avoid both “fully custom from scratch” Professional promises and language that makes Professional sound generic or fixed. Distinguish a design-supported Express embed, a standard Professional integration and bespoke integration development.

Keep short/long definitions and page/revision scope in the canonical model. Reuse those definitions in compact UI and checkout. Changes to business limits require explicit product decisions. Keep recurring status/entitlements separate from website scope and check active catalog rows before changing sales claims.
