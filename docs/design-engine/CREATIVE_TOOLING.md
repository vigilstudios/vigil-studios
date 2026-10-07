# Creative tooling for the Professional Design Engine

> **Professional production integration — 6 October 2026:** purchase identity, scoped project composition, client context/media, database persistence and repository/runtime/preview integration are implemented. Launch gate is **PARTIAL**, pending application release and real Stripe-test/GitHub/Vercel end-to-end verification. See [production pipeline and exact boundaries](../professional/PRODUCTION_PIPELINE.md). Collection 009, full Motion/recipes/transition/detail systems, AI composition, Creator Express templates and Scar remain deferred.

> **Current state — Productionization Pass 008, 5 October 2026:** all twelve E01–E12 designs are human-approved and Production v1.0.0. Inventory: 108 registrations / 73 Production; 127 Composition QA fixtures. Evidence models stay independent, with publication-source contracts and explicit illustrative Lab data. E06 retains a measured seamless loop with expanded typed visual/motion configuration and a complete accessible still view. Read [Pass 008 verification](productionization-008/VERIFICATION.md), [evidence contracts](productionization-008/EVIDENCE_CONTRACT.md), and [concise Collection 009 handoff](ASTRA_CREATIVE_CONTEXT.md). Collection 009 has not been generated. All older status notices below are historical.

> **Collection 008 creative review — 5 October 2026:** twelve Social Proof / Results studies and 36 unrelated adaptations are available in Design Lab, with evidence-specific demo/client-supplied/verified contracts, eight production composition contexts and a five-concept shortlist. All await human review; no Collection 008 registration or production promotion. Existing inventory remains 96 registrations / 61 Production. Read [the collection report](creative-collection-008/README.md) and [verification](creative-collection-008/VERIFICATION.md). Earlier “not begun” statements below are historical.

> **Current Navigation/Hero productionization — 2 October 2026:** NX01–NX12, modified H12, HX01 and HX02 are Production v1.0.0. The 96-entry inventory includes 61 Production systems; Composition retains its original fixtures and adds twelve Navigation/Hero checks (103 total). Read [capabilities and safe-area contracts](productionization-navigation-hero/CAPABILITIES.md), [audit](productionization-navigation-hero/AUDIT.md), and [current verification](productionization-navigation-hero/VERIFICATION.md). Creative reference workspaces are preserved. Collection 008 has not begun.

> **Current state — Productionization Pass 007, 1 October 2026:** all fourteen human-approved Commerce / Product concepts have independent Production v1.0.0 implementations. Inventory: 82 registrations / 46 Production; 91 Composition QA combinations. Read [Pass 007 verification](productionization-007/VERIFICATION.md), [commerce contract](productionization-007/COMMERCE_CONTRACT.md), and [creative principles](CREATIVE_DIRECTION.md). Older collection handoffs below are historical. Next: Collection 008 — Social Proof / Testimonials / Results; it has not been generated.

Lab workflow update: Composition starts blank; Layout styles preview on hover/focus and add on click; Clear canvas requires a modal confirmation; shared Editor canvases support pinch and Ctrl/Cmd-wheel zoom. See [workflow verification](lab-workflow/VERIFICATION.md).

All component customization in the normal Lab inspectors must offer hover and keyboard-focus previews, including client adaptation. Only click, Enter or Apply changes authored data; dismissal restores the live design and its interaction state. Shared `CapabilityControl` requires a preview callback. See [current client/brand hover verification](productionization-navigation-hero/CLIENT_PREVIEW_FOLLOWUP.md) and [contribution rules](COMPONENT_CONTRIBUTION.md).

Verified 30 September 2026. Tools support creative judgment; they do not confer approval on generated output. Scar remains excluded.

## Discovery performed

Inspected the available skill catalog, the plugin-management skill and live plugin search for Figma / typography / fonts / accessibility. Also inspected callable MCP capabilities rather than trusting installation labels alone. Figma was shown as not locally installed by plugin search but its MCP was callable and successfully read the existing design file. Adobe Fonts search also worked. Installing a second copy would be redundant, so no new connector or paid service was installed or activated.

The capability added to this repository is a verified, licensed local font catalog, independent profile controls, responsive comparison surfaces and contrast/font-provenance checks. There is no invented Google Fonts MCP, Fontsource MCP or automatic Figma ingestion service.

| Tool / resource | Purpose and when Astra/Codex should use it | Status / requirement | Licensing / limits |
| --- | --- | --- | --- |
| Figma MCP + Figma skill | Read existing frames, inspect actual type styles, compare composition, preserve original approvals. Use before interpreting a Figma-based prior milestone. | Available and verified against Calibration 002; required when a source Figma file governs the work. | File access does not grant rights to redistribute embedded fonts or third-party artwork. New Batch 003 is in the Lab; original Figma remains unchanged. |
| Adobe Fonts skill + Creative Cloud font search | Discover real foundry families, metadata, pairing candidates and specimens for clients with a suitable Adobe workflow. | Optional; verified search returned Acumin Pro Regular/Medium, Robert Slimbach / Adobe Originals. No activation performed. | Search results are not a self-hosting license. Use a client-authorized web project/kit or separately licensed files; never copy Adobe binaries into the engine. [Verified family](https://fonts.adobe.com/fonts/acumin). |
| Fontsource official npm packages | Source inspectable WOFF2 files, axis metadata and bundled license text. Use for selected open-source client fonts and internal comparison. | Added ten local Lab font families, package versions/integrity and binary SHA-256 recorded. No runtime font CDN dependency. | Each imported family includes its SIL OFL license and metadata. Current files are Latin subsets; verify language coverage before client use. |
| Google Fonts / `next/font/google` | Optional open-source discovery and build-time loading for a client repository selecting a small family set. | Supported architectural path; not a newly installed integration and not used as a runtime remote font service here. | Verify each family's license and subset/axis coverage. Do not import an entire catalog into a client layout. |
| Local `next/font/local` | App-boundary loading of approved local or client-licensed fonts, fallback adjustment and CSS variables. | Required for this Lab's font fixtures. Documented in installed Next 16 docs and checked via Context7. | Client must supply web rights for proprietary files. Keep them in that client's project. Source paths must be static for the Next compiler. |
| Context7 CLI / find-docs skill | Resolve current library documentation before Next/font, motion or framework-specific changes. | Available and verified. Required by repository instructions. | No credentials or private client content in documentation queries. |
| Browser computer-use / responsive viewport | Inspect actual rendered type, crops, overflow, control independence, keyboard input and desktop/tablet/mobile behavior. | Available and used; required before review. | Local authenticated Lab stays behind existing admin authorization. Screenshots are evidence, not proof of all accessibility behavior. |
| Vitest contrast + font provenance contracts | Check foreground/accent pairs against study backgrounds, hashed font files/licenses, profile independence, motion-none readability and concept inventory separation. | Added locally; required regression checks. | Palette checks do not replace image-overlay, focus, browser or screen-reader review for production. |
| Existing Framer Motion engine | Prototype a purposeful reveal, comparison or pointer/scroll behavior after the static composition works. | Already installed. Extended with scoped none/restrained/expressive policy; no new motion package. | Respect reduced motion; optional effects cannot hide essential information. No Scar animation extraction. |
| Primary studio/type references | Study actual editorial hierarchy, identity systems and digital art direction from source work; document the principle learned rather than copying a brand. | Optional research step; use official project/foundry pages. Existing collection references remain in their source docs. | Reference is not permission to copy logos, photography, fonts or a complete composition. Avoid collecting large galleries without a design question. |
| axe-core / browser accessibility extension | Recommended optional complement when an approved interactive component proceeds to production: automated semantics/contrast findings followed by keyboard and screen-reader review. | Recommended, not installed or claimed as run. No additional dependency needed for this static concept round. | Automated checks do not establish full conformance. |

## Verified font resources

[Fontsource Next.js guide](https://fontsource.org/docs/guides/nextjs), [variable font guide](https://fontsource.org/docs/getting-started/variable), and [installation guide](https://fontsource.org/docs/getting-started/install) were consulted. Exact source artifacts are documented in `design-engine/preview/fonts/manifest.json`, with a LICENSE and metadata file alongside every family. See [TYPOGRAPHY_AND_ART_DIRECTION.md](./TYPOGRAPHY_AND_ART_DIRECTION.md) for loading boundaries and usage.

## Use order

Read the client's source and feedback → inspect actual typography and composition → choose a small set of intentionally different mechanisms and type relationships → verify font rights/axes → compare still frames in the Lab → test meaningful interaction and responsive behavior → curate → obtain creative selection → implement only selected mechanisms through the existing lifecycle.

Do not add tools merely to increase the inventory. Add a connector only when a real missing capability justifies its access and cost. Do not claim installation, font licensing, accessibility certification or integration functionality without evidence.

## Composition handoff for future Astra campaigns

Read [COMPOSITION_ARCHITECTURE.md](./COMPOSITION_ARCHITECTURE.md) and the reusable section contribution rules before proposing the next Brand / About / Storytelling collection. The desktop-only `/admin/lab` has Design and Composition workspaces: Design preserves individual concepts, including Batch 003; Composition checks selected implementations together. Both use the fixed right inspector so changes can be inspected beside the canvas. Typography, art direction, brand, icons and motion are independent layers with controlled inheritance. Each section declares its supported layers, structural variants, media treatments and compatibility requirements. Campaigns must demonstrate structural diversity and unrelated client adaptations within those capabilities, not rely on unrestricted overrides or assume every concept becomes inventory. No additional creative collection was generated in 4A.

## Collection 004 review surface

Design → **Collection 004 · Brand / Story** preserves eight independently authored studies, with eight typography profiles, three imagined briefs each, fixed motion none, rationale and an eight-study comparison. Their separate experimental S01/S03/S06 implementations are in Component catalog, with content lengths and capability-driven controls. Composition fixtures **004 F–K** show each under two different existing Navigation/Hero systems. See the [review dossier](./creative-collection-004/README.md), including visual revisions, qualitative all-pair comparison and media provenance. No numeric creative-diversity score or human approval is claimed.

## Collection 005 review surface

Design → **Collection 005 · Media / Work** contains twelve studies, three client adaptations each, contract/review inspector tabs and an inert overview with individual inspect buttons. Fonts reuse the existing licensed local catalog. Image assets are existing repository study imagery and isolated photo bytes from Express fixtures, with provenance recorded in the [asset notes](./creative-collection-005/ASSET_NOTES.md). No Express layout, Scar source or new font dependency was imported. Motion proposals remain documented; current interactions work with motion none.


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

## Collection 007 review surface — 1 October 2026

Design → **Collection 007 · Commerce / Product** contains fourteen studies and 42 streetwear/skincare/audio adaptations. Existing local typography, art directions, brand tokens, media schemas and functional icons are reused. The built-in imagegen tool supplied six studio photographs and six reference-based detail edits; four existing generated apparel photographs were retained. Assets, prompts and source relationships are documented in the [Collection 007 dossier](./creative-collection-007/README.md).

No production contract widening, registry promotion, backend adapter, full page system or dedicated Motion expansion occurred. All fourteen concepts passed human review on 1 October 2026 (`collection007Review`). P08’s close-up detail imagery is favored as media guidance, not a foundation change. Productionization is reserved for the user’s next pass. Earlier “unstarted” notes above describe historical milestones. The current registry is still 68 / 32 Production.
