# Phase 003 verification

30 September 2026. This is concept/system validation, not production approval for any Hero.

## Automated gates

- `npm test`: **49 files, 290 tests passed**. Five added calibration contracts cover all 60 typography/art pairings, independent brand tokens, semantic role completeness/bindings, actual static Plex weight availability, no-motion readability, single marquee track, font binary SHA-256 and retained OFL licenses, catalog-loader scope, twelve concepts outside inventory, adjacent profile diversity, review-axis guardrails and readable palette pairs.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings.
- `npm run build`: optimized production build passed, including dynamic `/admin/design-lab` and all 51 static pages. No new package dependency or lockfile change.
- Existing registry still contains 29 experimental entries. No H17–H28 registration, production promotion, full-site composer, new section library, database migration or public preview route was introduced.

The review-axis test is a metadata regression guard, not an objective score for visual diversity. The pairwise human-style critique is recorded in BATCH_003.md.

## Browser checks

Authenticated Chrome against the local Lab. Inspected desktop designs, all twelve 390px mobile frames, 768px tablet frames and real browser viewports at 390×844 and 768×1024. Actual study widths shrink to the available admin content area; the frame selector sets a maximum, not a promise that sidebar chrome disappears. All twelve reported equal client/scroll widths in mobile and tablet frame checks. Restored the browser viewport afterward.

- Existing catalog, calibration and concept modes render. Independent structure/type/art/theme/motion controls remain available in catalog/calibration. Desktop, tablet and mobile frames change component layout through container queries.
- Exercised fifteen documented H09/H10/H12/H13/H16 combinations across ten type directions; computed display families changed to the selected local faces without changing the chosen structure or brand tokens. Inspected the same H09 in Editorial/Publication and Poster/Billboard side by side.
- H09 object crop now uses the existing portrait source to protect the chair at narrow widths; the original Figma frame is unchanged.
- H10 retains left copy and whole/detail media. H13 exposes a wider background field with substantial Poster letterforms. H16 has explicit grid placement to keep copy and record beside its central spine, with a mobile copy-first arrangement.
- H12 native range accepts keyboard ArrowRight: visible value changed 50% → 51%, with a visible focus outline. Both image layers keep identical fit/position for comparison. No drag-only requirement.
- H16 expressive reveal starts from a negative horizontal offset and finishes at `transform: none` / `clip-path: inset(0%)`. Browser QA found that observing a fully clipped element could stall entry; MediaReveal and MaskReveal now observe unclipped wrappers. Motion none immediately renders the resting image. OS reduced-motion support remains in the shared hook and stylesheet; this session did not alter the user's OS preference or claim a screen-reader audit.
- H20 desktop/mobile crop retains the portrait's face. H21 fills its panorama row. H23 uses the existing portrait chair image. H24's three planes stay inside the drawing field. H25 branches horizontally on desktop and vertically on mobile. All twelve mobile studies were visually inspected; longer compositions intentionally scroll.
- Side-by-side batch mode replaces the single-study display, making the comparison visible immediately. Individual concept/viewport controls are disabled during that overview; toggle back for the detailed rationale and responsive frame.
- Batch action text remains noninteractive and the Lab explicitly says proposed behaviors are not implemented. Study palettes meet a 4.5:1 foreground/background and accent/background calculation; this is not a blanket accessibility claim for future client content or photography.

## Corrections and limits

Fixed profile/style specificity, arbitrary arch treatments, repeated chair imagery in H20, inappropriate contain-fit on H21/H27, transformed drawing bounds, forced blank mobile height, H16 grid auto-placement and the shared clipped reveal trigger. The local font catalog is a Lab fixture; client font-loading discipline is architectural and must be enforced when a client implementation is created. No client deployment/performance benchmark is claimed.

The application emitted existing development-shell notices about a logo aspect ratio and Three.Clock deprecation. No application-shell refactor was attempted for this creative milestone. Tests, lint and build succeeded. No proprietary fonts were copied; every included font carries its license. No external Figma document was edited, and no Scar assets or creative language were used.

See [feedback/audit](./FEEDBACK_AND_AUDIT.md), [Batch 003 and all-pairs critique](./BATCH_003.md), [typography/art direction](../TYPOGRAPHY_AND_ART_DIRECTION.md), and [tooling](../CREATIVE_TOOLING.md).

Production-build visual evidence: [H19 / H20 comparison](./review-proof.jpg). The live local review was left open in Batch 003 side-by-side mode.

The retained browser log also contains transient RSC fetch failures while the local server was stopped/rebuilt and extension message-channel notices. The final production reload and concept controls succeeded; these historical log entries are not represented as a clean-console certification.
