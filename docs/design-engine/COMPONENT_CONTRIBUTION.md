# Contributing a Professional Design Engine component

## Contextual action gate for every future collection

For Collections 009 onward, read [the Action contract](ACTIONS.md) and the [individual Production audit](action-integration/AUDIT.md). Before implementation, decide whether the visitor needs a primary continuation, secondary choice, item destination, media destination, whole-item interaction or intentionally no action. Record the rationale; never add a button solely to fill a slot.

Declare the result in the existing `SectionContract.actions` capability metadata: classification, reason, supported primary/secondary presentation choices, and stable item groups/paths/identity/display modes. Use the existing typed `Action` union and central resolver. Page destinations store page IDs; section destinations store Page + Section IDs. Future semantic behavior may appear in the design rationale, without speculative modal/booking/cart backends.

Use the shared Action/Button interaction foundation while retaining the concept's placement, typography, art direction, client tokens and media reading order. Expose only verified variants, sizes, alignment, width, icon/position and surfaces. Preserve primary-only, secondary-only, both and neither where declared. Media and whole-item links must not contain disclosure, selector or video controls; source/attribution links remain separate. Use stable item identities, never array positions.

Acceptance requires Composition editing/persistence, accurate Design metadata/inspection, legacy composition rendering, broken-target diagnostics, page slug/reparent survival, supported-option validation, and keyboard/focus/contrast/reduced-motion checks at desktop/tablet/mobile/narrow mobile with long labels. Add meaningful tests for target identity and the actual interaction mechanism. Unsupported options must be rejected by parsing and absent from the editor. This standard applies to contextual actions; Collection 012 remains the separate dedicated CTA/Conversion collection.

> **Current Action integration — 5 October 2026:** 73 Production components audited; 63 primary, 5 secondary, 38 item, 10 media and 3 whole-item systems, with eight intentionally actionless. Counts overlap. Existing statuses, 108 registrations and 127 prior Composition QA fixtures are unchanged; connected action QA uses separate fixture variants. Read [verification](action-integration/VERIFICATION.md).

> **Current Page & Site foundation — 5 October 2026:** Composition now edits a portable version-1 Site Definition with stable page identities, nested hierarchy, independent page compositions, typed page/section actions and derived Navigation. Global Navigation/Footer slots have explicit inheritance/omit/replacement. Existing inventory and Design studies are retained; Collection 009 remains unstarted. Read [Page architecture](PAGE_ARCHITECTURE.md) and [verification](page-architecture/VERIFICATION.md). Earlier single-page/deferred-architecture descriptions below are historical.


> **Current state — Productionization Pass 008, 5 October 2026:** all twelve E01–E12 designs are human-approved and Production v1.0.0. Inventory: 108 registrations / 73 Production; 127 Composition QA fixtures. Evidence models stay independent, with publication-source contracts and explicit illustrative Lab data. E06 retains a measured seamless loop with expanded typed visual/motion configuration and a complete accessible still view. Read [Pass 008 verification](productionization-008/VERIFICATION.md), [evidence contracts](productionization-008/EVIDENCE_CONTRACT.md), and [concise Collection 009 handoff](ASTRA_CREATIVE_CONTEXT.md). Collection 009 has not been generated. All older status notices below are historical.

> **Collection 008 creative review — 5 October 2026:** twelve Social Proof / Results studies and 36 unrelated adaptations are available in Design Lab, with evidence-specific demo/client-supplied/verified contracts, eight production composition contexts and a five-concept shortlist. All await human review; no Collection 008 registration or production promotion. Existing inventory remains 96 registrations / 61 Production. Read [the collection report](creative-collection-008/README.md) and [verification](creative-collection-008/VERIFICATION.md). Earlier “not begun” statements below are historical.

> **Current Navigation/Hero productionization — 2 October 2026:** NX01–NX12, modified H12, HX01 and HX02 are Production v1.0.0. The 96-entry inventory includes 61 Production systems; Composition retains its original fixtures and adds twelve Navigation/Hero checks (103 total). Read [capabilities and safe-area contracts](productionization-navigation-hero/CAPABILITIES.md), [audit](productionization-navigation-hero/AUDIT.md), and [current verification](productionization-navigation-hero/VERIFICATION.md). Creative reference workspaces are preserved. Collection 008 has not begun.

> **Current state — Productionization Pass 007, 1 October 2026:** all fourteen human-approved Commerce / Product concepts have independent Production v1.0.0 implementations. Inventory: 82 registrations / 46 Production; 91 Composition QA combinations. Read [Pass 007 verification](productionization-007/VERIFICATION.md), [commerce contract](productionization-007/COMMERCE_CONTRACT.md), and [creative principles](CREATIVE_DIRECTION.md). Older collection handoffs below are historical. Next: Collection 008 — Social Proof / Testimonials / Results; it has not been generated.

This contract applies to future Astra concepts, Figma explorations, and code-first work. The Design Engine is brand neutral. Scar is a standalone bespoke project and is never a source of reusable artwork, motifs, animation, or component styling.

## Before writing code

1. **Research** the client problem, content needs, comparable patterns, and accessibility risks. Record the purpose and target page roles.
2. **Concept** a mechanism, not a finished appearance. A new component must differ meaningfully from existing entries in at least one of: structure, spatial composition, interaction, media behavior, storytelling, navigation behavior, or motion behavior.
3. **Visual design** the concept in Astra/Figma when composition warrants it. A code-first concept is fine for simple utility UI. Review alternatives and choose one to implement.

Changing only color, typography, text alignment, image position, or border treatment does **not** justify a new component. Put those decisions in tokens or a meaningful configuration of an existing component. Do not implement every external concept automatically.

## Implementation contract

4. **Implement** under `design-engine/`. Reuse `DesignThemeProvider`, semantic `--de-*` values, essential primitives, `VigilIcon`, and motion behaviors. Content enters through typed props. Media is supplied by the client project, with alt text or an accessible video label. Avoid client names, artwork, fixed brand colors, and specific copy in reusable source. Use layout variants only when they alter a real design choice. Avoid long boolean prop lists.
5. **Register** a serializable definition in `design-engine/registry/`. Give it a stable dotted id, category, description, supported directions/page types/motion, complexity, readiness flags, semantic version, configuration choices, and preview variants. Every preview variant supplies a valid value for every declared configuration field. New entries begin `experimental`.
6. **Preview** in `design-engine/preview/render.tsx` and the Design workspace of `/admin/lab`. The exhaustive renderer must compile after a new id is added. Use neutral sample content and a real implementation, not a static picture of the component. Expose important props through the fixed right inspector. Inspect all example directions and desktop/mobile artboards from the desktop workspace.

Every customizable inspector option must support a temporary hover preview and an equivalent keyboard-focus preview, including client adaptations, presets, brand treatment, configuration and creative layers. Use `CapabilityControl` / `PreviewChoiceControl` for finite choices; `CapabilityControl` requires `onPreview`. Use draft-and-Apply controls for free-form values. Preview state must remain separate from authored data: pointer leave, Escape, outside interaction and context changes restore the current design; click, Enter or Apply commits. Unsupported choices explain their reason and never preview or apply. Verify visible changes, rollback, keyboard access and retention of interaction state in the real Lab before handoff.

Astra/Figma files are creative inputs, not component source code. Translate their structure, media behavior, and motion into configurable React. Keep source assets and any custom icon pack in the client project. Figma ingestion is not automated.

## Review and promotion

The lifecycle is **experimental → review → production**. `advanceComponentStatus` permits only the next step and checks the resulting entry. Registry validation runs when the catalog loads and in tests; malformed metadata or a production entry without complete evidence fails immediately.

7. **Design Lab review:** compare against registered components for genuine structural diversity, inspect the variants and raw metadata, and ensure content changes do not break the composition. Move to `review` only after the concept is worth refining.
8. **Responsive QA:** check desktop, tablet, and mobile. Use the Lab frame for quick comparison and a real browser viewport for final checks. Test long/short copy and different media ratios.
9. **Accessibility QA:** verify semantic landmarks and heading order, keyboard and focus behavior, accessible media, contrast under intended tokens, and reduced-motion behavior. Decorative icons must be hidden from assistive technology; informative icons need a label.
10. **Performance QA:** avoid large client bundles, layout shifts, oversized media, perpetual work when out of view, and React rerenders on each pointer/scroll frame. Measure complex additions in a representative page.
11. **Production:** set `mobileReady` and `accessibilityReady` truthfully, attach `productionEvidence` with desktop/tablet/mobile, semantics/keyboard/focus/reduced-motion, performance, brand-neutrality, and visual-diversity checks, plus approver and date. Then change status from `review` to `production` and bump the semantic version. The catalog validator rejects an incomplete production entry.

Run `npm run typecheck`, `npm test`, focused ESLint, and `npm run build`. A component is reusable only when its contract, preview, and browser behavior agree.

## Current foundation boundary

Milestone 2 supplies functional icons, essential primitives, 12 motion behaviors, lifecycle validation, and Lab inspection. They remain `experimental` until component-specific QA and approval. The next creative component batch starts from this contract; it does not require a page builder, recipes, industry templates, AI composition, or a database.

## Creative Calibration 003: anti-convergence gate

Before any new creative batch, read [the feedback ledger and audit](./creative-calibration-003/FEEDBACK_AND_AUDIT.md), [typography/art-direction contract](./TYPOGRAPHY_AND_ART_DIRECTION.md), and [creative tooling](./CREATIVE_TOOLING.md). Preserve approved originals. Do not use Scar as a reference, source or reusable vocabulary.

A creative batch is a set of proposals, not production inventory. Static code sketches belong in `preview/calibration`, or in a clearly labeled design file, and stay out of the registry. Selection precedes interactive implementation. Styling flexibility is not evidence that a weak structure deserves to survive.

Every concept submission must include:

- The visitor/content purpose and reusable mechanism, plus three unrelated industry adaptations that retain it.
- The predictable first answer and the specific structural/art-direction decision that replaces it.
- A typography profile and art direction chosen independently of palette; record display/body contrast, tracking, casing, hierarchy, paragraph measure and rhythm.
- Media behavior and crop/focal requirements, mobile reading order, actual versus proposed interaction, and a motion-none frame.
- Comparison against **every other concept** across typography, composition, media, interaction, motion and rhythm. Record the closest pairs and why one should be replaced or why both deserve review.

No consecutive concepts may share a typography profile. A twelve-concept round should cover at least eight type directions and multiple dense/open, left/center, photographic/graphic/type-only approaches. Each pair must differ materially on at least three review axes; distinct names or metadata strings alone do not establish difference. Human visual review is authoritative. Use a comparison matrix to expose overlap, not to manufacture a passing score.

Specifically compare navigation height/brand scale, CTA language/shape, radius, border weight, whitespace rhythm, image framing, reveal direction and timing. Do not allow the same navbar, underline/pill button, soft image rectangle, wide tracking, oversized grotesk, or fade-up to become a default across the entire collection. Use a repeated treatment only when its content purpose justifies it. Centered layouts, split screens, cards and grids are tools, not a mandatory recipe.

Typography belongs to semantic roles. Font loading belongs to the client application boundary; do not import `preview/lab-fonts.ts` into a client website. Record source/license/subset/axis support and load only selected families. Never synthesize an entire font catalog or copy proprietary font binaries into the engine.

Reject a decorative shape with no relationship to the content. Reject a body section posing as a first-screen proposition. Reject an empty frame justified only by a future animation. Revise or replace close duplicates **before** presentation, and record the change. Neither an attractive font nor extra tooling counts as structural invention.

Before production promotion, replace study spans with real semantic links/buttons and destinations, implement promised keyboard/touch interactions, test content extremes and actual client media, inspect desktop/tablet/mobile and reduced motion, measure font/media/bundle cost, and obtain explicit creative approval. Concept QA and a passing build do not waive these gates.

## Reusable section contribution after Milestone 4A

Read [COMPOSITION_ARCHITECTURE.md](./COMPOSITION_ARCHITECTURE.md) before the next Astra campaign. Apply the existing anti-convergence and lifecycle gates to the new **Brand / About / Storytelling** collection. 4A establishes its contract without generating that collection.

1. Keep the creative study and disposition in its original workspace. Select a structure deliberately; production reuse must preserve its narrative and spatial DNA. Give the reusable implementation a separate registration with source concept provenance.
2. Add a strict content/media/structural schema in `composition/schemas.ts`. Use the shared image/link schemas when appropriate. Choose semantic h2/h3 hierarchy for body sections. A section receives client content, authored media, finite structural variants and supported creative layers; never calibration imports or arbitrary styling props.
3. Declare a `SectionContract` in `composition/catalog.ts`: schema identifiers, DNA, type roles/profiles, art directions, motion behavior, media treatments, allowed override keys, responsive reading order and accessibility responsibilities. Declare only implemented capabilities. Model a constraint as a capability requirement or a finite structure/motion exclusion, not a growing component pairing matrix.
4. Implement a separate component and add an exhaustive renderer case in `composition/render.tsx`. Register serializable composition metadata in the catalog with truthful lifecycle status. Keep the schema, capability metadata, registry configuration and renderer synchronized. Extend strict contract validation if a genuinely new capability is needed.
5. Add an individual Design Lab preview plus at least two substantially different Composition Lab examples, unrelated client content/media and long/short content checks. Implement an optional media schema only if the structure needs media. Reuse geometry/tone treatment; add masked/layered capabilities only when a selected mechanism proves a neutral reusable contract.
6. Test schema rejection, override scope, compatibility, reading order and neutral rendering. Inspect real desktop/tablet/mobile widths, keyboard/focus, reduced motion, contrast and media/font cost before the existing production promotion gate. Run the full tests, typecheck, lint and build.

Brand and icons inherit from site configuration. Page overrides replace typography/art/motion only. Section overrides are explicitly declared subsets of those three fields; structural variants and media treatments never rewrite the section's identity. Navigation/Hero singleton and ordering rules remain enforced; future Footer goes last. Repeated About/Storytelling sections may be registered without inventing recipes or site templates.

## Truthful capability controls (Collection 004)

Follow the [capability audit rules](./creative-collection-004/CAPABILITY_AUDIT.md). A selectable value must have a real implemented effect in that component's context; a change in specimen children alone does not establish mechanism support. Declare capabilities in registry metadata or the section contract, never a parallel UI support list. Describe intentionally fixed behavior, omit equivalent local choices, and use contextual reasons for incompatible choices. Preserve global creative-layer ownership. Motion declarations must distinguish behavior, effective intensity and OS reduced motion. Verify supported effects and invalid transitions in the rendered Lab as well as contract tests.

[The S01/S03/S06 shortlist](./creative-collection-004/CANDIDATES.md) demonstrates neutral source, strict schemas and source-study provenance. It is not human selection or lifecycle promotion. Existing advancement gates still apply.


## Contribution contract after Productionization 004–005

The next campaign is **Collection 006 — Services / Capabilities / Features**. Read [the completed pass and Astra handoff](./productionization-004-005/VERIFICATION.md). Do not generate page templates or other future systems as part of a section campaign.

- Keep the original study and its human disposition. Creative approval is required before implementation can become production inventory; existing approval is reusable, and held/rejected concepts stay in creative Review/history. `registry/creative-review.ts` is the canonical current ledger.
- Describe a real service/capability mechanism and its actual content relationships, finite item/text bounds and optional media. Reuse shared image and video contracts where appropriate. A new schema belongs to the mechanism, not to a universal title/subtitle/image/button payload.
- Declare `usage` explicitly: `section-oriented`, `page-capable` or `section-and-page-capable`. This advertises capability; it does not design a future page engine. Components remain independent of routes, customer data adapters and site nesting.
- Declare actual type roles/profiles, finite compatible art directions, motion behavior/intensity, content/media requirements, allowed overrides, reading order and accessibility responsibilities. Brand/icons inherit. An ineffective control must not be exposed.
- Declare real `compatibility.flow` behavior for inherited/dark surfaces, inset/full bleed, document/horizontal scrolling and sticky ownership. Current static bodies use `sticky: false`; introducing sticky mechanics requires a proven implementation and updated contract rather than copying that flag. Use capability-derived notices and incompatibility reasons, not bespoke pairing patches.
- Media delivery belongs to the host: intrinsic sizes, alt, focal/mobile sources, responsive candidates, loading policy, thumbnail budgets, transcripts and caption tracks. Nested media may live in its chapter/pair/spread contract without a meaningless global treatment menu.
- Preserve structural identity under unrelated brand/type/art directions. Add an individual renderer and two unlike mixed compositions with existing Navigation, Hero, Story and Work. Test content/media extremes and responsive crops, actual browser widths, keyboard/focus, reduced motion, contrast and asset/bundle cost. Retain evidence and run tests/typecheck/lint/build before lifecycle promotion.

These are implemented extension points for reusable sections. Page recipes, site trees, detail routes, commerce, overlays, page transitions, AI composition, Express generation and dedicated motion remain future phases.


## Human creative direction — 1 October 2026

The user wants sections and components to feel immersive and invite interaction: purposeful animation, compelling imagery, graphics, functional iconography and visual attraction should contribute to that experience. C03 and C10 are particularly favored references for image usage and animation potential. Carry this direction into future design and implementation while preserving meaningful relationships, keyboard/touch access and reduced-motion alternatives. It does not authorize a Motion Engine expansion or migration as part of an approval-recording task. Collection 006 is creatively approved; H09/H16 approval is explicitly reaffirmed, with their Composition migration reserved for another model.


## Current state after Productionization Pass 006 — 1 October 2026

All twelve human-approved Collection 006 concepts now have separate version-1 Production implementations and strict mechanism-specific content contracts. The inventory is 66 registrations / 30 Production implementations; Composition Lab has 59 QA combinations, including 24 Services sequences. Original studies and all human dispositions are retained.

Read [Pass 006 verification and Collection 007 handoff](./productionization-006/VERIFICATION.md) before the next campaign. Runtime schemas/contracts live in `composition/service-schemas.ts` and `service-contracts.ts`; implementations live in `sections/services/`. Metadata adds supported content types, finite item ranges, interaction capabilities and a general dense-neighbor transition notice. Client destinations/slugs do not impose routes; initial selections seed local state. Opt-in C03/C09/C10 media reveal reuses the existing primitive, now corrected to cancel its clip immediately under reduced motion.

The next creative collection is **Collection 007 — Commerce / Product Presentation**, focused on visual and interaction vocabulary. It has not been started. Service Detail pages, page recipes/grammars, nested architecture, commerce backend, dedicated motion expansion, overlays/transitions, AI composition and Express variants remain future phases. Scar remains excluded. Earlier milestone sections above are historical.


## Approved Hero follow-up — H09 / H16

The separately requested H09/H16 productionization is complete. `hero.object-study` and `hero.vertical-record` are independent Production v1.0.0 systems with typed client content and four mixed Composition QA sequences. Inventory: 68 registrations / 32 Production; Composition Lab: 63 combinations. Original calibration studies and human notes are preserved. Earlier deferral notes describe the preceding approval-only task. Read [the follow-up verification](./hero-productionization-h09-h16/VERIFICATION.md) for bounds, geometry, supported layers, optional reveal, evidence and current handoff. Collection 007 remains unstarted.

## Next creative session after Pass 007

Astra must read [CREATIVE_DIRECTION.md](CREATIVE_DIRECTION.md) before generating Collection 008. Preserve the canonical human dispositions and current Commerce implementations. Propose evidence mechanisms with truthful attribution, sources, timeframe and result context; avoid convergence on quote cards and logo strips. Apply the existing three-unrelated-adaptation, type diversity, anti-convergence, responsive, accessibility and human-selection gates. Approval is not automatic. Do not bundle future page recipes, commerce providers or Motion expansion into this creative collection.

## External production imports — 6 October 2026

Read [the external batch report](external-imports/REPORT.md) for the gallery, chorus, marquee Hero, process timeline and image sphere. External snippets are mechanism references. Audit overlap first; extend an existing system when the actual relationship is already present. Keep schema defaults backward-compatible, declare only implemented controls and route those controls through the shared Design/Composition visibility and preview systems.

A continuous visual surface supplies one canonical accessible reading surface. Repeat only visual inert copies, measure the full period including its final gap, suspend work offscreen and in hidden tabs, and support persistent pause, focus pause and motion-none/reduced-motion reading. Generic primitive styles belong in the primitive's scope rather than the first component family that used it.

A draggable visual needs named keyboard controls and a complete selection alternative. Measure its local container; update animation refs/DOM rather than React state every frame; keep the frame loop deterministic and clean up every observer/listener/frame. Native spotlight dialogs own containment, Escape and focus restoration. Separate inspection buttons from destination links.

Scroll-driven content declares sticky ownership truthfully, measures actual overflow and has a static reading alternative for narrow/short frames, oversized copy, keyboard focus and reduced motion. Sticky contracts require an implemented scroll behavior. Continue to declare optional section/item actions explicitly; stable Page/Section IDs and the shared CTA presentation/action editor are mandatory wherever destinations are supported.
