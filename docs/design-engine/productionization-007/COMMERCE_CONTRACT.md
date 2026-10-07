# Commerce presentation boundary

1 October 2026. The engine consumes normalized client data:

```text
External commerce provider → future host adapter → Vigil presentation records → section
```

No provider SDK, provider ID, cart, checkout, payments, inventory quantities, search backend, tax, shipping or orders enters these contracts. No shop/product routes or Product Detail page recipe is implemented.

## Data ownership

[`commerce/types.ts`](../../../design-engine/commerce/types.ts) exports strict runtime schemas and inferred Product, ProductSummary, ProductIdentity, ProductMedia, ProductPrice/Money, ProductOption, ProductVariant, ProductCollection, ProductCategory, ProductBadge, ProductSpecification and ProductFeature types. `productId` is the engine's stable identity; it need not be a provider identifier. Identity-only inspection accepts no price/options/taxonomy requirement. Most merchandising uses a summary; the full optional-field model is available to future adapters and is never forced into every component.

Prices use integer minor units, a supported ISO currency and fixed/starting/subscription mode. Subscription alone requires month/year interval. Compare-at prices must be larger in the same currency and billing basis. Rendering supplies semantic previous/sale labels, `del`, explicit currency and currency-specific fraction digits. Product plans and service pricing remain separate. A variant resolves solely from supplied option/value references; there is no inventory inference or transaction guarantee.

Typed destinations contain a label and a safe host-owned href; optional slugs/IDs preserve future route mapping. The component follows that link normally. Runtime source contains no hard-coded product route, Lab destination overlay, fictional brand, study asset or provider import.

## Media contract and delivery

Media entries have stable IDs and labels, optional primary/secondary/alternate/detail role, optional product/lifestyle/campaign/model/detail purpose and an optional independent thumbnail. Image, controlled video and explicitly static interactive-placeholder variants reuse engine dimensions, alt, focal/mobile source, responsive candidates, transcript and speech-caption contracts. At most one primary asset is accepted; otherwise the first authored asset supplies the reference. Galleries and essays follow authored plate order without sorting by role.

Containment preserves complete products and model/campaign relationships across portrait/landscape inputs. Section-owned viewing wells differ in size; a global art direction cannot silently manufacture a crop or a cutout. Responsive candidates and optional mobile sources are host-authored; alt describes the actual product/view. Compact contact-sheet imagery is decorative because its button contains a visible view name/type. Still media is lazy with async decode and intrinsic dimensions. Video is user-started with native controls, plays-inline and preload none; changing P10's selection unmounts and stops the previous video. A 360 entry remains a still with an authored explanation, not an invented 3D loader.

Missing or failed media produces a named fallback while product identity, prices, selections and destinations remain readable. No section preloads a speculative hero asset. Optimizers stay at the host delivery boundary: a client can supply its own CDN-generated srcSet/sizes/thumbnail; portable source needs no Next image host configuration. Lab-only 240px and 640px WebP derivatives are in `public/design-engine-commerce`; original approved assets remain untouched. Client publication still needs actual verified facts/assets rather than treating generated fixtures as evidence.

## Catalog extension

P02's serialized `catalog` object supplies filter definitions/values, sorting choices, selected query, result count and scope. It renders at most 24 returned rows, including an empty result. This describes a visible slice of a large catalog, not 2,000 hydrated records.

- `provided-slice`: local category/availability filtering and editorial/ascending/descending ordering inspect only supplied records. Price sorting requires a shared currency/mode/billing basis. Mixed starting/fixed fixtures expose editorial order. This contains no network query, pagination, indexing or search engine.
- `host-results`: the host supplies result records/count. A client wrapper passes `binding={{query, pending, onQueryChange}}` directly to `CatalogLedger`. Input changes emit query intent and keep the supplied rows intact. The host executes the query and replaces content; pending controls are disabled and results announce updating. Without a binding the controls are disabled, so an unconnected catalog does not imply functioning backend filters.

Definitions and selected IDs are validated at the serialized boundary. Client hosts should validate new binding queries with `catalogQuerySchema`/their presentation definition before rendering; callbacks stay in client code. Functions are not stored in registry metadata or serialized compositions.

## Option extension

P12 supplies 1–3 named groups, 2–8 values per group, and at most 40 explicit variants. Size, color, material and configuration are labels/presentation modes rather than mandatory dropdowns. Native radios support keyboard arrows and wrap on mobile; swatches supplement names. Each variant references exactly one valid value per option; duplicate combinations and currency drift are rejected.

`initialChoices` seeds local state and must cover every option. A client wrapper can pass `selection` and `onSelectionChange(choices, resolvedVariant)` directly to `OptionAtelier`; this is the future commerce-state connection. Missing combinations yield an undefined variant and no false price. Unavailable, preorder and unknown are supplied presentation states, not a stock computation. A variant can supply its own destination; otherwise the ordinary product destination remains available. The host owns refreshed facts and subsequent page/commerce integration.

## Relationship integrity and Product Detail capability

P06 keeps one product pool with look item references `{productId, role}`. Campaign media, its caption, membership and selected record form an accessible editorial relationship; no coordinate/hotspot-only mechanism is required. P13 maps every criterion value by product ID, preventing column drift on reorder. P14 requires distinct companions and excludes its anchor. Origin/material evidence is authored text; P09's optional media caption describes its actual relationship instead of hard-coded factory claims.

Metadata distinguishes section-oriented, page-capable, section-and-page-capable and product-detail-building-block usage. Explicit Product Detail facets cover P08 material storytelling, P10 selected media, P11 continuous media, P12 options and P14 related discovery; P03 specifications and P09 provenance are also advertised as useful facets. These are independent building blocks, never a completed Product Detail page.

Only implemented motion is selectable: this pass preserves static/resting layouts and immediate native rail progression. Study motion proposals remain archived for later deliberate, separately verified implementation. Brand/icons inherit, typography/art overrides stay capability-limited, media tone consumes the existing natural/monochrome/high-contrast vocabulary, and geometry remains contained.
