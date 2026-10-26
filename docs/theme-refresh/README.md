# Light theme refresh

The active worktree is `vigil-studios-light-theme`, on
`codex/light-theme-refresh`, based on fetched `origin/main` commit `cfd7075`.
The local preview runs at http://127.0.0.1:3190. The original main checkout and
its unrelated unfinished work are preserved.

## Shared light palette

| Use | Color |
| --- | --- |
| Canonical accent (`--accent`) | #12bf60 |
| Accent hover | #0eac54 |
| Accent fill | Alias of `--accent` |
| Positive status and chart fill | Alias of `--accent` |
| Home canvas | #fafafa |
| Home alternate sections | #f4f5f7 |
| Client/admin dashboard canvas | #f6f7f9 |
| Dashboard panels, sidebar, header and inputs | #ffffff |
| Primary text | #18181b / #1c2026 |
| Secondary text | #60646c / #606773 |
| Text inside solid accent buttons | #04351b |
| Borders | #e0e2e6 / #e0e4e9 |

The approved spring green is the main light-mode accent throughout the home
page and shared client/admin frame. Links, outlines, icons, focus rings,
selected navigation, status text, badges, charts, buttons and progress bars use
that same accent. There is no separate dark green accent or status override.
The light accent section derives its tint from the canonical green.

## Theme and navigation

Both roots share an early bootstrap and preference store. A saved choice takes
priority; otherwise the device preference applies, including live changes.
Storage being unavailable does not prevent theme switching. The home navbar has
a compact outlined sun/moon control on desktop and phone layouts.

Get started and Find my website fit retain production's `/find-your-fit` flow.
The production startup optimizations, canvas renderer, local font bundling and
current dashboard features are retained. Customer website designs keep their
own design-system palettes.

## Hero startup fix

WireMark and HeroWords use InitialPaintScript: executable JavaScript in parsed
server HTML, inert text/plain during client renders. This follows Next.js's
preventing-flash-before-hydration guide. Effects take ownership during hydration
and client navigation, so returning home does not produce React script warnings.
An ownership observer also removes the early wire runtime's listeners and
observers immediately in reduced-motion mode.

## Verification

The browser suite checks computed accent colors on the home page and actual
client/admin AppFrame, status, navigation and widget components with fictional
data. Dashboard previews do not access customer data. The temporary preview
route and its generated development types are removed after verification.

`theme-browser.mjs` covers theme defaults, persistence, blocked/invalid storage,
client/admin palettes, website-fit navigation, responsive layouts and React
console warnings. `hero-navigation-browser.mjs` checks startup while framework
scripts are blocked, reduced-motion cleanup, repeat client navigation and themes.
Captures and reports are in `evidence/`.

With a local server running, use an installed Playwright package:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/theme-browser.mjs
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/hero-navigation-browser.mjs
```

`THEME_QA_APP` selects another local origin.

Current palette verification: 56 browser checks passed, including the canonical
accent, home outline CTA, client selected navigation and success text, and admin
navigation/status colors. No thrown errors or React script/hydration warnings.


The website-fit radio indicator uses a white center and canonical green ring in
light mode. Dark mode retains its native rendering, and forced-color mode uses
the browser's native control. Five browser checks verified appearance, keyboard
selection in both themes and the forced-color fallback.

Release validation: lint, production build, all 2,603 unit tests and all four
dependency-security checks passed. The complete browser verification comprises
56 palette/navigation checks, 24 hero startup/navigation checks and five radio
checks, with no thrown errors or React hydration/script warnings.
