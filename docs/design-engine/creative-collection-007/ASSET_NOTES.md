# Collection 007 · media provenance

All artwork is illustrative. No source from Scar was consulted. No third-party product marks, customer claims or real inventory are implied.

## Photography

`public/design-engine-study-007/` contains 16 local WebP fixtures, totaling 2,004,086 bytes (about 1.91 MiB):

- Six new studio photographs: three graphite/amber audio objects (headphones, speaker, player), and three skincare vessels (serum, cream, wash). Created with the built-in imagegen tool.
- Six new close-up edits: pocket and hood, closure and glass base, earcup and headband. Each was generated using the corresponding original image as the edit reference. These support material inspection and coherent single-product media studies. They are AI-generated details, not photographic evidence of manufactured goods or material properties.
- Four existing faceless apparel photographs copied from Collection 005. Their original generation and edit provenance remains in that collection's asset notes. Only image bytes were reused; no previous study layout was copied.

Generation prompts and source paths are preserved in [assets-prompts.json](assets-prompts.json) and [detail-prompts.json](detail-prompts.json). The built-in imagegen tool was used throughout; no paid connector, CLI fallback, font kit or new application dependency was added. Generated PNG originals remain in the original Codex output location; every consumed asset is copied into the repository as WebP. Sharp only resized/encoded generated output to a maximum of 1200px; no layout asset points outside the project. Existing apparel WebPs retain their original dimensions.

The [manifest](assets-manifest.json) records dimensions, bytes, source purpose and SHA-256. Every image has authored alt text and intrinsic dimensions. Normal rendering uses native lazy-loading and contained imagery. Dedicated detail records keep media ownership explicit. Missing-media mode replaces photographs with labelled frames while retaining product information; actual failed image loads use the same fallback.

The three unrelated contexts are fictional. Apparel variants may share campaign imagery and say so; an illustration is not proof of SKU accuracy. A charcoal hoodie and cargo trousers are correctly mapped to the shared charcoal model photograph. Travel/refill/alternate editions explicitly identify reused reference photography. The digital audio journal has no fabricated physical-product image.

## Video and interactive media

P10's apparel adaptation reuses `public/design-engine-study-005/concrete-faceless.mp4`, the existing six-second silent generated still sequence. It is user-started, uses native controls, no preload and no autoplay or loop. Its written visual transcript identifies the still-sequence nature. Video source/poster/dimensions/transcript use the existing engine contract; speech would require captions. Switching away unmounts the video.

The 360 media item is deliberately a labelled still fallback. No interactive rotation, 3D model, WebGL viewer or performance claim is implemented.

## Type / icons / motion

The ten existing licensed Lab font profiles are reused through `DesignThemeProvider`, with font loading still at the Lab route. No font binaries or licenses are changed. The core `VigilIcon` adapter provides functional arrows and disclosure affordances, all decorative where adjacent text already labels the control. Semantic brand tokens stay scoped to the preview subtree.

Current motion is none. Native scroll regions use immediate explicit progression. Future reveal, swap or inspection transitions are proposals only; reduced-motion validation confirms no animated/hidden essential content.

## Production boundary

A later selected implementation needs verified client photography, appropriate market/locale text, responsive image delivery and thumbnail budgets, licensed product imagery, and true media-to-SKU relationships. This collection does not establish ingredient efficacy, performance, sustainability, supplier provenance, model releases or production asset approval.
