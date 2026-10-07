# Navbar palette integration

2 October 2026. Navbar light-on-dark and dark-on-light previously substituted fixed green/cream colors, ignoring the site's palette overrides.

Theme variables now derive lighter/darker tones from the merged background/foreground pair using relative luminance. Brand uses the pair's original order; light-on-dark places the darker color behind the lighter text; dark-on-light reverses that. This preserves the selected direction for both light and dark themes. All colors remain editable through Site → Semantic brand colors, including the existing audition, apply and cancellation behavior.

Directly imported, scoped navbar palette rules replace the fixed colors in headers, dropdowns, expanded panels and explicit Hero overlay ink. Automatic classified Hero ink is resolved on the header inside its theme provider, where the palette variables are available. Scroll behavior and configuration schemas are unchanged.

Verified on the actual authenticated Next Composition Lab with Meridian: technical theme, neutral theme, custom aubergine/cream background and foreground, both contrast orientations, visible dropdowns, draft preview, swatch focus preview, cancel rollback and applied colors. Automatic light Hero ink resolves to the neutral palette's `#f5f4f1` over its transparent header. Screenshot: [custom navbar and site palette](evidence/navbar-site-palette.png).

302 relevant tests pass, including five palette ordering/override regressions; typecheck, focused lint and production build pass. Live UI verification is desktop Chrome on Meridian's shared navbar implementation.
