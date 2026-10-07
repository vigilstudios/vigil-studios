# Creator demo image package

7 October 2026. Sixteen original AI-generated candid digital-camera photographs, created with the built-in imagegen tool.

| Client adaptation | Palette | Exposure | Photos |
| --- | --- | --- | --- |
| Creator · Pink / Light | Blush, rose, cream | Daylight | Hero, product, POV, objects |
| Creator · Pink / Dark | Dusty rose, plum, warm pink lamps | After dusk | Hero, product, POV, objects |
| Creator · Neutral / Light | Ivory, linen, oak, stone | Daylight | Hero, product, POV, objects |
| Creator · Neutral / Dark | Espresso, charcoal, taupe, amber lamps | Evening | Hero, product, POV, objects |

People are shown from the back or through hands and cropped bodies. No faces are visible. Black creators and deep brown skin appear in both neutral sets and the pink-dark POV. The remaining photos provide other skin tones or object-only scenes.

## Use

In **Lab → Design** or **Lab → Composition → Section**, open **Client adaptation** and choose one of the four Creator options. They are available for Navigation, Hero, Work/gallery, Commerce, the Media/Media Frame primitives and Media Reveal. Existing hover/focus audition and explicit click/Enter application continue to work. Image packages do not change the page's colors, typography, section structure, image treatment, motion or action targets.

Wide hero and POV images serve scene/comparison layouts; portrait product images serve object studies and Commerce; galleries rotate the four photo roles. Commerce starts from the existing fictional skincare example. Gallery records replace unrelated fixture captions, media and optional demo films with creator photos. Primitive previews use the chosen hero. Reusable production components import no creator fixtures.

## Files and prompts

- Optimized full-resolution, 640px responsive and 240px thumbnail WebP files: `public/design-engine-creators/`.
- Browsable visual index: `public/design-engine-creators/index.html`.
- Original PNG photographs: [originals](./originals).
- Full generation and final edit prompts: [prompts.json](./prompts.json). Generation mode: **built-in imagegen**.
- Dimensions, descriptive alt text, roles, checksums and delivery sizes: [assets-manifest.json](./assets-manifest.json).
- Adaptation data and role selection: `design-engine/preview/creator-image-packages.ts`.
- Rebuild delivery formats from archived originals: `node scripts/package-creator-images.mjs`. This encodes and resizes; it does not generate or retouch imagery.

These are temporary demo photos. The existing Professional project export still requires approved project-owned media; this package does not change that export policy.

## Verification

The existing client-adaptation suite exercises all selectable examples and validates section schemas, layout and behavior preservation. Additional package checks decode delivery files, verify intrinsic dimensions/checksums, confirm all four roles per set, check gallery film replacement, and retain equal comparison-view proportions without stale responsive sources.

Browser evidence is stored in [evidence](./evidence): image loading in both Labs, hover rollback, keyboard application, saved Composition data, the visual index at desktop/tablet/mobile widths, and screenshots.

Completed validation: **247 tests**, **36 browser checks**, TypeScript compilation and targeted ESLint checks pass.
