# Urban apparel adaptation — 2026-09-30

The fourth Lab client, **CONCRETE / ATHLETICS**, tests all twelve M01–M12 studies with streetwear and gymwear. It is now selected by default. Existing adaptations remain available. No production inventory promotion.

## Visual direction

Four AI-generated faceless, neck-down apparel photos: two urban location shots and two solid studio backgrounds (gray streetwear / off-white training apparel). Full garment silhouettes remain visible. Heavy sans, condensed poster and technical type profiles are authored per concept, with a concrete/charcoal/olive palette and short campaign copy.

M02 and M10 preserve portrait garments inside their image bands, with landscape bands matching the photograph proportions. M08 uses contained principal plates for this adaptation after the first browser review exposed a shoulder crop. Other clients retain their existing image treatment.

## Verification

- All 12 urban concepts rendered at 1440px, 768px, and 390px artboard widths: 36 checks, no horizontal section overflow or invalid-content state. These are responsive artboards in the desktop Lab, not physical-device tests.
- Browser interactions verified: M01 keyboard disclosure; M03 project selection; M04 frame selection; M05 next frame; M06 horizontal next-scene scroll/focus; M08 street/training spread navigation; M09 paired-image selection; M11 Training filter and Motion playback; M12 left-well assignment.
- Updated six-second faceless reel reached its end, readyState 4, no video error, no autoplay.
- M08 crop correction rechecked at tablet and phone widths: contained full garment, no overflow.
- Typecheck, scoped ESLint, and all four media contract tests passed. Existing contract tests now render all 48 client/concept combinations.
- Screenshot samples inspected for M07 desktop, M10 mobile, M08 desktop/mobile and the training spread. Image loading remains lazy; raw initial snapshots include unloaded hidden/below-fold images, not necessarily failures. All four active sources were subsequently rendered through the interactive views.

[Layout measurements](urban-review/layout-checks.json) · [Interaction observations](urban-review/interaction-checks.json)

Screenshots in `urban-review/` show the available viewport; longer M02/M07/M10 pages may be partial rather than full-page captures. `M08-desktop.jpg` and `M08-training-desktop.jpg` show the complete updated streetwear and gymwear spreads.

## Assets and prompts

Generated with the **built-in imagegen tool**, then converted to WebP without additional visual editing. Active workspace files:

- [Streetwear / solid gray](assets/urban-street-look-faceless.webp)
- [Streetwear / city court](assets/urban-street-wide-faceless.webp)
- [Gymwear / solid off-white](assets/urban-training-look-faceless.webp)
- [Gymwear / industrial gym](assets/urban-training-wide-faceless.webp)

[Initial prompt set](urban-prompts.json) · [Final faceless / solid-background prompt set](urban-faceless-prompts.json) · [Provenance](ASSET_NOTES.md)
