# Compact Comparison and full-viewport Hero expansion

> **Current status:** the owner explicitly approved H12/HX01/HX02 in the Productionization brief on 2 October 2026. Production v1.0.0 and current contracts are documented in [Navigation/Hero productionization](../productionization-navigation-hero/CAPABILITIES.md). The proposal and initial verification below remain historical creative references.

2 October 2026. Requested refinement to H12 plus two new Lab proposals. **HX01 and HX02 await creative review; no production approval is inferred.** Open `/admin/lab` → Design → **Hero Expansion**. The new proposals are also available in Collection 003B’s Hero selector.

## Comparison refinement

The existing reusable Comparison Hero now uses a **22rem maximum context panel**, down from 48rem / 75% width. Smaller headline/body type, restrained gaps, compact step/reset controls, and the preserved native slider expose much more of the image. The current desktop fixture covers about 10% of the Hero with the context panel. All controls keep usable targets and accessible names.

`contentAlignment` accepts `left`, `center`, or `right`; omitted values preserve left placement. It is independent of the comparison seam and does not reset the slider. Alignment is exposed in Component catalog, Composition’s section inspector, Hero Expansion, and the Navigation Expansion inspector. Existing section payloads remain valid. The matched image crop, range keyboard behavior, step/reset and CTA remain intact. Mobile keeps the image behind the small panel rather than moving it into a separate strip.

![Compact Comparison, centered](evidence/comparison-center.png)

## Two proposals, different reading structures

| Study | Content relationship | Default presence | Alternate behavior |
|---|---|---|---|
| HX01 · Full Scene | One title/context/action group floats over a continuous photograph; provenance sits at the scene edges. | Subtle, compact introduction, left/middle. | Loud title; all nine placements. |
| HX02 · Scene Poster | The headline owns an independent field; a bottom register holds caption, explanation and action, separated by the exposed image. | Loud poster, independent context band. | Subtle title; all nine headline placements, matching context text alignment. |

Both support left/center/right × top/middle/bottom, subtle/loud type, light text with a darkened image or dark text with a softened image, three content adaptations, and long-copy inspection. The image covers at least the viewport; text remains layered above it, not in an opaque content card. Long copy may extend the scene rather than clip. The Lab’s 850px scrollable artboard supplies its own scene height; the proposal outside the Lab defaults to `100svh`.

Native links lead to the next section. No automatic animation or scroll interception is used. Desktop/mobile focal points remain authored image data. Check new client imagery for subject placement and text contrast; fixture checks do not guarantee every possible client photograph.

![HX01 Full Scene](evidence/full-scene-0.png)
![HX02 Scene Poster](evidence/scene-poster-1.png)

## Independent adaptations and media

Architecture uses the existing generated coastal residence asset with Luxury/Gallery for Full Scene and Geometric/Gallery for Poster. Independent apparel uses the existing generated fashion campaign with Fashion/Runway and Poster/Runway. Performance uses the existing generated stage performer with Humanist/Billboard and Brutalist/Billboard. These retain the same content relationships under different display/body type, crop, copy and cultural context. Fonts reuse the existing locally licensed catalog. No new remote media or font dependency.

The image is cover-cropped with desktop/mobile focal points and intrinsic dimensions. Image delivery remains at the host boundary. Navigation previews use their own existing adaptation media/copy, including the clearly illustrative security diagram. No factual client outcomes, endorsements, or commissions are claimed.

## Comparison with existing Heroes

| Closest existing mechanism | Distinction |
|---|---|
| H12 Comparison | Visitor-controlled registered image pair with a compact opaque controller. HX01/HX02 expose one continuous photograph and have no comparison control. |
| H09 Object Study | Contained portrait object with context arranged around it. New studies cover the full viewport with the scene behind the text. |
| H16 Vertical Record | Central image spine and dated sequence. New studies have no record timeline; text overlays a full field. |
| H17 Front Page | Masthead, unequal editorial columns and bounded image. New studies have no masthead page grid or separate image column. |
| H18 Open Circuit | Authored signal data and shared baseline. New studies use photographic atmosphere rather than a data proposition. |
| H22 Between Acts | Typographic bookends interrupt a narrow image ribbon. New studies keep the image continuous from edge to edge. |
| H24 Assembly | Authored exploded parts carry the explanation. New studies present a whole scene with title/context above it. |
| Statement | Text-first opening without a photographic mechanism. The new studies require a full image and a deliberate over-image reading area. |
| HX01 versus HX02 | Grouped introduction versus separate headline/context register; compact reading measure versus broad poster field; quieter continuous rhythm versus top-to-bottom reading distance. Both expose type-size choices, so font size alone does not establish their difference. |

The predictable image-card/split-column answer was excluded because the owner explicitly asked for viewport-filling imagery. The new studies do not invent a special mask, ornamental media frame, or motion effect to claim novelty. Human visual judgment remains authoritative.

## Verification

- **549 unit tests / 62 files passed**, including backward-compatible Comparison parsing, invalid alignment rejection, and separation of new proposals from production inventory.
- Typecheck, ESLint and production build passed.
- **327 scene checks:** 324 combinations across two proposals, three adaptations, three artboards, two voices and nine positions; two 320px long-copy stress cases; one reduced-motion/native-link check.
- **13 Comparison checks:** four widths × three alignments, plus keyboard range, alignment state retention, step and reset.
- Final measured Comparison bounds: panel fully within the artboard; Hero height matches the 850px review viewport.
- **Seven axe audits** across the six default adaptations and Comparison: no automated WCAG A/AA findings. This is scoped automated verification, not certification.
- **Eight navigation pairings:** the two new Heroes with Datum, Pocket Dock, Atlas Hall and Margin Rail. Hero-centric transparency/solidification and horizontal bounds passed.
- No browser runtime errors. Visually inspected in the authenticated Lab as well as the loopback QA harness.

Evidence lives in `evidence/`; the repeatable browser suite is `scripts/design-engine-hero-expansion-qa.mjs`, using the existing navigation QA bundle. No public QA route, auth/database change, deployment, production promotion, or Collection 008 work.
