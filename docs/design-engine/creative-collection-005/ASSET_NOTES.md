# Collection 005 — asset provenance

The initial three adaptations reuse local imagery. No Scar assets, styles or website source were consulted. The initial pass added no external photography, font kit, paid media, image-generation service or gallery dependency. The urban follow-up below adds generated apparel photographs.

## Still images

- `assets/retail-1.webp` through `retail-4.webp`: the four unique embedded image payloads in `public/express-templates/retail.html`, in source order. Extracted as image bytes only, then converted from PNG to WebP at up to 1200px wide / quality 85. Subjects: garment rail, material/object still life, showroom, outfit flat lay. No Express markup or layout is reused.
- `assets/restaurant-1.webp` through `restaurant-4.webp`: the four unique embedded WebP image payloads in `public/express-templates/restaurant.html`, in source order. Original WebP bytes retained. Subjects: breakfast, pasta, coffee, dining room. Supper Club's fifth and sixth records explicitly reprise the dinner and breakfast sources; they do not claim additional photography.
- Architecture sources remain imported from `creative-calibration-002/assets` and `creative-collection-001/assets`. Existing provenance records remain authoritative. No additional copy of these sources is introduced.

All are illustrative existing repository fixtures, never evidence of the fictional clients' real projects. The extracted Express asset lineage is recorded here; this task does not assert a newly verified third-party commercial license. Any production use must follow the original asset/client rights review. Real client images replace fixture media.

## Local video fixtures

`public/design-engine-study-005/{selvedge,interval,supper}.mp4` are six-second silent edits of three existing still images each, held for two seconds, without transitions. H.264, yuv420p, 960×540 letterboxed output, 24fps, faststart. No speech/music or documentary video claim. Each reel has a poster and a written visual transcript; playback is user-started, controls are native, preload is none and looping/autoplay are absent.

- SELVEDGE: retail 1 → retail 4 → retail 2.
- INTERVAL: coastal architecture daylight → limestone detail → blue-hour architecture.
- Supper Club: restaurant 1 → restaurant 2 → restaurant 4.

Generated locally using `@ffmpeg-installer/darwin-arm64` through an ephemeral npm cache invocation; no application dependency or package lock modification. Each reel is under 330KB. The eight additional still files total roughly 1.8MB. Dimensions are supplied to the browser and images are lazy except principal viewing images. This is review-level delivery, not the future production thumbnail/pagination strategy.

[Manifest](assets-manifest.json) records byte sizes, SHA-256 hashes and source paths. Typography uses the existing Lab-local font catalog and licenses, unchanged.


## Urban apparel follow-up — 2026-09-30

CONCRETE / ATHLETICS is a fourth fictional client adaptation, added at the user's request. The built-in imagegen tool produced four photorealistic apparel study assets, then edited each to remove all faces through neck-down framing. These are AI-generated illustrations, not real customer/model photography.

Active sources in `assets/`:
- `urban-street-look-faceless.webp`: charcoal hoodie / cargos, solid gray studio background (portrait).
- `urban-street-wide-faceless.webp`: oversized tees / cargos, urban court (landscape).
- `urban-training-look-faceless.webp`: olive technical set, solid off-white studio background (portrait).
- `urban-training-wide-faceless.webp`: olive and charcoal gym apparel, industrial gym (landscape).

Full generation prompts: [urban-prompts.json](urban-prompts.json). Final editing prompts: [urban-faceless-prompts.json](urban-faceless-prompts.json). Built-in PNG outputs were converted to WebP quality 86 at their original dimensions without additional retouching. The initial non-faceless WebP assets are retained as unused drafts; active fixtures import only the `-faceless` versions.

`public/design-engine-study-005/concrete-faceless.mp4` is a six-second silent sequence: solid-gray street look → urban streetwear → solid-off-white training look. Same native user-started playback and transcript policy as the original reels. The earlier `concrete.mp4` is an unused draft. Neither is documentary motion footage.
