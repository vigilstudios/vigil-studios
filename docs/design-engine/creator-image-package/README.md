# Creator demo image package

8 October 2026. Twenty-eight AI-generated candid digital-camera photographs, created and edited with the built-in imagegen tool.

| Client adaptation | Palette | Exposure | Photos |
| --- | --- | --- | --- |
| Creator · Pink / Light | Blush, rose, cream | Daylight | Hero, product, POV, objects, gym, coffee, drive |
| Creator · Pink / Dark | Dusty rose, plum, warm pink lamps | After dusk | Hero, product, POV, objects, gym, coffee, drive |
| Creator · Neutral / Light | Ivory, linen, oak, stone | Daylight | Hero, product, POV, objects, gym, coffee, drive |
| Creator · Neutral / Dark | Espresso, charcoal, taupe, amber lamps | Evening | Hero, product, POV, objects, gym, coffee, drive |

People are shown from the back or through hands and cropped bodies. The café revisions frame below the face; no full faces are visible. Neutral Light uses a Black female creator and Neutral Dark uses a Black male creator, including matching hands in the gym and parked-car photos. Pink Dark also includes a Black female café creator. The remaining photos provide other skin tones or object-only scenes.

## Use

In **Lab → Design** or **Lab → Composition → Section**, open **Client adaptation** and choose one of the four Creator options. They are available for every registered section, plus the Media/Media Frame primitives and Media Reveal. Existing hover/focus audition and explicit click/Enter application continue to work. Image packages preserve the current section's structure, settings, actions, layers and media treatment.

Wide hero and POV images serve scene/comparison layouts; portrait product images serve object studies and Commerce; galleries rotate all seven photo roles. Small photo galleries expand to seven items. Gallery records replace unrelated fixture captions, media and optional demo films with creator photos. Primitive previews use the chosen hero. About Me receives the hero and café photo. Sections without media still expose the creator adaptations without injecting unrelated imagery. Reusable production components import no creator fixtures.

In **Composition → Section → Media**, each photograph also has a **Creator photograph** selector. Choose any of the 28 photos independently of the section's package. Selecting a photo updates its responsive sources and intrinsic dimensions while retaining the section's media geometry.

## Files and prompts

- Optimized full-resolution, 640px responsive and 240px thumbnail WebP files: `public/design-engine-creators/`.
- Browsable visual index: `public/design-engine-creators/index.html`.
- Original PNG photographs: [originals](./originals).
- Initial sixteen generation and edit prompts: [prompts.json](./prompts.json). Candid generation and face-cropping edit prompts: [candid-prompts.json](./candid-prompts.json). Generation/edit mode: **built-in imagegen**.
- Dimensions, descriptive alt text, roles, checksums and delivery sizes: [assets-manifest.json](./assets-manifest.json).
- Adaptation data and role selection: `design-engine/preview/creator-image-packages.ts`.
- Rebuild delivery formats from archived originals: `node scripts/package-creator-images.mjs`. This encodes and resizes; it does not generate or retouch imagery.

These are temporary demo photos. The existing Professional project export still requires approved project-owned media; this package does not change that export policy.

## Verification

The client-adaptation suite exercises all registered sections with all four packages and validates section schemas and non-content preservation. Package checks decode delivery files, verify intrinsic dimensions/checksums, confirm all seven roles per set, check gallery film replacement, and retain equal comparison-view proportions without stale responsive sources.

Browser evidence is stored in [evidence](./evidence): image loading in both Labs, hover rollback, keyboard application, saved Composition data, the visual index at desktop/tablet/mobile widths, and screenshots.

The current section and editor browser evidence is recorded in [creator-sections](../creator-sections/README.md), including 159 checks across layouts, widths, accessibility, custom content and persistence.
