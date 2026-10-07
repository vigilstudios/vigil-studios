# Professional Design Engine architecture

> **External import batch — 6 October 2026:** six supplied references become three new Production systems (`hero.image-marquee`, `story.process-timeline`, `work.image-sphere`) and two v1.1 extensions (Gallery Hanging, Moving Chorus). Inventory: 111 registrations / 76 Production; 137 Composition fixtures. Read [the complete import report](external-imports/REPORT.md) and [verification](external-imports/VERIFICATION.md). Existing Page/Action foundations and creative studies are preserved; Collection 009 remains unstarted.

> **Current contextual Action milestone — 5 October 2026:** all 73 Production systems have explicit audited `SectionContract.actions` metadata. Optional serializable section slots separate typed destination from controlled presentation; supported primary/secondary, stable item, media and whole-item interactions are editable in Composition and inspectable in Design. Existing Page routing, contracts, lifecycle statuses and creative references remain intact. Read [Action architecture](ACTIONS.md), [component audit](action-integration/AUDIT.md) and [verification](action-integration/VERIFICATION.md). Collection 009 remains unstarted.

> **Current Page & Site foundation — 5 October 2026:** Composition now edits a portable version-1 Site Definition with stable page identities, nested hierarchy, independent page compositions, typed page/section actions and derived Navigation. Global Navigation/Footer slots have explicit inheritance/omit/replacement. Existing inventory and Design studies are retained; Collection 009 remains unstarted. Read [Page architecture](PAGE_ARCHITECTURE.md) and [verification](page-architecture/VERIFICATION.md). Earlier single-page/deferred-architecture descriptions below are historical.


> **Current state — Productionization Pass 008, 5 October 2026:** all twelve E01–E12 designs are human-approved and Production v1.0.0. Inventory: 108 registrations / 73 Production; 127 Composition QA fixtures. Evidence models stay independent, with publication-source contracts and explicit illustrative Lab data. E06 retains a measured seamless loop with expanded typed visual/motion configuration and a complete accessible still view. Read [Pass 008 verification](productionization-008/VERIFICATION.md), [evidence contracts](productionization-008/EVIDENCE_CONTRACT.md), and [concise Collection 009 handoff](ASTRA_CREATIVE_CONTEXT.md). Collection 009 has not been generated. All older status notices below are historical.

> **Collection 008 creative review — 5 October 2026:** twelve Social Proof / Results studies and 36 unrelated adaptations are available in Design Lab, with evidence-specific demo/client-supplied/verified contracts, eight production composition contexts and a five-concept shortlist. All await human review; no Collection 008 registration or production promotion. Existing inventory remains 96 registrations / 61 Production. Read [the collection report](creative-collection-008/README.md) and [verification](creative-collection-008/VERIFICATION.md). Earlier “not begun” statements below are historical.

> **Current Navigation/Hero productionization — 2 October 2026:** NX01–NX12, modified H12, HX01 and HX02 are Production v1.0.0. The 96-entry inventory includes 61 Production systems; Composition retains its original fixtures and adds twelve Navigation/Hero checks (103 total). Read [capabilities and safe-area contracts](productionization-navigation-hero/CAPABILITIES.md), [audit](productionization-navigation-hero/AUDIT.md), and [current verification](productionization-navigation-hero/VERIFICATION.md). Creative reference workspaces are preserved. Collection 008 has not begun.

> **Historical state — Productionization Pass 007, 1 October 2026:** all fourteen human-approved Commerce / Product concepts have independent Production v1.0.0 implementations. Inventory: 82 registrations / 46 Production; 91 Composition QA combinations. Read [Pass 007 verification](productionization-007/VERIFICATION.md), [commerce contract](productionization-007/COMMERCE_CONTRACT.md), and [creative principles](CREATIVE_DIRECTION.md). Older collection handoffs below are historical. Next: Collection 008 — Social Proof / Testimonials / Results; it has not been generated.

## Milestone 1 audit (29 September 2026)

The engine lives in `vigil-studios`, the Next.js 16 / React 19 / TypeScript / Tailwind 4 repository. `vigil-leadgen` is a separate Python Express renderer and is not the host for this system. The proposal's `src/design-engine` path becomes root-level `design-engine/`, matching this repository's root-level `app/`, `components/`, and `lib/` plus its `@/*` alias.

| Existing system | Audit result | Decision |
| --- | --- | --- |
| `app/globals.css` | Marketing and product variables use Vigil green, global heading/font rules, and section utilities. | Leave working styles intact. Scope new semantic `--de-*` variables and component rules below `.de-root` so previews never inherit the Vigil identity. |
| `components/vigil/ui.tsx` | Small product UI helpers are tied to dashboard variables and product semantics. | Reuse them for Design Lab chrome only; engine primitives are independent client-site mechanisms. |
| `components/site/Reveal.tsx` and other motion | Motion is embedded in marketing components and visual language. Framer Motion is already installed. | Use Framer Motion for two engine behaviors with reduced-motion support; do not import marketing animations. |
| Icons | Lucide is already installed; current application imports it directly. | Registry accepts an `icon` category. A stable icon adapter can be added in the later icon milestone. Do not migrate working application UI in this milestone. |
| Typography | `next/font` supplies Space Grotesk and Inter to the Vigil site/product. | Engine themes use configurable font-family token stacks rather than Vigil font variables; client projects may supply their own loaded fonts. |
| Client site architecture | Express demos are static HTML in `public/express-templates`; Professional projects get a repository after staff review. | Engine components remain a portable React package in this repository. No Express template migration or production client-site integration in milestone 1. |
| Routing and auth | `app/(vigil)/admin` has staff authorization in its layout and `/admin` is protected by `proxy.ts`. | Put the internal Lab at `/admin/design-lab`; inherit its staff gate. No public preview endpoint. |
| Tests | Vitest discovers `lib/**/*.test.ts`; `npm run typecheck`, `npm test`, and `npm run build` are established checks. | Keep contract/render tests under `lib/`; run those gates plus focused lint. |

Scar is excluded. No Scar assets, motifs, tokens, code, or composition references belong in this engine.

## Boundaries and contracts

`design-engine/foundations` owns the semantic token schema and a small set of **example** visual directions. A theme is a tendency and a set of overridable tokens, never a finished client identity. `DesignThemeProvider` applies variables only to its subtree, including a preview. Component CSS reads only `--de-*` variables and structural properties. The engine's neutral fallback contains no Vigil green.

Consumers import `design-engine/styles.css` once and wrap their section tree in `DesignThemeProvider`. `overrides` accepts a partial group of tokens, so a client identity can change one semantic value without replacing the direction's spacing, type, or layout. The stylesheet uses container queries; a narrow Lab frame therefore exercises mobile component behavior even on a wide desktop browser. These example themes are only foundation fixtures, not the later full theme-direction batch.

`design-engine/registry` is the source of machine-readable component metadata: stable id, category, description, styles, page types, supported motion, accessibility/mobile readiness, status, version, configuration choices, and preview variants. It deliberately contains no React nodes or functions. `design-engine/preview` maps a registry id and variant to a real component with representative, brand-neutral data. This split lets later agents search/serialize metadata without importing client UI code. A registration test checks uniqueness and that every preview variant renders.

The Lab reads the registry and preview map. It offers search, category selection, theme selection, variant selection, and desktop/mobile preview widths. It shows metadata and configuration choices even for a category that has no registered examples yet. Lab chrome follows the existing admin system; the preview subtree uses engine tokens. The Lab is an internal evaluation surface, not a client site or a full page template.

Representative milestone-1 implementations: Button and Container primitives; one responsive navigation, one hero, one content section; FadeReveal and StaggerReveal. Components enter as `experimental`; `production` requires the responsive, accessibility, performance, configuration, brand-neutrality, and visual-diversity gates in the plan.

## How to extend

1. Add a meaningful mechanism under `design-engine/primitives`, `sections`, or `motion`. Props carry content and design choices; avoid client data and long boolean lists.
2. Add a serializable entry with a stable id to the registry. Describe actual configurations and supported motion. Keep `status: "experimental"` until review is complete.
3. Add a preview renderer for every listed variant using neutral sample content. Verify the same component under at least two themes and at mobile width in the Lab.
4. Extend the registry/render test and run typecheck, tests, lint, and production build. Check keyboard interaction, focus visibility, reduced motion, and narrow layouts before raising status.

The current milestone validates this contract and stops before the planned library batches.

## Milestone 1 verification

- `npm run typecheck`, focused ESLint, `npm test` (281 tests), and `npm run build` pass. The build includes the dynamic `/admin/design-lab` route.
- Contract tests render every registered preview variant under all three example directions, check discovery and serializability, verify partial token overrides, and render the Lab itself.
- In the authenticated local browser, the Lab displayed its registry details, filtered to motion entries, switched to Editorial, rendered a 390px mobile navigation with a working disclosure, and rendered the centered hero configuration. The mobile frame changed the actual component layout through container queries.

## Milestone 2: component factory foundation

The existing package grows in place. `design-engine/icons` maps stable functional names to static Lucide imports and exposes `VigilIcon`; a caller may supply a client-scoped compatible pack without changing the core map. `design-engine/primitives` now has the minimum semantic layout, type, action, surface, media, and separation mechanisms for the first real component batch. The portable media element deliberately uses native image/video markup inside an aspect-ratio frame, so client repositories with different image hosts can supply their own assets and optimize delivery at their application boundary.

`design-engine/motion` contains 12 named behaviors. Scroll and pointer behaviors use Framer Motion values and springs, which update transforms without a React render per frame. Marquee pauses when outside the viewport or under reduced motion. Touch and narrow layouts lose pointer depth and unnecessary scroll transforms. HorizontalScroll uses native overflow and keyboard-accessible controls. These behaviors are mechanisms to configure, not a site-specific animation language.

Registry metadata remains serializable and code-native. `registry/foundations.ts` holds compact definitions for the new primitive, motion, and icon entries; `registry/components.ts` remains the single catalog. `assertValidDesignRegistry` runs at import time. It rejects duplicate/malformed ids, unknown directions/motion, incomplete variant configurations, and production entries missing explicit QA evidence. `advanceComponentStatus` enforces experimental → review → production on code-native promotion. The preview renderer is exhaustive over catalog ids and validates Lab overrides against declared options.

The Lab adds lifecycle filtering and direct controls for each declared configuration field while preserving search, category, theme, viewport, motion support, and raw metadata inspection. All current entries remain `experimental`; the infrastructure permits promotion, but Milestone 2 does not claim creative components have passed the final production gate. See [COMPONENT_CONTRIBUTION.md](./COMPONENT_CONTRIBUTION.md) for the exact handoff and QA contract.

Decisions before creative generation: choose the first genuinely different Astra/Figma concepts, define client content/media shape for those concepts, and decide who records production approvals. No icon style pack, recipe, industry template, or AI composer is preselected here.

## Milestone 2 verification

- `npm run typecheck`, `npm run lint`, `npm test` (285 tests), and `npm run build` pass. The production build includes `/admin/design-lab`.
- Registry tests check all 29 entries and their preview variants under all three example directions. They also cover configuration validation, lifecycle evidence, icon accessibility and alternate packs, media accessibility, and Lab rendering.
- In the authenticated production-build browser, the Lab listed 29 entries, filtered by status and category, changed an icon through its declared configuration, changed a Marquee duration, and rendered HorizontalScroll at 390px with working navigation controls.

## Creative Calibration 003: independent creative directions

Phase 003 extends this package in place. `foundations/typography` owns five typed roles and ten initial profiles. `foundations/art-direction.ts` owns six independent spatial/media/action tendencies. `DesignThemeProvider` combines those with existing theme/brand tokens and optional client font bindings. A scoped motion provider applies none/restrained/expressive policy while honoring reduced motion. Existing callers can omit the new inputs.

The authenticated Lab now has three workspaces: the existing 29-entry component catalog, controlled re-tests of H09/H10/H12/H13/H16, and twelve static Batch 003 sketches (H17–H28). The catalog and re-test workspace expose type/art/motion independently from theme and structure. Re-tests add tablet width, replay and same-structure Editorial/Poster comparison. Batch review offers individual and side-by-side views plus mechanism, rejected first answer, proposed behavior, mobile strategy and industry adaptations.

The ten local Fontsource fixtures are loaded only at the Lab route through `next/font/local`, with no catalog-wide preloading. Components consume semantic font roles and do not load fonts. Client projects bind only their chosen fonts at their own application boundary. This preserves future Google/local/licensed-variable choices without a global catalog dependency.

Read [Typography and art direction](./TYPOGRAPHY_AND_ART_DIRECTION.md), [Creative tooling](./CREATIVE_TOOLING.md), [Feedback and audit](./creative-calibration-003/FEEDBACK_AND_AUDIT.md), [Batch 003](./creative-calibration-003/BATCH_003.md), and [verification](./creative-calibration-003/VERIFICATION.md) for current details. Earlier milestone verification above is historical. No concept was promoted and no registry entry was added in Phase 003. Original Figma concepts and their source assets are preserved; approved creative directions do not imply production approval.

## Milestone 4A: production composition architecture

The current reusable section contract is [COMPOSITION_ARCHITECTURE.md](./COMPOSITION_ARCHITECTURE.md). `composition/schemas.ts` validates site/page/section inputs; `catalog.ts` declares each structure's capabilities; `contracts.ts` and `contract-validation.ts` keep registry metadata typed and serializable; `validation.ts` resolves independent layers and checks capability constraints; `render.tsx` dispatches separate implementations. The old provider remains valid for individual studies, but composition restricts brand/icons to the site and exposes only declared typography/art/motion overrides. Structure and media behavior stay section-owned.

`media/` supplies reusable geometry and tone treatments. Selected N01/N02 and H17/H18/H22/H24/H12 implementations consume client schemas without calibration content imports. Seven new entries are in `review`, alongside the original 29 experimental registrations. Creative concept approval and production lifecycle approval remain separate. Primary Navigation, Statement Hero and Feature List also declare composition contracts. No Footer or new section collection is added.

The single desktop-only `/admin/lab` entry inherits the existing staff gate. Its Design workspace inspects individual assets and retains the complete Batch 003 Concepts workspace; Composition tests ordered combinations with independent site layers, controlled page/section overrides, strict content/media inputs and actionable compatibility diagnostics. Legacy Lab routes redirect to the corresponding workspace. Both share fixed editor chrome, a hideable/resizable right inspector, control sizing and artboard zoom; selected component settings remain visible beside the canvas. Lab assets/font loading stay behind preview boundaries. No templates, recipes, AI generation or customer builder are introduced. See [Milestone 4A verification](./MILESTONE_4A_VERIFICATION.md) for the checked scope and next campaign handoff.

## Collection 004: truthful controls and experimental storytelling

[Collection 004](./creative-collection-004/README.md) adds eight separate Brand / About / Story studies in Design and three experimental reusable implementations (S01/S03/S06), bringing the registry to 39 entries. Existing 29 experimental entries and seven review entries retain their lifecycle dispositions. Six internal Composition combinations extend A–E without replacing them.

The [capability audit](./creative-collection-004/CAPABILITY_AUDIT.md) records effective, unsupported, contextual and broken controls. Foundation registry metadata and section contracts are authoritative; `composition/controls.ts` derives context restrictions from the runtime validator and uses explicit transitions. `CapabilityControl` hides irrelevant dimensions, displays single choices as properties and explains disabled choices. Independent site/page layers stay intact when a section is deliberately invariant. See [candidate boundaries](./creative-collection-004/CANDIDATES.md) and [verification](./creative-collection-004/VERIFICATION.md). The single desktop Lab workflow and earlier study archives are retained.

## Collection 005: media creative review

[Collection 005](./creative-collection-005/README.md) adds twelve Lab-only Media / Work studies with three unrelated adaptations each. Its typed proposal contracts use the existing SectionContract vocabulary but are not runtime registrations. Native disclosures, frame/pair/spread selection, horizontal progression, subject filtering, silent video playback and independent comparison wells are implemented only to communicate the studies. The registry remains at 39 entries; no production promotions or new Composition recipes occur. [Collection 004 human review](./creative-collection-004/HUMAN_REVIEW.md) is authoritative and separate from implementation lifecycle.


## Productionization Pass 004–005

The current implementation and verification are documented in [Productionization 004–005](./productionization-004-005/VERIFICATION.md). Six approved Story and eleven approved Work concepts now have separate version-1 Production implementations with strict structure-specific contracts, authored media relationships, page-usage metadata, controlled typography/art overrides, transition notices and 22 additional mixed QA compositions. Original studies and human dispositions remain available. The review ledger is canonical in `registry/creative-review.ts`, re-exported by the original study modules; promotion checks its approval plus the established lifecycle evidence gate.

Usage and flow metadata prepare later composition while keeping route ownership at the client boundary. No future page/detail/commerce/overlay/motion/AI/Express system was implemented. The next creative family is **Collection 006 — Services / Capabilities / Features**; follow the dossier's handoff contract and contribution rules. Earlier verification sections in this document are historical milestones.

M13 was subsequently explicitly approved and added as `work.viewport-gallery` (page-capable), bringing the current inventory to 54 registrations / 18 Production implementations and 24 mixed QA compositions. See [M13 production contract and verification](./productionization-004-005/M13_PRODUCTION.md).


## Collection 006: Services / Capabilities creative review

[Collection 006](creative-collection-006/README.md) adds twelve Lab-only service/capability studies, 36 unrelated adaptations, strict mechanism-specific study schemas, responsive artboards and a 66-pair anti-convergence dossier. The existing engine typography/art/token/icon systems are reused. Proposals declare page capability and composition flow without registering unapproved studies. All earlier human dispositions and the 54-entry / 18-Production inventory remain unchanged. Human review determines the next implementation shortlist; Collection 007 and future page/detail/pricing/motion layers remain unstarted. Composition fixture titles now describe readable scenarios while retaining stable IDs. See [verification](creative-collection-006/VERIFICATION.md).


## Current state after Productionization Pass 006 — 1 October 2026

All twelve human-approved Collection 006 concepts now have separate version-1 Production implementations and strict mechanism-specific content contracts. The inventory is 66 registrations / 30 Production implementations; Composition Lab has 59 QA combinations, including 24 Services sequences. Original studies and all human dispositions are retained.

Read [Pass 006 verification and Collection 007 handoff](./productionization-006/VERIFICATION.md) before the next campaign. Runtime schemas/contracts live in `composition/service-schemas.ts` and `service-contracts.ts`; implementations live in `sections/services/`. Metadata adds supported content types, finite item ranges, interaction capabilities and a general dense-neighbor transition notice. Client destinations/slugs do not impose routes; initial selections seed local state. Opt-in C03/C09/C10 media reveal reuses the existing primitive, now corrected to cancel its clip immediately under reduced motion.

The next creative collection is **Collection 007 — Commerce / Product Presentation**, focused on visual and interaction vocabulary. It has not been started. Service Detail pages, page recipes/grammars, nested architecture, commerce backend, dedicated motion expansion, overlays/transitions, AI composition and Express variants remain future phases. Scar remains excluded. Earlier milestone sections above are historical.


## Approved Hero follow-up — H09 / H16

The separately requested H09/H16 productionization is complete. `hero.object-study` and `hero.vertical-record` are independent Production v1.0.0 systems with typed client content and four mixed Composition QA sequences. Inventory: 68 registrations / 32 Production; Composition Lab: 63 combinations. Original calibration studies and human notes are preserved. Earlier deferral notes describe the preceding approval-only task. Read [the follow-up verification](./hero-productionization-h09-h16/VERIFICATION.md) for bounds, geometry, supported layers, optional reveal, evidence and current handoff. Collection 007 remains unstarted.

## Collection 007: commerce creative review — 1 October 2026

[Collection 007](./creative-collection-007/README.md) adds fourteen Lab-only Commerce / Product studies, 42 unrelated adaptations, normalized presentation data and mechanism-specific strict study schemas. The existing Design workspace gains Study/Contract/Review inspection, desktop/tablet/mobile artboards, a cropped inert overview and long-copy/missing-media controls. All 91 concept pairs are documented for human judgment.

The registry remains 68 entries / 32 Production, and all 63 Composition QA combinations and prior human decisions remain unchanged. No commerce study is registered or productionized. Study-local page capability includes Product Detail building blocks because the current runtime contract does not yet express them. Data adapters, cart/checkout/inventory/orders, whole Shop/PDP pages, recipes, dedicated motion and Collection 008 remain out of scope. The user approved all fourteen concepts on 1 October 2026, recorded in `collection007Review`. P08’s close-up detail imagery is favored as media guidance, not a foundation change. The original six-system shortlist is historical; productionization is reserved for the user’s next pass. See [verification](./creative-collection-007/VERIFICATION.md).
