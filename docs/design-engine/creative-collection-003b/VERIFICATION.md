> Historical baseline: the checks below cover the original 1 October proposal. Current approval-follow-up results are in [APPROVAL_FOLLOWUP.md](APPROVAL_FOLLOWUP.md).

# Collection 003B · Verification

Verified 1 October 2026, America/New_York. This is a creative-review proof, not a production promotion.

## Repository checks

| Check | Result | Evidence |
|---|---|---|
| npm run typecheck | Pass | [log](evidence/typecheck.log) |
| npm run lint | Pass, no warnings | [log](evidence/lint.log) |
| npm run test | 61 files, 547 tests passed; 16 navigation contract tests | [log](evidence/tests.log) |
| npm run build | Optimized Next.js build passed; 53 static pages generated | [log](evidence/build.log) |

New tests cover preserved inventory, pending-review boundaries, supported defaults, realistic IA ranges, incompatible alignments, overlay safety and dependent flow/background/scroll transitions. Production schemas and runtime navigation remain unchanged.

## Browser and layout evidence

Headless installed Google Chrome, using the existing loopback QA harness pattern. Tests render the same Study and LabEditor components used by the staff-only application. No public Next.js test route or authentication bypass was added.

- **282 layout states**: twelve studies × three contexts × 1440/768/390/320px, every available expanded state, plus long labels and missing image marks. No stage overflow, navigation bounds failures, sub-44px primary targets or failed images in the final run. [Results](evidence/layout.json)
- **114 menu checks**: opening, modal focus containment, Escape dismissal and trigger restoration. All pass. [Results](evidence/interactions.json)
- **22 declared scroll behavior checks**: static/sticky positioning, scrolled state, compact and transparent-to-solid policies, hide/reveal activation. [Results](evidence/scroll.json)
- **44 scroll geometry checks** at desktop/mobile: sticky position bounds, retained edge-grid layout, actual compacted brand size, solid background transition and keyboard reveal. All pass. [Results](evidence/scroll-geometry.json)
- **12 reduced-motion checks**: actual prefers-reduced-motion emulation, keyboard menu activation, zero computed animation or transition durations across the study DOM. All pass. [Results](evidence/reduced.json)
- **43 axe WCAG 2 A/AA + 2.1 AA navigation audits** across desktop/mobile resting and expanded states: no reported violations. Scope is navigation, not unrelated production Hero content. [Results](evidence/audits.json)
- **120 Hero combinations**: twelve studies × five production Heroes × desktop/mobile, flow or reserved-edge mode; no overflow, missing heading or failed media. Overlay/floating mode separately covered by the main matrix. [Results](evidence/heroes.json)
- **8 focused interaction/Lab checks**: desktop submenu keyboard entry/Escape, outside dismissal, staged heading/Back focus, singleton-control hiding, overlay Hero filtering and flow unlocking all five Heroes. All pass. [Results](evidence/checks.json)
- No runtime page exceptions in either final suite. [Matrix errors](evidence/errors.json), [interaction errors](evidence/interactionErrors.json)

The authenticated localhost:3000/admin/lab application was also opened in Chrome. Collection 003B appears alongside all earlier collections, renders the selected production Hero, changes adaptation, and expands Atlas Hall's actual eight-department technical menu. A separate review tab was left open; the user's existing Composition tab was preserved.

Visual inspection covered desktop/mobile contact sheets and individual masthead, centered sheet, cinematic side panel, mega directory, edge rail and graphic-board states, including a mobile artboard modal inside the desktop Lab. The modal uses native browser top-layer height with the artboard's width; this limitation is documented.

## Corrections during verification

- Normalized React-generated IDs to the engine's lowercase section-ID format.
- Corrected the inventory test to preserve real experimental/review statuses.
- Added explicit modal Tab wrapping, immediate Escape state synchronization and scroll locking.
- Scoped panel heading styles against inherited typography rules.
- Removed controls whose alignment choices did not produce reliable structural changes.
- Restored two direct mobile section links in Dispatch.
- Extended the edge rail's containing grid through the review content and resolved sticky-grid selector precedence; verified position geometrically at desktop and mobile.
- Replaced unrelated inherited Hero supporting copy and media with context-specific, explicitly illustrative fixtures.
- Waited for actual modal/Back focus state and excluded native closed-disclosure descendants from bounds checks; final evidence reflects settled UI, not animation frames.

## Reproduce

From the vigil-studios repository, build the disposable harness:

    node scripts/design-engine-navigation-qa.mjs
    python3 -m http.server 4193 --bind 127.0.0.1 --directory /tmp/vigil-navigation-qa

In another terminal:

    PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/design-engine-navigation-matrix.mjs
    PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/design-engine-navigation-scroll.mjs
    PLAYWRIGHT_MODULE=/absolute/path/to/playwright DESIGN_ENGINE_AXE=/absolute/path/to/axe.min.js node scripts/design-engine-navigation-interactions.mjs

The tools use the installed Chrome application. No repository dependencies were changed. All browser scripts exit nonzero for assertion failures. The harness is disposable; the integrated review workspace is in the existing staff-only Lab.

## Limits

Chrome was tested, not a cross-browser/device or screen-reader matrix. Scroll-root binding, measured safe regions, arbitrary recursive routing, production persistence, utility integrations and full logo/font stress coverage remain future production concerns. Three unrelated adaptations demonstrate structural reusability within declared limits; human creative approval remains authoritative.
