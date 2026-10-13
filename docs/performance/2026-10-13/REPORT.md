# Marketing performance audit — 13 October 2026

The release candidate preserves the home page’s original typewriter cadence,
rotating V/star, pointer tilt, scroll breakup, story transitions, shader orbs,
card springs, menus, booking popup and FAQ. Production has **not** been changed.

## Scope and results

Branch: `codex/marketing-performance`, based on production’s `bdd2e00`.
The existing dirty checkout and its unrelated changes were preserved; this work
lives in a separate worktree. No schema, pricing, credentials or dependency
versions changed.

Cold-cache hosted Lighthouse results for the final clean preview:

| Device | Performance | Accessibility | Best practices | SEO (protected preview) |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 100 | 100 | 100 | 66 |
| Mobile | 96 | 100 | 100 | 66 |

Both devices score 100 for agentic browsing. Mobile LCP is 2.64 s and blocking
time is 101 ms. Desktop LCP is 0.56 s with no measured blocking time. Metrics and raw
reports are in `evidence/`.

[Final hosted preview](https://vigil-studios-f6v1q2ldp-vigilstudio-projects.vercel.app/)
(requires the owner's Vercel access), deployment `dpl_4GR48wssAZmf6CeLu9MzUJhd13cu`.

The user’s PageSpeed screenshot reports desktop performance 51 and total blocking
time 10,600 ms. Our independent live baseline measured 61 / 100 / 96 / 100
(performance / accessibility / best practices / SEO), with 515.5 ms blocking time.
Different hardware, test load and runs produce different values; both baselines
are distinguished from the release-candidate results.

Vercel preview deployments send `X-Robots-Tag: noindex`, giving the protected
preview an expected SEO score of 66. Production-mode localhost is used to verify
SEO at 100 (performance 100, accessibility 100, best practices 96 in that local
run); canonical metadata, structured data, robots and sitemap are retained.
The live production score still needs verification after an approved release.

## Causes and corrections

- The hero imported a full 3D renderer to draw 79 edges. The same original edge
  coordinates and perspective projection now draw on a native canvas. Camera,
  rotations, depth, physical-pixel line width, scatter and cursor response remain.
- Invisible shader canvases, scroll scenes and animation libraries initialized
  during startup. They now load on viewport approach or interaction, and stop
  drawing when offscreen or the tab is hidden. Original shader code, easing,
  durations, stagger thresholds and hover springs remain.
- The typewriter and wireframe waited for framework hydration. Small native
  startup scripts now run from the HTML and hand their clocks and DOM nodes to
  React without restarting the animations. The full semantic text remains in
  server HTML, including the deferred story’s five steps.
- The full Inter variable font was 344 KB. Its initial subset is 49,184 bytes;
  both original axes, hinting, shaping and tabular digits remain. Every other
  original character is available through a disjoint Unicode fallback using the
  complete original font. Retained glyph outlines and advances match exactly at
  weights 400/500/600/700 and optical sizes 14/32.
- Navigation prefetch competed with the opening scene. Unused route prefetch and
  eager Calendly widget loading are deferred until needed.
- Below-fold section layout and hero-note dimension reads added repeated work.
  Supported browsers defer below-fold layout using `content-visibility: auto`;
  note dimensions are cached by a resize observer. Original section content and
  focus/navigation remain available.
- Hosted tracing caught duplicate font transfers from cached CSS carrying an
  older deployment identifier. The final hosted preview uses a clean build.
  Use a clean release build to avoid reusing those stale font references.

## Verification

- Full test suite: 98 files / 2,219 tests pass.
- Production Webpack build includes TypeScript validation; changed-code lint and
  `git diff --check` pass.
- Four independent geometry tests compare all original Three.js edges and
  projected points at desktop/mobile sizes, rotated and scattered positions.
- Font regeneration verifies every retained glyph against the original font.
- Browser checks cover desktop, 390px phone and reduced motion: live catalog’s
  three packages, rotating/static logo, breakup, visible shader orb, offscreen
  drawing pause, six-pixel card lift, first-interaction menus, booking open/close,
  FAQ toggles and closing section. A keyboard focus jump into a deferred card
  retains the same focused link across runtime initialization. Screenshots and
  checks are in `evidence/hosted-browser/` (with local checks retained separately).
- A browser fixture blocks every framework chunk, proves that both native effects
  paint first, then releases hydration and checks identical adopted clocks and no
  hydration errors. No animation has been disabled to improve a test result.

Run the browser audit with `PLAYWRIGHT_MODULE` pointing to an installed Playwright
package and optional `BASE_URL` / `EVIDENCE_DIR`; the default URL is port 3101.
Private preview cookies can be supplied with `AUTH_COOKIES_FILE`; cookies are
never written into committed evidence. Build with the real public Supabase
configuration so the catalog is present; an empty preview catalog is not a
representative performance test.

The measurements are cold-cache Lighthouse lab runs, not guarantees for every
visitor. No field/CrUX data was available in the supplied report. The preview
uses production’s public catalog settings; private service integrations are not
part of this marketing audit.

## Release

The final clean hosted build passes the same browser checks, including keyboard
focus, with no exceptions or hydration errors. The branch is ready for owner
review. The repository’s
working rule says: “Commit per stage on the branch; do not push or merge without
the owner.” See `docs/dashboard-v1/HANDOFF-CONTEXT.md`, line 337. Production
publication requires the owner’s authorization, followed by fresh desktop and
mobile PageSpeed checks on `https://www.vigilstudios.co/`.
