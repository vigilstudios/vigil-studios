# Productionization Pass 006 — Services / Capabilities / Features

Completed 1 October 2026 in `vigil-studios`. This extends the existing engine. The canonical human ledger is `design-engine/registry/creative-review.ts`; none of its decisions or notes was changed. All twelve Collection 006 concepts were Approved. No Collection 006 concept remains Review or Experimental after this pass.

The inventory is now **66 registrations: 30 Production, 7 Review, 29 Experimental**. Composition Lab contains **59 QA compositions**, including 24 new Services combinations. These are compatibility exercises, not page recipes.

## Selection and independent production systems

Each registration is version **1.0.0**, category `services`, with source-concept provenance and its own content schema and renderer. `service-sections.ts` passes each Experimental definition through Review and Production using `promoteCollectionSection`. Collection 006 requires its own current-pass evidence; it cannot reuse the earlier collections' evidence by default. Unapproved or unknown concepts fail the human gate.

| Concept / reviewed name | Production registration | Content contract and bounds | Usage |
| --- | --- | --- | --- |
| C01 · The service index | `services.offering-index` | 3–7 entries: ID/optional slug, title, summary, 2–4 deliverables, optional destination | Section and page |
| C02 · What we make possible | `services.capability-manifesto` | Promise and 3–5 verb/pledge/boundary commitments | Section |
| C03 · Capability desk | `services.capability-desk` | 4–8 capabilities: ID/slug, category, description, outcome, authored image, optional destination | Section and page |
| C04 · Inside the offering | `services.expandable-offerings` | 5–10 offerings: ID/slug, summary, 2–5 included capabilities, explicit boundary, optional destination | Section and page |
| C05 · From friction to possibility | `services.situation-responses` | 3–5 need/response/outcome/evidence situations | Section and page |
| C06 · The capability journey | `services.delivery-journey` | 3–6 ordered stages: ID/slug, owner, input, work and output | Page |
| C07 · Discipline matrix | `services.capability-coverage` | 3–4 unique phases; 3–4 unique groups with 2–5 capabilities each, 6–20 total; exactly one coverage value per phase | Page |
| C08 · Connected capabilities | `services.connected-capabilities` | Input/output and 3–5 responsibility layers: ID/slug, 2–4 components, meaningful handoff | Section and page |
| C09 · Service field atlas | `services.service-field-atlas` | 3–5 plates: ID/slug, image, caption, application, optional destination | Page |
| C10 · Evidence in practice | `services.evidence-in-practice` | 2–4 cases: ID/slug, two independently labelled image/note plates, capability and evidence | Section |
| C11 · Find your starting point | `services.starting-point` | Question and 3–5 paths: ID/slug, need, recommendation, reason, explicit alternative, optional destination | Section |
| C12 · Scope companions | `services.scope-companions` | 2–3 offerings: ID/slug, best-for context, boundary, optional destination; 5–10 unique shared criteria with exactly aligned values | Section and page |

Runtime schemas live in `composition/service-schemas.ts`. Each rejects extra fields, missing required relationships, invalid counts and unsafe destinations. Record IDs are unique; matrix capability IDs are unique across groups. Schema tests cover all minimum/maximum counts, missing coverage/comparison values, invalid initial selections, unsafe links and commerce fields. Record titles are bounded to 100 characters; section titles to 180 and introductions to 600; mechanism-specific prose retains tighter limits in the executable schemas.

C06 supports service/offering/capability sequences and requires actual sequential work. C08 supports features/capabilities/competencies and requires an actual linear dependency chain. The other systems declare support for services, business offerings, features, capabilities, competencies, benefits and disciplines. These declarations describe compatibility, not automatic content conversion. A scope comparison needs meaningful shared criteria; a manifesto needs commitments; a coverage matrix needs real phase responsibility. No universal services mega-component was added.

## Human feedback and creative preservation

C03 and C10 were particular favorites for their image usage and animation potential. Their production implementations retain the persistent evidence desk and the paired evidence relationship, respectively. Both offer opt-in existing `media-reveal`; C09 offers the same behavior for its photographic plates. Media variants use restrained default intensity, while the standard behavior remains `none`. Site/page intensity and OS reduced motion remain independent controls.

No corrective revision was requested for a held Collection 006 concept: all twelve were approved. The work applies the stated immersive direction through the preserved imagery, purposeful selection and optional reveal rather than inventing new feedback. The original twelve studies, all 36 adaptations, original study schemas, review notes, local destination simulations and comparison overview remain in Design → Collection 006. Runtime implementations import none of those studies or fixtures.

Earlier dispositions are untouched: S04 remains Promising / Revision Required, S05 remains Rejected, and M03 remains Revision required. H09/H16's separate migration remains deferred. Existing Navigation/Hero lifecycle statuses remain unchanged.

## Destinations and selection contracts

IDs and optional slugs identify records without constructing routes. `detail?: {label, href}` accepts safe application paths, anchors, HTTP(S), mail and telephone destinations. These render as ordinary accessible anchors. Runtime links are never intercepted to create a simulated service summary; clients own the routes. No Service Detail page or route model was added.

C03/C10/C11 accept an optional **initialSelectedId**. C12 accepts **initialBaselineId** and **initialCandidateId**. These seed local state on mounting; they are not controlled-state props. The schema checks membership. Local selection stores record IDs, preserving the selected record when direct consumers reorder content; removal falls back to the first available record. A composition content replacement intentionally remounts the section. Every interactive system still works without hover.

- C03: native pressed-state buttons control a named evidence article; title changes are politely announced. One active image is mounted. Focus stays on the initiating button.
- C04: native `details`/`summary` supports Enter/Space with no custom expansion state, focus trap or client boundary.
- C07: desktop retains all table columns; mobile selects one phase while retaining every group and capability. Caption, row, column and row-group headings preserve the relationships.
- C10: native case buttons control a named case article. Both images, labels, capability and evidence change together. One pair is mounted; there is no autoplay, wipe or automatic progression.
- C11: named need buttons control an atomic polite recommendation with its reason, alternative and optional destination. One authored decision level is supported.
- C12: desktop exposes all offerings. Mobile retains two independent selectors, repeated column labels and aligned value pairs. Identical selections are allowed and explicitly announced.

The new components use the existing `VigilIcon` abstraction for their original functional disclosure/destination/selection/handoff indicators. No external icon pack or icon decoration was introduced.

## Composition contracts and seams

`service-contracts.ts`, `catalog.ts`, strict schemas, exhaustive runtime/individual renderers and the registry agree on the new structures. Contracts declare structural intent, usage, content bounds, supported content types, interaction capabilities, actual type/art/motion/media capabilities, responsive transformations, accessibility and document flow. Composition Lab's Structural identity inspector shows content vocabulary and count bounds as well as usage and requirements.

All ten typography profiles are supported through semantic roles and bounded scales. Each service system declares two or three compatible art directions. Brand colors and icon packs remain site-owned; controlled section overrides affect typography/art and, for media systems, motion. C03/C09/C10 require contained images and support natural/monochrome/high-contrast tone. Unsupported geometry and motion are rejected. Intrinsic dimensions, alt text and host-authored responsive sources are accepted through the existing image contract.

Each primary service system has two unlike Navigation/Hero sequences, with different site type/art/brand contexts. Sequences exercise Navigation → Hero → Story → Services → Work and Navigation → Hero → Services → Capabilities → existing Feature List ending. The earlier 35 compositions remain available.

Sections own their authored edge spacing. Existing flow-root slots prevent margin leakage; provider layers stay scoped to each section. Browser checks found no unexpected horizontal overflow, media collisions or sticky collisions. No new section owns sticky scrolling or an overlay navigation safe zone. Full-width and dark-room transition notices remain capability-derived; their wording now accommodates typographic as well as photographic full-width fields.

`compatibility.flow.density` adds a small general seam signal. Two adjacent dense information structures produce a non-blocking `density-transition` notice; the C07/C12 stress pairing exercises it. Review the reading rhythm rather than silently rewriting either matrix. Repeated sequential narratives, such as a Material Relay next to Delivery Journey, also warrant editorial spacing/content judgment; the pass preserves the structures and does not create a composition grammar or pairing blacklist.

## Responsive, accessibility and browser verification

Evidence is in [the evidence directory](./evidence/). The repeatable loopback harness uses real Chrome viewports and the licensed local Lab fonts.

- **72 long-copy layout checks:** all twelve systems at 1920, 1440, 1280, 768, 390 and 320px. No document or section-element overflow.
- **340 mobile type/art checks:** every declared typography/art combination, long copy, actual 390px viewport. No overflow.
- **48 mixed-page checks:** all 24 new combinations at 1440 and 390px. No overflow; exactly one page main and h1.
- **48 boundary checks:** all twelve systems at minimum/maximum record counts, long copy, desktop and mobile. This includes the full 20-capability matrix and 10-criterion scope comparison.
- **24 axe-core audits:** every component at 1440 and 390px, WCAG 2 A/AA and 2.1 AA rules. Zero violations.
- Enter/Space tests verify C03/C10/C11 selection and C04 opening/closing; all initiating controls retain focus and a visible 3px outline. Mobile phase switching, identical scope selections and column labelling were checked. Touch taps select C03/C10/C11 without hover.
- OS reduced-motion emulation verifies complete images, opacity 1, no clip and no transform under every opt-in media system. A live preference change during a reveal was also tested.
- Authenticated production-build Lab verification checks the twelve catalog entries, preserved Collection 006 study/review surface, cross-collection compositions, component replacement/addition/reordering, strict content editing and supported controls. Existing staff authorization remains in force; no application route or auth bypass was added.
- No unexpected browser console errors were observed in the fixture or authenticated production Lab. The existing application-level `THREE.Clock` deprecation warning remains outside this pass.

Automated accessibility audits and keyboard/touch checks are recorded evidence, not a full screen-reader or cross-browser certification. Client fonts, imagery and palettes still require their project-specific review.

The browser uncovered three corrections: a running MediaReveal retained its clip briefly after reduced motion was enabled, and replacing C03's glyph with a functional SVG exposed the desktop indicator in the compact mobile button grid. The shared MediaReveal now replaces animated DOM with a static surface immediately when policy requires no motion; C03 retains its intended compact mobile transformation. C10's case controls target the complete named evidence article. The live catalog also exposed a static preset inheriting a reveal intensity: Design Lab now derives its default intensity from the selected preset's capability, so static defaults render immediately and reveal presets retain restrained intensity. All twelve final catalog defaults and the alternate media preset were verified after rebuilding.

## Performance and implementation choices

No runtime dependency, font catalog, scroll listener, pointer loop or dedicated motion capability was added. Seven systems remain server-capable, including native disclosures. Only C03/C07/C10/C11/C12 require selection state. C03 mounts one active image and C10 one active pair; images use lazy loading, async decoding, intrinsic dimensions and optional responsive sources. No offscreen media switching, video preloading or per-frame React state was introduced.

The full disposable harness includes both Lab workspaces, all historical studies/fixtures, React, validation and existing motion. Its size is not a client-site payload claim. [Performance evidence](./evidence/performance.json) records the minified/gzip harness measurement and separate service JS/CSS contributions. Client projects import selected implementations and load selected fonts/assets at their application boundary.

## Repository gates and reproduction

`npm test` passes **56 files / 336 tests**. `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check` pass. Build, typecheck, lint and test logs are retained alongside browser evidence.

From this repository, run `DESIGN_ENGINE_AXE=node_modules/axe-core/axe.min.js node scripts/design-engine-qa.mjs`, then serve `/tmp/vigil-design-engine-qa` on loopback port 4177. Run the `design-engine-pass006-matrix.mjs`, `-bounds.mjs` and `-interactions.mjs` scripts. Supply `PLAYWRIGHT_MODULE` if the existing Playwright package lives outside the repository. These scripts exit unsuccessfully on their recorded failures. They add no project dependency or application route. The QA harness also supports `?lab=design`, `?lab=composition`, `?scale=minimum` and `?scale=maximum`.

## Handoff for Collection 007

The next creative family is **Commerce / Product Presentation**. Start with the visual and interaction vocabulary: product presentation/cards, collections, merchandising, apparel/fashion, featured products, rails, storytelling, shop-the-look, media/category presentation and possible Product Detail building blocks. Do not presume a commerce backend or a universal product-card schema.

Read the current architecture, contribution and composition contracts plus this dossier. Preserve original studies and authoritative human decisions. Propose distinct structures, declare their actual content/media relationships and limits, usage, destination ownership, supported content types and real interactions. Demonstrate unrelated client adaptations, controlled typography/art/brand changes, keyboard/touch/reduced-motion states and unlike neighboring collections before production selection. C03/C10 remain strong immersive-image references, not a mandate to copy their layout into commerce.

Routes, service/project/product detail pages, commerce transactions, inventory, templates, nested architecture, overlays, page transitions, composition grammars, AI generation, Express variants and dedicated Motion Engine expansion remain future work. H09/H16 migration is a separate task. Scar's standalone project is untouched. **Collection 007 was not generated. Stop here.**
