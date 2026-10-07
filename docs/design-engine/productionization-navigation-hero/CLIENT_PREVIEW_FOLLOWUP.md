# Overlay references, brand treatment and client adaptation

2 October 2026. Follow-up to the user's production review.

Full Scene HX01 and Scene Poster HX02 hide their separate top reference/provenance line when the Navigation occupies the overlay or floating layer. The line returns in normal flow; a standalone Hero retains it. Margin Rail hides it only when its mobile layout becomes top chrome. Headline, eyebrow, description, actions and lower captions remain visible. This is a shared Navigation/Hero relationship in Composition CSS, so Meridian and the other Navigations follow the same rule. The original Navigation study workspace uses the same visibility policy without deleting its reference content.

## Inspector controls

**Design Lab → Component → Client adaptation** is available for all 96 catalog components, including primitives, motion and icons. Choices reuse the component's existing client examples where available and identify the actual client/category rather than an ambiguous internal enum. Other components offer architecture, independent apparel and cybersecurity examples; the full-image Heroes also offer the existing performance ensemble. Choosing a client loads appropriate example content/media. Layout, supported behavior and the independent typography/art-direction controls remain authored separately.

**Design Lab → Component → Brand treatment** and **Composition Lab → Section → Brand treatment** are visible for all 15 Navigations. Treatments are Wordmark, Icon only, Icon + wordmark, Image logo and Plain text. The panel also exposes brand name, logo source and image dimensions where applicable. An example asset seeds graphic treatments; users can substitute client-owned assets. Data-URL implementation text is hidden behind a useful source-field placeholder. Changing the client example retains the selected treatment.

**Composition Lab → Section → Client adaptation** is available for every registered section. It loads strict content/media without changing the section's structure, motion, position, alignment, media treatment or creative overrides. The edited data is reflected in the section JSON. “Current client data” retains the current authored data rather than overwriting it with an unrelated preset. Replacing a registered structure still deliberately loads that structure's supported example/defaults.

The existing `content.logo` discriminated union is now also accepted by Primary, Island and Contents Navigation. This optional addition preserves existing payloads. All Navigations share BrandMark's accessible symbol/text rendering and source-specific error recovery; broken assets fall back to brand text and a later valid asset recovers. Production code imports no client fixture, study asset or runtime schema parser through that component.

Client examples remain in the preview boundary. The shared adaptation bridge preserves each component's native factory and semantic content rather than flattening the engine into a single generic schema. Comparison apparel examples use two landscape assets with matching registration geometry. Assembly examples retain the mechanism while providing relevant component labels for the selected client context. Existing creative workspaces and their client pickers remain intact.

## Hover and focus previews — follow-up

Every customizable inspector choice in the normal Design and Composition workspaces uses the shared hover/focus preview control, including the new client adaptations and Navigation brand treatments. Design Lab presets, structural/configuration fields, themes and independent creative layers now use it too. Creative Calibration controls and both viewport pickers also support previews. Hover/focus auditions; click or Enter applies. Pointer leave, Escape, outside interaction and component/tab changes restore the current design. Unsupported options remain focusable with an explanation and cannot preview or apply.

Brand name, logo source and image dimensions use free-form draft previews with explicit Apply buttons (or Enter). Editing or dismissing a draft does not silently change authored data. `CapabilityControl` now requires an `onPreview` callback, and the [component contribution contract](../COMPONENT_CONTRIBUTION.md) makes hover/focus previews mandatory for future inspector customization.

A separate non-interactive preview canvas keeps the authored component/composition mounted. This prevents a temporary structural or client preview from resetting range positions, menu state or other existing interactions. Temporary preview content is inert; applying returns to the live design. Composition's serialized content/media stays unchanged throughout an audition.

Verified with **515 hover/focus browser checks**, including unrelated client examples across all **96 catalog components**, all five treatments on **15 Navigations**, pointer-leave/Escape rollback, keyboard commit, outside dismissal, brand drafts, presets, creative layers, tab changes, Composition JSON preservation, reduced motion and an open-picker accessibility audit. Additional focused regressions cover viewport rollback, disabled-option activation and stale previews on component changes. See [hover evidence](evidence/client-hover.json), [focused evidence](evidence/client-hover-focused.json) and [preview screenshot](evidence/client-hover-composition.png). The **842-test suite**, typecheck, lint, production build, **183 client/brand/responsive checks** and nine Navigation/Hero Lab workflow checks also pass. Current gate logs use the `client-hover-` prefix.

## Client/brand implementation verification

- **842 tests across 64 files pass.** The new 182-case regression group checks every catalog entry's effective client previews, all declared section examples with structure/behavior preservation, and all five logo treatments across all 15 Navigations.
- **Typecheck, lint and optimized production build pass.** Logs are saved with the `client-preview-` prefix in [evidence](evidence/).
- **183 editor/responsive browser checks pass**, covering client selection for all 96 catalog entries, 75 Navigation treatment cases, treatment retention on client changes, both Labs, and HX01/HX02 reference visibility under flow/overlay at desktop/mobile. No unexpected runtime, console or missing-resource errors remain. See [client-preview.json](evidence/client-preview.json).
- The production matrix was rerun: **552 layouts, 25 keyboard/menu checks, 45 accessibility audits, 48 scroll/reduced-motion checks**, with zero failures. The **105 edge/content/media/touch checks** also pass, including broken-logo recovery. Results remain in the standard evidence JSON files.
- Current isolated Datum bundle: **37,265 minified bytes / 13,288 gzip bytes**, including React/shared primitives, with no schema parser, preview or study imports. See [performance evidence](evidence/client-preview-performance.json).

Screenshots: [Meridian overlay and Design inspector](evidence/client-preview-meridian-overlay.png), [Composition client and brand controls](evidence/client-preview-composition.png).

Browser verification uses actual production components/source Lab editors in the disposable loopback harness and emulated mobile touch. The staff-gated Next routes compile in the production build. No public QA route, authentication change, dependency, deployment, Collection 008, route-generation or client automation was added.
