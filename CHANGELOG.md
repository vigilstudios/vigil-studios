# Changelog

## Express catalogue motion and navigation fix

The Auto Repair catalogue HTML has been regenerated from `auto-repair/v1`, publishing the sequential word-by-word hero animation that was already present in the renderer. The Restaurant catalogue HTML now uses deterministic fixed-header section navigation on desktop and mobile, so selecting a navbar option no longer delays the scroll or leaves the page at the previous section.

## Restaurant and Cafe V1

The Restaurant and Cafe catalogue entry now serves the approved Marlow & Fen design, including its mobile layout, animated daypart menu, gallery, reviews and booking demonstration. The entry accent and description match the new template. The catalogue retains its existing industry order, carousel controls and viewport selector behavior.

The generated HTML comes from the canonical renderer in `vigil-leadgen`, template ID `restaurant/v1`. No parallel client schema or storefront-specific styling layer was introduced. Source generation and schema/token inheritance are documented in that repository's `docs/restaurant-v1.md`.

Validation: Next.js production build and browser inspection of desktop/mobile catalogue previews.
