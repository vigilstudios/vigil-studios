# Customizable creator sections

8 October 2026. Two registered, reusable components for the Professional engine.

**Social Reach** (`proof.social-reach`) pairs audience proof with working social profile links. Edit the heading, introduction, up to eight metrics, platforms, reporting periods, optional source links, disclosure/basis copy and up to eight profiles. Metric values are authored text, so followers, views, reach, engagement or other evidence can use the creator's own formatting. Demo values are illustrative; the component does not fetch analytics. Profiles require HTTP(S) URLs. Choose cards, editorial or compact layouts; bold or quiet metrics; pill or row links; density, alignment and surface.

**About Me** (`about.creator-profile`) provides a personal introduction, name, role, location, biography, up to eight interest tags, signature, main photo and optional second snapshot. Choose scrapbook, split or centered layouts; photo placement, shape, snapshot or clean treatment, density, alignment and surface. Both components inherit the site's palette, typography and art direction, support shared section actions and expose all four creator adaptations.

Insert either component in **Professional → Composition**, then use the section's **Content**, **Media** and configuration controls. Image fields can use project uploads or any of the 28 creator photographs. Changes serialize into the existing site data and draft persistence flow.

The Image Expansion component now uses a transparent shell with inherited section color, removing the black inset container and tone switch. The legacy `colorMode` schema field remains readable for existing documents.

## Verification

- Unit coverage includes schema safety, serialized custom content, every finite configuration, insertion and all four adaptations on every registered section.
- `scripts/design-engine-creator-sections-qa.mjs` builds an isolated preview and the real Professional editor.
- `scripts/design-engine-creator-sections-browser.mjs` checks 1440, 768, 390 and 320px widths; all layouts and packages; maximum-length content; axe accessibility; photo loading; editing, add/remove controls, serialized data and reload persistence.
- [browser-results.json](./evidence/browser-results.json) records 159 passing checks. Desktop/mobile screenshots and the complete photo contact sheet are in [evidence](./evidence).

All 1,397 Design Engine tests pass across the initial run and reruns. Two CPU-heavy catalog suites were rerun with a 30-second timeout after exceeding the default five seconds. TypeScript, targeted ESLint and the portable runtime build pass. See [validation.json](./validation.json) for commands and counts.

Production evidence records implementation QA by Codex for the requested sections; it does not represent a separate human visual approval. The renderers use authored data and shared engine tokens, with no preview fixtures imported into the portable runtime.

Production release preflight: the isolated release tree passes the full optimized build, standalone typecheck, full lint and 1,712 tests / 78 files. Details: [release-preflight.json](./release-preflight.json).
