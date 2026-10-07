# Productionization Pass 007 — Commerce / Product Presentation

Completed 1 October 2026 in `vigil-studios`. Collection 007's fourteen concepts retain their human Approved states and now have independent **Production v1.0.0** registrations. No Collection 007 concept remains Review/Experimental. The original Collection 007 creative studies, assets, interaction examples and all prior approval/revision/rejection states are preserved.

Inventory: **82 registrations / 46 Production implementations**. Composition Lab: **91 internal QA combinations**, including **28 new commerce compositions**. These combinations exercise compatibility, not saved page templates.

## Production inventory

| Source / implementation | Content bounds and merchandising identity | Usage / Product Detail facet |
| --- | --- | --- |
| P01 `commerce.merchant-edit` | 3–5 editorial products; unequal lead/support attention with buying commentary | Section and page capable |
| P02 `commerce.catalog-ledger` | 0–24 returned scan rows; intended authored slice 5–24; category/status/price register, host query extension | Page capable; medium/large catalogs through bounded slices |
| P03 `commerce.object-pedestal` | One flagship, 2–4 specifications; central object and peripheral edition/record | Section; specifications facet |
| P04 `commerce.release-signal` | One launch product, one campaign exposure, authored release statement/label | Section |
| P05 `commerce.collection-atlas` | 3–5 collection/category worlds with counts, destinations and alternating media bands | Page capable; medium/large taxonomy entry |
| P06 `commerce.look-objects` | 1–3 looks, 2–4 product references each, pool of 2–12 products; scene and numbered role legend | Section and page capable |
| P07 `commerce.campaign-interleave` | 2–4 authored campaign chapters with one product colophon per chapter | Page capable; native horizontal editorial progression |
| P08 `commerce.material-anatomy` | One product identity, 3–5 named details/evidence; overview beside inspection | Product Detail building block; storytelling |
| P09 `commerce.origin-receipt` | One product, 3–5 ordered origin stages with evidence and optional captioned media | Section and page capable; provenance/storytelling facet |
| P10 `commerce.inspection-desk` | One product, 2–8 distinct media plates; active viewing well plus labelled contact sheet | Product Detail building block; media |
| P11 `commerce.vertical-product-folio` | One product, 2–6 all-visible, ordered plates; continuous essay and parallel caption rail | Product Detail building block; media |
| P12 `commerce.option-atelier` | One product, 1–3 option groups, 2–8 named values per group, 1–40 supplied variants | Product Detail building block; options |
| P13 `commerce.comparison-bench` | 2–4 comparable products, 3–8 shared criteria keyed by product ID; fixed baseline and selectable candidate | Section and page capable; comparison |
| P14 `commerce.companion-rail` | One anchor, 2–6 distinct companions with authored relationship/reason | Product Detail building block; related discovery |

Each implementation lives in `design-engine/sections/commerce/`; shared price/identity/media/rail primitives do not collapse the fourteen merchandising structures into a universal card/grid/gallery. Registry entries record source concept, intent, catalog scale, finite data/media constraints, usage, Product Detail facets, type/art compatibility, interaction, static motion, readiness, complexity and version.

`promoteCollectionSection` now recognizes the P-family's canonical creative ledger and requires its own current-pass evidence. Entries pass experimental → review → production through the existing gate. Earlier families' approvals/statuses remain authoritative, including S04 pending revision, S05 rejection and M03 revision required.

## Contracts and media

Read [Commerce contract](COMMERCE_CONTRACT.md) for the provider boundary, schemas, narrower contracts, host bindings and loading policy. The new normalized schemas export Product, ProductSummary, ProductIdentity, ProductMedia, ProductPrice/Money, ProductOption, ProductVariant, ProductCollection, ProductCategory, ProductBadge, ProductSpecification and ProductFeature. Strict per-structure schemas reject undeclared provider/inventory fields, invalid sale bases, orphaned look references, duplicate identities, option/variant drift and misaligned comparison criteria.

P06 uses stable product references with roles instead of positional products/role arrays. P13 criteria use keyed values instead of positional columns. P09 accepts an authored media caption; reusable code does not claim that every supplied image is a factory or process photograph. Native typed links navigate to host destinations instead of opening study summaries. No commerce-provider SDK, checkout/cart/transaction logic or routes were added.

Whole-object containment supports campaign/model/packshot/detail images with different ratios without inventing crops. Primary/secondary/alternate/detail roles, explicit plate ordering, separate thumbnails, responsive candidates/mobile sources and alt/dimensions are supported. P10 exposes one active media element; native video is preload-none, user-started, transcript/caption aware and stopped on replacement. 360 remains a named still fallback. Missing/failed sources preserve product information and access.

Lab delivery adds 16 originals × two WebP derivatives: **240px thumbnails 1.7–9.5KB**, **640px candidates 6.4–61.9KB**. Original approved study files remain intact. These optimize preview delivery; client hosts own CDN/image optimization and verified product photography/facts. No image preload or video autoplay is introduced.

## Composition and responsive decisions

Two different compatibility sequences per component mix existing Navigation/Hero, Brand/Story, Work/Campaign, Services/Features, commerce collections and the existing closing content section. No Footer is invented. Commerce is a distinct category in Design and Composition selectors; readable grouped composition demos and the inspector expose intent, catalog scale and Product Detail facets. Site brand/icons remain inherited; section type/art overrides remain contract-limited.

Existing general full-bleed, horizontal-region and dense-neighbor notices cover commerce transitions. Review these seams deliberately: dense catalogs/options/comparisons need breathing room, horizontal rails must stay independent, and full-width campaign fields retain local gutters. All bodies remain in document flow without sticky ownership, overlay safe zones or pair-specific hacks. The tested mixed sequences produced no overflow or blocked capability combinations.

Mobile behavior preserves each mechanism: the editorial lead and smaller shelf; two-line catalog rows; pedestal object/specification strip; wrapped release cells; alternating collection windows; scene/legend/selected look; scene-above-colophon rail; smaller anatomy reference with dominant details; continuous provenance; wrapping contact sheet; caption-first vertical essay; compact reference with wrapping native options; aligned two-product comparison; anchor plus wide companion and a glimpse of the next item. Named controls supplement touch rails; no wheel interception or hover-only behavior.

Production interaction uses native links/buttons/disclosures/radios/selects, selected/pressed states, labelled control regions and polite announcements. Focus stays on the activated control. Options distinguish unavailable versus nonexistent combinations; the latter never shows a false resolved price. Swatches supplement text names. All systems preserve static resting content and immediate native progression under reduced motion; proposed study animations are not advertised as implemented capabilities.

## Verification evidence

| Gate | Result / evidence |
| --- | --- |
| Typecheck | Passed; `evidence/typecheck.log` |
| Full lint | Passed with no diagnostics; `evidence/lint.log` |
| Full tests | 530 tests in 60 files passed; `evidence/tests.log` |
| Production build | Passed with `/admin/lab` and legacy Lab entry routes; `evidence/build.log` |
| Wide/laptop/tablet/mobile layouts | 84 checks: 14 × 1920/1440/1280/768/390/320; `evidence/layout.json` |
| Type/art/brand compatibility | 960 mobile combinations across 10 type profiles, every declared art choice, three industry contexts and three token themes; `evidence/matrix.json` |
| Content/media bounds | 140 checks: minimum/maximum counts, no product media, extreme portrait and landscape sources at 1440/390; `evidence/bounds.json` |
| Mixed compositions | 56 desktop/mobile checks of all 28 new sequences; `evidence/compositions.json` |
| Automated accessibility | 84 WCAG 2 A/AA + 2.1 AA audits across three industries at desktop/mobile; zero violations; `evidence/audits.json` |
| Interaction/host bindings | Keyboard Enter/Space, option arrows, look reset, native filters, unavailable/missing variants, video stop/unmount, rails/reduced motion, controlled host callbacks/pending, failed image fallback and touch targets; `evidence/interactions.json` |
| Lab workflow | All fourteen registered production previews, retained P08 creative artboard, Commerce demo grouping, mobile Composition preview, metadata and compatible section insertion; `evidence/lab-workflow.json` |
| Performance | Standalone per-component bundle probes: approximately **3.5–4.6KB gzip** with React external; `evidence/performance.json`. These are isolated module costs, not the total application bundle. No production imports from previews, schemas shipped solely for runtime UI, new scroll listeners or perpetual animation. |
| Browser console | No unexpected errors in the passing matrix and interaction/Lab checks; `evidence/errors.json`, interaction and workflow files |

The regression suite checks normalized currency exponents, safe destinations, lifecycle evidence, orphan references, aligned criteria, invalid variants, all three industry adaptations, finite count/media extremes and runtime/fixture independence. All registered preview variants and compatible section additions continue to render in the established engine tests.

## Findings and limits

- The original study's catalog price sorting could compare fixed and starting prices as though their basis matched. Production validates the price basis and offers only editorial sorting for mixed-basis preview slices. Host-provided sorting remains independent.
- Original look and comparison arrays could drift when products were reordered; stable references/keyed criteria fix that class of problem.
- Media tone initially did not reach P01's editorial item helper; it now passes through the same treatment contract as other product media.
- Mobile look numbers now remain intact beside long product names. Media ratio/content extremes and representative desktop/mobile screenshots were visually inspected, including Material anatomy, Shop-the-look, Catalog ledger and Inspection desk.
- Failed-media QA invalidates responsive candidates as well as the fallback src, proving an actual failure rather than letting a valid srcSet silently rescue the test. Pointer focus is distinct from keyboard focus-visible; keyboard input checks verify the focus ring.

Browser QA uses local Chrome, the actual production and Lab components, existing local font fixtures and a disposable loopback harness. It adds no application route or auth bypass. The existing staff layout/proxy remain untouched; this pass does not claim a signed-in browser session against the protected application route. Production route compilation and real Lab component workflows are verified. No manual screen-reader session or real-device Safari/Firefox certification is claimed. Client token contrast and factual publication review remain host responsibilities.

## Creative direction and Collection 008 handoff

[CREATIVE_DIRECTION.md](../CREATIVE_DIRECTION.md) now distinguishes the owner's quality principles from client visual identity. It captures purposeful structural originality, independent typography voices, earned whitespace, strong honest media, semantic graphics/icons, immersive visitor agency, authored mobile behavior and reduced-motion readability. It grounds approval/rejection patterns in Collections 003–007, including P08 detail imagery, C03/C10 image/animation potential and M03's rejected decorative pointers, without treating favorites as a house style.

The next Astra session should read that document, architecture, contribution and typography/art-direction contracts plus this verification. **Collection 008 — Social Proof / Testimonials / Results** should explore attributable stories, reviews, results, metrics, logos, transformation and case-study evidence with explicit context and source relationships, rather than default quote cards/logo strips. It has not been generated here.

Future provider adapters, complete Shop/Collection/Category/Product pages, nested site architecture, page composition/recipes, Motion expansion, overlays, cart/checkout, AI automation and Express generation remain future phases. Scar and the adjacent leadgen repository were not modified. No commit, push, deployment or publication was performed. Stop after Pass 007.
