# Team customization and existing commerce catalogue connections

Release preparation and updated verification: [RELEASE_20261102.md](RELEASE_20261102.md). The local-only status and pending prerequisites below describe the earlier review.

Local implementation, 2 November 2026. This extends the preserved onboarding work; it is not a production release.

## Team

`about.team` remains the single Content Hub Team adapter. It now offers cards, directory, alternating editorial profiles and a lead-profile spotlight, plus independent grid/horizontal flow, 2/3/4 columns, portrait/square/circular/landscape portraits, density, framing, alignment and biography visibility. Hidden biographies remain in the records.

Native fade, stagger, mask and media reveal use the existing motion policy. Shared Lab entrance/exit, sequencing, duration, image-motion and hover controls remain available; an explicit shared motion override takes precedence over the native reveal. Reduced motion disables reveals and smooth scrolling. The horizontal track uses the established labelled arrow controls and native focusable touch/keyboard scrolling. Profiles retain semantic list order. No employee photographs are invented.

## Existing commerce family

No additional catalogue family was created. Lab → Composition → Content → Content Hub display offers a catalogue source and **All products / Featured products / Specific products**. Specific selection follows selection order. Featured selection reads saved Hub flags and existing positional ordering. An unpositioned catalogue exposes a simple Featured product checkbox in Content Hub.

A component can reference another product collection on the same website, including across pages. Its own display does not create a second independent Hub collection. Existing collection identity, publication snapshots, media authorization and subscription gates remain in use. A source stays enabled if another component uses it; published bindings stay enabled while replacement designs remain drafts. Selecting a subset never trashes unshown records.

Adapters cover all 13 components that display individual products, including campaign spreads and the related-product anchor. Collection Atlas is collection navigation, so it is not misrepresented as an individual-product list. Product-specific looks, comparison data, options and variants still have to match the chosen products. Incompatible selections report an error; unrelated option/variant sets cannot be reassigned to a different product.

Design limits are explicit. For example, the existing Catalog Ledger supports 0–24 rows; smaller editorial designs and single-product views retain their actual limits. All products does not silently truncate a catalogue. A larger-than-supported source needs a suitable design/pagination implementation or an explicit subset. This work does not add checkout, inventory or provider commerce operations.

Product names/media are edited centrally in Hub. Wrapped merchandising notes, relationships, campaign imagery and other design-owned supporting content remain editable in Lab. New project sections must be saved once and the workspace reloaded to expose their authoritative Hub source; demo selections use example records only.

## Verification

- Broader Content Hub/Design Engine/onboarding adapter run: 1,621 tests across 46 files passed.
- Final focused editor, product selection, featured and Team run: 72 tests across 4 files passed, including additional edge cases added after the broader run.
- TypeScript, focused ESLint and whitespace checks passed. Optimized production build passed on Node 24.22.2 with sharp 0.35.5; final editor-only ownership guards were then checked with TypeScript, ESLint and the focused tests.
- Runtime rebuilt: `v1-9dd5ca61bab7feef8d08` (27 files).
- Real Chrome verified specific selection and order, available catalogue sources, horizontal Team arrow movement, editorial layout and 390px rail containment. The Team preview recorded no console errors. Local port 3190 remains available.
- Screenshot proof is in the private local review folder: `~/.local/share/vigil-onboarding-review-20261102/` (`commerce-product-controls.jpg`, `team-customizable-rail.jpg`, `team-editorial-options.jpg`).

## Remaining release boundary

The worktree still contains the preserved onboarding work documented in REVIEW_20261102.md. Migrations 51/52 are still pending, and current-main integration must preserve the newer production domain flow. A real private image upload → Hub assignment → published customer-render journey remains to be completed in an isolated test environment before release. No customer intake was submitted, shared database migration applied, subscription changed or production deployment made during this extension.
