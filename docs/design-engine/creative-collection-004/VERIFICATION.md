# Collection 004 — verification

30 September 2026 · host: `vigil-studios`. Verification supports an **experimental creative review handoff**, not production approval.

## Automated gates

Final runs after the motion hydration correction:

| Gate | Result |
| --- | --- |
| `npm test` | 52 files, 309 tests passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, no warnings |
| `npm run build` | Passed; 53 static pages generated, dynamic `/admin/lab` and both legacy redirects present |
| `git diff --check` | Passed for tracked changes |

The error-handling suite deliberately logs mocked provider/database failures; its assertions passed. No database or auth implementation changed, and no database migration was required. No commit, push or deployment was performed.

`lib/design-engine-capabilities.test.ts` covers contextual overlay filtering and neighboring-Hero changes, static global motion invariance with real renderer output, fixed/disabled control markup, line/outline conflict, per-structure N01 art restrictions and behavior→none transitions. The last transition regression asserts that the choice check permits the explicit override removal, while raw imported irrelevant overrides still produce runtime diagnostics.

`lib/design-engine-story.test.ts` covers all eight studies with three briefs, source separation and experimental provenance, strict schema rejection, semantic rendered output for both variants and all content lengths, and two unlike compositions per candidate. Existing registry, calibration and composition tests were extended without changing historical dispositions. No metadata-derived creative-diversity score is used.

## Actual browser coverage

Authenticated Chrome at `http://127.0.0.1:3001/admin/lab`, using the real staff-gated app. Client artboards are 1440, 768 and 390 px inside the desktop Lab. The saved [browser matrix](evidence/browser-matrix.json) records observations, not synthetic pass assertions.

| Rendered matrix | Cases | Result |
| --- | --- | --- |
| Eight studies × three briefs × three widths | 72 | No horizontal overflow or broken images; no h1 inside study bodies |
| Three reusable candidates × two structures × three widths × three briefs × short/standard/long | 162 | No horizontal overflow or broken images; one h2 and no h1 per body |
| Original five plus six new compositions × three widths | 33 | Compatible, no overflow, one Hero h1 per composition |

Visual inspection covered the eight individual desktop studies, responsive examples, each reusable candidate and the comparison view. Layout/content metrics complement that review; they cannot certify every possible client payload. Long fields are retained in full, not truncated. The final comparison thumbnails were corrected after screenshot review exposed doubled width/clipping under CSS zoom; they now preserve a desktop composition within each thumbnail. The visual revisions and all-pair comparison are in [the collection dossier](README.md).

## Supported effects and transitions observed

- Primary Navigation under Gallery: comfortable 88 px versus compact 70.4 px.
- Statement Hero under Salon: content computed alignment changes start → center; structural choice is no longer overruled.
- Editorial Text: lead 22.5 px, body 18 px, small 15.75 px.
- Responsive Media: explicit object-fit changes cover → contain. Its irrelevant local art selector is hidden.
- S01 art directions visibly vary actual rhythm: section padding 86.4 / 115.2 / 57.6 / 144 px and gaps 48 / 64 / 25.6 / 96 px for Publication / Gallery / Precision / Runway. Its protected dossier hierarchy remains.
- S01 typography changes rendered display families: Fraunces → IBM Plex Mono → Anton (with uppercase poster treatment). Monochrome image treatment computes grayscale(1).
- Marquee at the same 16-second authored duration: restrained computes 45.7143 s; expressive 12.3077 s; none has no animation and a still surface.
- N01 center omits duplicate local Salon/Runway choices while inherited global Salon remains valid. An explicit Salon override in end structure makes center unavailable with its equivalence explanation. Overlay N01 prevents replacement with Heroes lacking its safe zone.
- H17 media-reveal + local expressive → none removes the local intensity and announces “Global motion is preserved.” The browser caught and verified the correction to this transition.
- Static calibration studies show a fixed none property; H16 retains its implemented reveal controls. Original feedback/dispositions remain visible.

## Keyboard, reduced motion and editor workflow

S06 native summary controls were focused and toggled with Enter and Space; each has a unique accessible name and visible focus. The disclosure also operates in Composition interaction mode. Selection mode continues selecting the body beside the fixed inspector. Desktop ledger labels remain available to assistive technology through visually hidden repeated labels; mobile labels become visible.

With Chrome emulating `prefers-reduced-motion: reduce`, the actual media query was true: Sticky Scroll released to static position with zero minimum spacer height; Marquee rendered a still single group without animation; H17 reveal media was fully visible with no transform/clip concealment. The inspector explains effective none and preserves authored values. Reloading under that policy exposed a server/client markup mismatch in the new conditional controls. `MotionPolicy` now uses React's `useSyncExternalStore` with a shared server/hydration snapshot and a live media-query subscription, following the [official React contract](https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering), fetched through Context7. Automated gates passed after the correction.

The final reduced-motion reload passed after the correction: the actual media query remained true after reload and the tab recorded no console errors. S06 disclosure was then exercised under the same policy: Enter closed the focused disclosure, Space reopened it, and the summary retained visible keyboard focus. See the [reduced-motion keyboard capture](evidence/s06-reduced-motion-keyboard.jpg).

Inspector hide/show, keyboard resizing (340 → 360 → 340 px), Compact/Comfortable/Large sizing, 67% zoom and Fit were exercised. Selected sections scroll into view beside their controls. The 768 px browser viewport shows the desktop-workspace guard; client mobile artboards remain available at 390 px inside the desktop editor. Temporary viewport emulation was reset. The tested editor uses one `/admin/lab` entry, with the existing Design/Composition switches and earlier collections retained.

## Saved visual evidence

- [S01/S02 comparison and Lab context](evidence/collection-overview-top.jpg)
- [S03/S04 comparison](evidence/collection-overview-conversation-orbit.jpg)
- [S05/S06 comparison](evidence/collection-overview-middle.jpg)
- [S07/S08 comparison](evidence/collection-overview-bottom.jpg)
- [S06 Composition keyboard focus and disclosure](evidence/s06-composition-keyboard.jpg)
- [S06 reduced-motion keyboard verification](evidence/s06-reduced-motion-keyboard.jpg)
- [S08 mobile client artboard](evidence/s08-mobile.jpg)

These are real browser captures, not generated mockups. Browser coverage is Chrome with English fixture content, not exhaustive cross-browser or screen-reader certification. Human selection determines whether any experimental candidate advances.
