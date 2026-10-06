# Package positioning refresh — completion report

6 October 2026 · implemented and verified locally in `vigil-studios`.

## Final definitions

| Package | Definition |
| --- | --- |
| Express | A polished single-page website from a curated Vigil industry design system, customized with the client's brand, content, imagery, services and business information. A streamlined process with one design direction. |
| Professional | A premium multi-page experience composed and art-directed around the client from Vigil's curated design systems. Tailored sections, typography, media, layouts, nested pages/navigation, contextual actions and supported motion; customized composition rather than component invention. |
| Growth-level bespoke work | Original visual direction, components, motion, specialized functionality or advanced integrations beyond the Professional systems, with pages, revisions, price and timeline agreed in writing. The existing catalog name **Custom Build** and key `custom` are preserved; **Vigil Growth** remains the separate recurring plan. |

Express retains one page/one revision. Professional retains up to eight primary pages/two revisions, standard integrations and CMS where appropriate. Legal/simple utility pages do not consume its primary-page allowance; nested primary pages do. No pricing or subscription entitlement was invented or changed.

## Major changes

Professional now emphasizes tailored composition, creative direction, deeper page structure and reliable premium responsive systems. Express emphasizes polished curated design and controlled brand/content customization. Custom now owns bespoke creative work as well as advanced functionality; it is no longer presented solely as complex business software.

Shared package cards, comparison content, five new package FAQs and existing FAQ answers follow these boundaries. The Professional fit guide now asks about original components/unique interaction systems and routes that need to consultation before purchase. It retains the existing fit function, standard checkout route and staff quotation flow.

Checkout shows package scope, relevant page/revision limits, separate recurring requirements and bespoke limitations before purchase, including its assisted-purchase fallback. Portal previews call Express's foundation an industry design; Professional's dashboard identifies its tailored design approach rather than calling a missing template “Custom.”

Recurring feature bullets/badges now follow enabled catalog rows. Shared labels identify Virtue automation, Lead Hub and Insights as in development in marketing, checkout, dashboard overview and billing. Removed unapproved higher messaging/change allowances, “most capable Virtue,” custom-workflow and priority-support promises. Guided Virtue onboarding remains available to all customers. Website analytics are distinct from the recurring Insights product.

Homepage animated notifications and SVG scenes also follow the current model: the third website is Custom, Professional is tailored, and future automation is not illustrated as already operational. Removed unsupported numeric uptime/performance/growth outcomes from those scenes.

## Files and routes

Paths below are repository-relative. Some routes receive changes through shared components/data rather than direct page edits.

| Area | Routes/surfaces | Source changed |
| --- | --- | --- |
| Homepage | `/`, package ladder, hero, process scenes, closing notes | `lib/site-copy.ts`, `components/site/hero/HeroNotes.tsx`, `sections/HowItWorksSection.tsx` |
| Pricing/packages | `/pricing` website/subscription tabs, `/products`, `/products/websites`, `/products/vigil` | `components/site/BuildCards.tsx`, `components/site/PricingTable.tsx`, `app/(site)/products/page.tsx`, `app/(site)/products/vigil/page.tsx`, shared `lib/site-copy.ts` |
| Package detail | `/express`, `/professional`; bespoke detail at `/products/websites#custom` | `app/(site)/express/page.tsx`, `components/express/ExpressCatalogue.tsx`, `app/(site)/professional/page.tsx`, `app/(site)/professional/ProfessionalWalkthrough.tsx`, shared definitions |
| FAQ | Homepage and pricing accordion, including ownership/timing/service answers | `lib/site-copy.ts`; existing `sections/FAQSection.tsx` renders it |
| Creator campaign | `/creators` cards, bespoke fit link and Scar spotlight | `app/(site)/creators/page.tsx`, `lib/creator-campaign.ts`, `docs/campaigns/CREATORS.md` |
| Checkout/onboarding | `/checkout?build=professional`, `/checkout?template=restaurant`, staff token checkout, brand inspiration step | `app/(vigil)/checkout/page.tsx`, `CheckoutForm.tsx`, `[token]/page.tsx`, `app/(vigil)/dashboard/onboarding/steps/BrandStep.tsx`, `lib/vigil/onboarding/virtue-copy.ts` |
| Portal | `/dashboard`, `/dashboard/website`, `/dashboard/billing`, retained legacy portal data | `app/(vigil)/dashboard/page.tsx`, `website/page.tsx`, `billing/page.tsx`, `components/portal/portalData.ts` |
| Service/process | `/products/virtue`, `/process`, `/terms` | `app/(site)/products/virtue/page.tsx`, `VirtueHero.tsx`, `components/process/ProcessRoadmap.tsx`, `app/(site)/terms/page.tsx` |
| Metadata/SEO | Global descriptions/OG/Twitter/JSON-LD via shared description, Express and Professional metadata, manifest | `lib/site.ts`, `app/manifest.ts`, Express/Professional page files; removed unused static `EXPRESS_PRICE` from `lib/constants.ts` |
| Shared configuration | Package definitions, public/checkout catalog descriptions, subscription feature presentation | `lib/vigil/site-tiers.ts`, `lib/vigil/plan-presentation.ts`, `lib/vigil/queries/public-pricing.ts`, `lib/vigil/queries/checkout.ts` |
| Staff/internal | Order preview and generated creative guidance | `app/(vigil)/admin/orders/NewOrderForm.tsx`, `lib/vigil/creative/templates.ts`, `creative/config.ts` (template version 2) |
| Documentation/catalog | Canonical language, historical reference notices, guarded copy migration | `docs/business/PACKAGES.md`, this report, `specs.md`, `EXPRESS-STOREFRONT.md`, `docs/site-redesign/BRIEF.md`, migration `20261006000027_package_positioning.sql` |
| Regression coverage | Bespoke fit routing and database-driven recurring labels/status | `lib/vigil/__tests__/site-tiers.test.ts`, `plan-presentation.test.ts` |

Footer/product menu descriptions inherit shared copy where applicable; footer links themselves remain valid. Success screens, email templates, project review UI, forms, client onboarding strategy, schemas and provider code were audited; their existing factual/workflow copy needed no positioning rewrite. Static Express customer-site examples contain industry-specific client copy and remain unchanged. No separate `/growth` website page exists; the bespoke package's existing detail section remains the entry point.

## Legacy claims removed

- “Up to 8 pages, fully custom to your business” in build cards/shared copy.
- “Up to eight fully custom pages” in homepage/package selection/checkout context.
- “A fully custom website, not a larger template” and “from the ground up” in the Professional purchase guide.
- “Fully custom responsive UI/UX/design” and “custom primary pages” in the canonical scope and terms.
- Global manifest “No templates. No compromises” and blanket custom-coded positioning.
- Creator “custom Professional site” and card promises of a custom website without explaining composition.
- Hero “grown by Virtue,” live automation notifications and unverified performance/growth outcomes.
- SVG Growth-as-website naming alongside Custom-as-catalog naming; “Most capable” recurring-plan claim.
- “Most chosen” Care badge without supporting catalog evidence; now “Website care.”

Final source search found no unintended fully-custom/from-scratch/no-template Professional claims in `app`, `components`, `lib` or `sections`. Historical SQL migrations and engineering/reference history retain their original wording deliberately; a forward migration and current-reference notices supersede it. Internal component design studies are not sales promises and were not rewritten.

## Conflicts and source-of-truth findings

1. **Growth vs Custom naming:** The task describes Growth as the bespoke website tier. The read-only live catalog sells `custom` as Custom Build, while `growth` is Vigil Growth recurring service. Kept existing commercial naming and explicitly documented the conceptual mapping; a product rename remains a separate owner decision.
2. **Recurring plan names:** Current rows are Vigil Basic, Vigil Care, Vigil Growth and Vigil Priority. Basic Hosting/Vigilance Care are not the active catalog names; no independent renaming was performed.
3. **Live catalog stale copy:** Professional's database description still contained “fully custom design.” The new guarded migration corrects known legacy descriptions for all builds, preserves staff-edited descriptions, and changes no names/prices. Application presentation uses canonical descriptions immediately. The migration is validated locally but has **not** been pushed to the hosted database.
4. **Priority entitlements/allowances:** Inspected rows have the same listed boolean customer-feature families for Growth and Priority. Their file allowance differs. Request allowances, support level, Virtue level and Insights depth are unset; this refresh makes no unsupported claim about them.
5. **Eligibility vs availability:** `virtue.enabled`, `leads.enabled` and `insights.enabled` are true for Growth/Priority, but their actual dashboard routes remain coming-soon surfaces. Copy now distinguishes that eligibility from operational availability.
6. **Timing:** Express first-look policy is within two business days of completed onboarding. Previous unconditional “live in one to two business days” wording conflated review with launch. Professional/Custom timelines remain intake/scope dependent.
7. **Prices:** No conflicting active price rows were found. Audited Express $599, Professional $1,499, quoted Custom, and recurring monthly/annual/three-year amounts match approved migrations. The existing automatic 15% eligible build offer is preserved, including exclusions and rounding. Removed a redundant unused $599 code constant and fixed-price SEO wording to prevent drift.

## Canonical sources

`docs/business/PACKAGES.md` is the primary internal language reference. `lib/vigil/site-tiers.ts` is the reusable typed scope and short/long definition source. `lib/site-copy.ts` holds consistent contextual marketing language. Prices/names remain catalog rows; recurring labels/status live in `lib/vigil/plan-presentation.ts` and visibility follows catalog features or resolved organization entitlements.

## Visual and browser QA

Production preview at port 4320, using the real read-only catalog and the existing authenticated test-customer session. Four viewports: **320×568, 390×844, 768×1024, 1440×900**.

Four-size route matrix: `/`, `/pricing`, `/pricing?tab=subscriptions`, `/products`, `/products/websites`, `/products/vigil`, `/products/virtue`, `/express`, `/professional`, `/creators`, `/terms`, `/process`, `/checkout?build=professional`, `/checkout?template=restaurant` — **56 route/viewports**, no page/root overflow, clipped text or stale Professional claims. Titles/descriptions were captured.

Additionally inspected authenticated `/dashboard`, `/dashboard/website`, `/dashboard/billing` on desktop/mobile. Confirmed the industry-design label, rollout-aware feature labels and unset allowances displayed as “To be confirmed.” Verified pricing-card alignment, annual and three-year amounts, FAQ expansion, standard Professional fit result, bespoke qualifier consultation, mobile comparison horizontal access, and separate checkout scope/service disclosures. No payment, booking, onboarding submission or live customer data change was made.

Found/fixed 320px billing toggle overflow by stacking savings badges beneath their period labels; retained font sizes. Website-card description space aligns price rows and bottom CTAs. Mobile card carousels and comparison scrolling remain usable.

Evidence: `evidence/browser-routes.json`, `browser-interactions.json`, `repository-audit.tsv`, and screenshots in the same folder. Desktop pricing, mobile billing controls, Professional fit/checkout, comparison table, FAQs and creator cards were visually inspected.

## Verification and limits

| Check | Result |
| --- | --- |
| Repository audit | 906 text files searched, 588 matching files, 7,041 matching lines; path/count/classification inventory saved without credentials or raw customer contents |
| Tests | 72 files, 1,286 tests passed |
| Typecheck | `npm run typecheck` passed |
| Lint | `npm run lint` passed |
| Production build | `npm run build` passed |
| SQL/migrations/RLS | `npm run db:validate` passed on a temporary local PostgreSQL cluster, including the copy migration |
| Browser/layout | 56 public/purchase-context route/viewports passed, plus interactions and authenticated portal checks |
| Console | No runtime/hydration errors; existing THREE.Clock deprecation warnings observed in the unchanged 3D hero |
| Diff hygiene | `git diff --check` passed |

The local preview has no synced online payment configuration. The existing assisted-purchase fallback was verified with the new pre-payment scope, but a purchasable card form, real staff token order, hosted Stripe product descriptions and paid success path were not exercised in the browser. Existing checkout/Stripe/provisioning tests pass. At release, apply the copy migration through the existing migration process and review hosted Stripe product descriptions; the existing idempotent price sync does not promise to rewrite an already-created product's description. No production deployment/catalog push/provider sync/payment was performed.

Existing unrelated admin/Design Engine work is preserved. Scar's source/assets, pricing logic, promotion logic, auth, schema structure, deployment and checkout architecture are unchanged. No subsequent Design Engine milestone began.

## Production release preflight

The user authorized production release on 6 October 2026. Exported the exact release index to a clean temporary directory, excluding unrelated admin/Design Engine work and local provider environment files. Full lint, standalone typecheck, all **292 tests / 49 files**, optimized production build and migration/RLS validation passed. The earlier 1,286-test result includes local Design Engine work outside this release. Release logs are saved under `evidence/release-*.log`.

Production deploys through the existing `main` → Vercel Git integration. The description-only hosted migration is pending macOS Keychain approval for Supabase; application descriptions already use the canonical model. Existing prices and entitlements were captured before migration for comparison. No live payment was submitted, and local Stripe credentials are unavailable for hosted product-description verification.
