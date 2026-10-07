# Milestone 4A — Production composition architecture

> **Current Page & Site foundation — 5 October 2026:** Composition now edits a portable version-1 Site Definition with stable page identities, nested hierarchy, independent page compositions, typed page/section actions and derived Navigation. Global Navigation/Footer slots have explicit inheritance/omit/replacement. Existing inventory and Design studies are retained; Collection 009 remains unstarted. Read [Page architecture](PAGE_ARCHITECTURE.md) and [verification](page-architecture/VERIFICATION.md). Earlier single-page/deferred-architecture descriptions below are historical.


> **Current Navigation/Hero productionization — 2 October 2026:** NX01–NX12, modified H12, HX01 and HX02 are Production v1.0.0. The 96-entry inventory includes 61 Production systems; Composition retains its original fixtures and adds twelve Navigation/Hero checks (103 total). Read [capabilities and safe-area contracts](productionization-navigation-hero/CAPABILITIES.md), [audit](productionization-navigation-hero/AUDIT.md), and [current verification](productionization-navigation-hero/VERIFICATION.md). Creative reference workspaces are preserved. Collection 008 has not begun.

> **Current state — Productionization Pass 007, 1 October 2026:** all fourteen human-approved Commerce / Product concepts have independent Production v1.0.0 implementations. Inventory: 82 registrations / 46 Production; 91 Composition QA combinations. Read [Pass 007 verification](productionization-007/VERIFICATION.md), [commerce contract](productionization-007/COMMERCE_CONTRACT.md), and [creative principles](CREATIVE_DIRECTION.md). Older collection handoffs below are historical. Next: Collection 008 — Social Proof / Testimonials / Results; it has not been generated.

30 September 2026. This contract governs reusable implementations, independently of the preserved creative studies. Composition Lab is an internal QA tool, not a page builder, template catalog, recipe system or AI generator.

## Layers and ownership

| Layer | Site | Page | Section |
| --- | --- | --- | --- |
| Brand | Theme baseline plus semantic color overrides | Inherit | Inherit; no arbitrary local palette |
| Typography | Explicit role profile; app owns selected licensed font bindings | Optional profile replacement | Optional replacement only when declared |
| Art direction | Explicit spatial/action tendency | Optional replacement | Optional replacement within supported directions |
| Icons | Functional pack and stroke; client pack implementation at app boundary | Inherit | Inherit |
| Motion language | none / restrained / expressive | Optional intensity replacement | Optional intensity replacement when declared; behavior selected from section capability |
| Section structure | No global layout solver | Ordered section instances | Named structural variant; DNA remains fixed |
| Media treatment | No universal crop/filter | No universal crop/filter | Declared geometry and tone, authored focal points and accessible source data |
| Content | Client data | Page-specific data | Validated section-specific schema |

Precedence is site → explicit page replacement → supported section replacement. Brand and icons remain site-owned. Fonts are runtime bindings, never serialized assets. Legacy `DesignThemeProvider` remains supported for individual asset inspection; composition uses a narrower contract so old spacing/type tokens cannot compete with independent profiles. Unsupported fields, combinations and behaviors fail validation rather than silently falling back. Motion intensity never enables a behavior a section does not implement; none and OS reduced motion always yield a complete resting composition.

## Section contract

Every composable registration declares its content/media schema identifiers, structural variants, supported typography and roles, art directions, motion behaviors, section override keys, media geometry/tone capabilities, compatibility capabilities/constraints, responsive reading order and accessibility responsibilities. Schemas are executable and strict; registry metadata stays serializable. Instances have a unique DOM identifier, registered component ID, content, media where required, structural selection, motion behavior and optional declared creative overrides.

The renderer validates before rendering. Navigation must come first and at most once, Hero must be the first content section and at most once; a page may omit either. Footer, when contributed later, must come last. Existing Feature List is the representative body section. No Footer exists in the engine yet; this milestone does not generate one. Repeated body sections are allowed with unique identifiers. Hero headings use h1; body sections use h2/h3. Preview uses a named region within the existing admin main landmark; portable page rendering can emit main at the application boundary.

## Controlled recombination

H17 retains masthead, unequal headline/scene/abstract spread and mobile reading order. H18 retains one signal plot, aligned readout and proposition; data includes source and an explicit illustrative flag. H22 retains two typographic bookends and interrupted media ribbon. H24 retains a promise beside an exploded assembly with client-authored part labels/specifications. H12 supplies a matched-image comparison and explicit range/reset/step controls. Neither typography nor art direction replaces these structures.

N01 retains an opaque, rounded floating island with a nonmodal anchored disclosure. N02 retains a numbered contents sheet, implemented as a native modal dialog with focus containment, Escape, inert background and focus restoration. Existing Primary Navigation remains available. N03/N04 are approved creative directions but are deferred: media-aware settling and hierarchical drill-down deserve their own interaction QA, not cosmetic variants of these two implementations. Earlier held/rejected Hero decisions remain authoritative. Selected Batch 003 implementations are new registrations; original studies are unchanged. Implementation readiness and creative approval are separate from the registry's production evidence gate.

## Compatibility

Use capabilities and constraints, not a pairing table. Navigation declares in-flow/overlay support and surface coverage. An overlay needs an immediately following Hero with an authored safe zone and compatible surface. Opaque N01 can cover dark/light media safely; Primary/N02 stay in flow. H12 reserves an overlay zone; H17/H18/H22/H24 do not. Media treatments apply only to image-capable sections. Typography/art/motion choices must be declared. Structure-specific motion exclusions remain in the contract, ready for future variants. Invalid previews show actionable diagnostics and are blocked; unsupported values are never coerced.

## Media

Geometry and tone are separate. Shared image treatment supports full-bleed, contained, framed, panorama, portrait-emphasis and editorial-crop; tone supports natural, monochrome and high-contrast. Authored desktop/mobile focal points and optional mobile source are portable. Intrinsic dimensions plus reserved ratios reduce layout shift. Panorama becomes a taller image on mobile. Caption stays outside filters. No client asset or palette belongs in the implementation. Masked and layered arrangements are deferred until a selected structure demonstrates a clean general contract; arbitrary masks are not added for inventory size.

## Workflow and next campaign

Open the single staff-only **Lab** entry at `/admin/lab` in a desktop window at least 1024px wide. Switch between **Design** (individual mechanisms, historical concepts, Calibration 003 and Batch 003) and **Composition** (ordered registered implementations). Both workspaces retain edits while switching. Existing `/admin/design-lab` and `/admin/composition-lab` bookmarks redirect to the corresponding workspace. Below desktop width the navigation entry is hidden and the editor is unavailable.

The fixed viewport editor has a right Editor panel with independent scrolling, a draggable 260–560px width, keyboard resize, hide/show, and compact/comfortable/large controls. Canvas zoom scales the display without changing the authored artboard width. Pinch over the canvas or use Ctrl/Cmd + mouse wheel to zoom around the pointer; ordinary wheel/trackpad scrolling still pans. The zoom selector remains available for precise values. Desktop/tablet/mobile artboards test client sections inside the desktop Lab; they do not make the Lab a mobile editor. In Composition, click a section in **Select on canvas** mode or choose it in the Editor panel to edit it beside its preview. **Find in preview** scrolls the canvas to it; **Interact with preview** allows navigation menus and section interactions. Section settings stay in the right Editor panel, never beneath the page. Use Layout for order and inventory, Page for this page’s overrides, Site for shared global defaults, and QA for compatibility diagnostics. Design uses Component, Catalog, Layers and Metadata groups; historical studies keep their study controls and rationale in the Editor panel.

Composition starts with a blank canvas. Demo compositions remain optional starting points. In Layout, choose a section type and hover or keyboard-focus a style to preview its exact insertion; leaving the list or pressing Escape discards the preview. Click, Enter/Space or touch adds it immediately, with no extra Add button. Newly chosen styles receive supported local typography/art-direction overrides where inherited layers are incompatible; page/site settings are preserved. Duplicate landmarks, overlay constraints and the 20-section limit remain enforced, with reasons shown on unavailable choices. Clear canvas opens a native modal confirmation; Cancel/Escape preserve edits, while confirmation resets all sections and page/site layers to blank defaults. Empty compositions are valid drafts. Section editor choices also preview on hover/focus and apply on explicit activation, including replacements, typography, art direction, structure, media and supported navigation/motion choices. Escape, outside dismissal, section/tab changes and leaving the options discard the audition. Saved composition JSON and neighboring sections stay unchanged during preview. See [section edit verification](lab-edit-preview/VERIFICATION.md). Page precedes Site in the tab order. Site and Page layers, brand themes, icon stroke, semantic color swatches/custom drafts and clearing colors all use hover/focus audition and explicit application. Drafted content/media can also be auditioned through the Apply action. Site → Page → Section precedence remains intact during previews. See [global preview verification](lab-global-preview/VERIFICATION.md).

Choose independent site layers, optional page overrides, order sections, use supported section overrides, replace fixture content/media, inspect compatibility and compare desktop/tablet/mobile plus motion none. Five intentionally different QA fixtures are tests, not site templates: editorial H17/N02, technical H18/Primary, fashion H22/N01, poster H24/N01 and overlay H12/N01. Runtime client projects import reusable mechanisms and their own content/fonts, never Lab fixtures or calibration assets. New selected entries remain `review`; existing dispositions and production evidence requirements remain intact.

Import `design-engine/styles.css` and `design-engine/composition/styles.css` at the client app boundary. Pass a validated `PageComposition`, selected `FontBindings` and optional compatible client icon pack to `CompositionPreview`. Use `embedded={false}` when this renderer owns the page's main landmark; keep the default named region when a host already owns main. Each section receives its own resolved provider, so a section override cannot leak into siblings. The host controls routes, safe link destinations, licensed assets, delivery optimization and final contrast review.

The frame presets exercise container queries. An actual browser viewport is still required for native dialogs, mobile image source selection and final responsive QA. H12 keeps a separate mobile scene above opaque comparison controls; H24 annotations stay centered inside their authored planes. Reordering and additions are bounded to registered sections and strict content/media JSON, with no arbitrary CSS or token escape hatch.

The next **Brand / About / Storytelling** campaign must propose a distinct narrative structure; declare content/source/media requirements, semantic h2 hierarchy, reading order, finite structural variants, supported role profiles/art directions/motion/media treatments and override keys; provide unrelated brand adaptations and content extremes; retain creative disposition; implement strict schemas, register metadata and renderer, add individual preview plus at least two unlike compositions and compatibility tests; verify responsive, keyboard, focus, reduced motion, asset cost and neutrality before promotion. No collection for that category is generated in 4A.

## Collection 004 extension

Three `story.*` body schemas/implementations and six internal test combinations are documented in [Collection 004 candidates](./creative-collection-004/CANDIDATES.md). They remain experimental and have no production approval. They consume strict client content, semantic h2/h3 hierarchy and only declared overrides.

Contracts now include `artBehavior`, `motionIntensities` and optional structural `artDirectionChoices`. These describe actual consumed behavior, fixed invariants and duplicate local choices. Site/page art remains independent; local ineffective overrides are diagnosed. `sectionChoiceReason` derives disabled choices from strict schema/compatibility validation, including neighboring overlay constraints. `transitionSection` explicitly clears local intensity when behavior becomes none and announces the reset; structure changes preserve valid authored data while restarting interactive state. Imported compositions always pass through the runtime validator.


## Productionization Pass 004–005

The current implementation and verification are documented in [Productionization 004–005](./productionization-004-005/VERIFICATION.md). Six approved Story and eleven approved Work concepts now have separate version-1 Production implementations with strict structure-specific contracts, authored media relationships, page-usage metadata, controlled typography/art overrides, transition notices and 22 additional mixed QA compositions. Original studies and human dispositions remain available. The review ledger is canonical in `registry/creative-review.ts`, re-exported by the original study modules; promotion checks its approval plus the established lifecycle evidence gate.

Usage and flow metadata prepare later composition while keeping route ownership at the client boundary. No future page/detail/commerce/overlay/motion/AI/Express system was implemented. The next creative family is **Collection 006 — Services / Capabilities / Features**; follow the dossier's handoff contract and contribution rules. Earlier verification sections in this document are historical milestones.

M13 was subsequently explicitly approved and added as `work.viewport-gallery` (page-capable), bringing the current inventory to 54 registrations / 18 Production implementations and 24 mixed QA compositions. See [M13 production contract and verification](./productionization-004-005/M13_PRODUCTION.md).


## Current state after Productionization Pass 006 — 1 October 2026

All twelve human-approved Collection 006 concepts now have separate version-1 Production implementations and strict mechanism-specific content contracts. The inventory is 66 registrations / 30 Production implementations; Composition Lab has 59 QA combinations, including 24 Services sequences. Original studies and all human dispositions are retained.

Read [Pass 006 verification and Collection 007 handoff](./productionization-006/VERIFICATION.md) before the next campaign. Runtime schemas/contracts live in `composition/service-schemas.ts` and `service-contracts.ts`; implementations live in `sections/services/`. Metadata adds supported content types, finite item ranges, interaction capabilities and a general dense-neighbor transition notice. Client destinations/slugs do not impose routes; initial selections seed local state. Opt-in C03/C09/C10 media reveal reuses the existing primitive, now corrected to cancel its clip immediately under reduced motion.

The next creative collection is **Collection 007 — Commerce / Product Presentation**, focused on visual and interaction vocabulary. It has not been started. Service Detail pages, page recipes/grammars, nested architecture, commerce backend, dedicated motion expansion, overlays/transitions, AI composition and Express variants remain future phases. Scar remains excluded. Earlier milestone sections above are historical.


## Approved Hero follow-up — H09 / H16

The separately requested H09/H16 productionization is complete. `hero.object-study` and `hero.vertical-record` are independent Production v1.0.0 systems with typed client content and four mixed Composition QA sequences. Inventory: 68 registrations / 32 Production; Composition Lab: 63 combinations. Original calibration studies and human notes are preserved. Earlier deferral notes describe the preceding approval-only task. Read [the follow-up verification](./hero-productionization-h09-h16/VERIFICATION.md) for bounds, geometry, supported layers, optional reveal, evidence and current handoff. Collection 007 remains unstarted.
