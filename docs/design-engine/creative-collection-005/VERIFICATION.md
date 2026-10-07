# Collection 005 — verification

30 September 2026. Supports a creative-review handoff, not production certification.

## Automated gates

| Gate | Result |
| --- | --- |
| `npm test` | 53 files / 313 tests passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed without warnings |
| `npm run build` | Passed; staff-only dynamic `/admin/lab` and legacy redirects preserved |
| `git diff --check` | Passed for tracked files |
| Pairwise dossier audit | Exactly 66 unique pairs |

The first build caught TypeScript access to an optional `sourceConcept` property on the registry's inferred union inside the new test. It was corrected with an explicit property guard; the final build passed. Existing mocked-provider failure messages in the test suite are intentional and their assertions pass.

The new `lib/design-engine-media.test.ts` checks all 36 rendered adaptations, h2 body semantics, collection family counts, separation from registry inventory, incomplete/duplicate/unsupported media, M09 pair requirements, actual local MP4 headers/size, transcript presence, native video controls and no autoplay. It also locks the Collection 004 review dispositions separately from experimental lifecycle status. Existing 309 tests remain passing. No database schema changed, so no migration was needed.

## Browser/layout checks

Real authenticated Chrome at `http://127.0.0.1:3001/admin/lab`; no auth bypass or public preview route. [Recorded matrix](evidence/browser-matrix.json): **108 combinations**, twelve studies × three briefs × 1440/768/390px client artboards. Every rendered section had one h2, zero section-level horizontal overflow, no completed broken-image errors and no running CSS animations. Intentional native horizontal overflow remains inside M06's promenade and M12's source tray. Lazy images outside the viewport are not claimed as fully loaded by this metric.

Visual comparison inspected all twelve desktop compositions in the Lab overview and individual examples including the spatial project directory, responsive comparison wells, mobile campaign folio and architecture adaptation. An additional [24 final-style checks](evidence/final-style-checks.json) covered M03/M04/M05/M07 across all three briefs at desktop/mobile widths after palette/caption refinements; all had zero section overflow. The final styling keeps M04's client palette and M05's distinct dark client palettes, and keeps M07/atlas notes available on narrow layouts. The source and flow order remain semantic; nothing essential relies on hover.

A real 768px browser viewport showed the existing “Lab is a desktop workspace” guard. Client-mobile layout checks used 390px artboards within a desktop browser, consistent with the existing Lab. This is not a claim of real-device touch, Safari, Firefox, multilingual or screen-reader certification.

## Keyboard and media

- M01: Space opens the second project disclosure.
- M03: Enter selects the second project and changes the central caption.
- M04: Space selects the second exposure and updates its enlargement and caption.
- M05: Enter advances the photograph and caption; bounded navigation buttons reflect sequence ends.
- M06: Enter on Next scene scrolls the native rail and focuses the destination figure (`data-scene=1`, observed scrollLeft 301.5 on the mobile artboard).
- M08: Enter advances a spread; the five-image architecture adaptation ends with a single final plate, an end-of-edition message and disabled Next.
- M09: Space on the second pair switches both overview and companion, announcing both titles.
- M12: Enter selects the right well; Space assigns another source. Left stays unchanged, the live assignment updates and the focused button has a visible 3px outline.
- M11: Enter filters to Motion. Native video playback starts on keyboard input; controls, preload none and no autoplay were observed. The silent local reel reports a duration of about 5.96 seconds. Enter opens its visual transcript. No speech exists in these fixtures, so no spoken-caption track is claimed.

## Reduced motion

Chrome DevTools' “Emulate CSS prefers-reduced-motion: reduce” command was enabled through its UI. The actual page media query was **true** during the successful check. M04's third exposure was selected with Enter; its image/caption changed, focus outline remained 3px, no images were hidden and zero CSS animations ran. See [capture](evidence/reduced-motion-mobile.png) and the `reducedCheck` record in the matrix file. Emulation was explicitly returned to “Do not emulate”; the query was then false. Temporary viewport overrides were cleared after testing.

All studies use motion none. CSS additionally removes transitions/animations under reduced motion. Proposed reveals/parallax/masking are documentation only. Native video remains user-started and stoppable; there is no silent autoplay behavior hidden behind the policy.

## Preserved context and evidence

Collection 004's review is visible in its selector, overview and inspector. S04’s arrow meets the circle at the clockwise tangent and clears the station label: [capture](evidence/s04-arrow-correction.png). S05 remains accessible as a rejected historical study, without registration. Earlier Hero/Navigation and Composition systems retain their definitions and tests. The component registry remains at 39 entries.

- [Overview 1](evidence/overview-01.png): index and chapters; spatial directory/proof-sheet beginnings.
- [Overview 2](evidence/overview-02.png): screening room and promenade.
- [Overview 3](evidence/overview-03.png): salon hanging and campaign folio; look/score beginnings.
- [Overview 4](evidence/overview-04.png): media cabinet and light table.
- [Architectural folio](evidence/m08-architecture-desktop.png): unrelated content, type and color adaptation.
- [Final review view](evidence/review-ready.png): collection left ready for human review.

The overview captures predate the final small palette adjustment in M04/M05; final source and follow-up browser checks are authoritative. No screenshot is an AI-generated mockup. Browser error log inspection returned no captured console errors. No new dependencies were added to the app manifest or lockfile. Original uncommitted work remains intact; no commit, push or deployment occurred.
