# Lab workflow changes — 1 October 2026

The Composition workspace now starts with zero sections and default page/site layers. Demo compositions remain selectable as optional starting content. Layout replaces the Sections tab; the shared Design/Composition control panel is named Editor.

## Choosing sections

Section type remains a native select. Styles are visible buttons with hover and keyboard-focus previews in the real canvas. Preview data never enters the authored composition; leaving the list, changing tabs/type or pressing Escape removes it. Click, Enter/Space or touch commits the exact validated insertion immediately and moves focus to the Section editor. There is no second Add button. The preview has a dashed outline and a temporary notice.

Empty compositions are accepted as drafts. New and replacement styles choose a supported local typography/art-direction layer when the inherited layer is unsupported, without changing site/page settings. The style list discloses those local layers. This fixes Object Study under the default publication art direction. Object Study also works as a replacement for an existing hero. Existing one-Hero/Navigation/Footer constraints, overlay safety and the 20-section bound remain enforced with explicit reasons. A demo already containing a Hero cannot accept a second Hero; replace or remove its existing Hero.

Clear canvas is available in the toolbar. It opens a native modal confirmation, initially focuses Cancel and traps focus through native dialog behavior. Cancel/Escape retain the composition and return focus to the trigger. Confirm resets every section and site/page customization to blank defaults. This is an explicitly destructive reset with no undo.

## Zoom

The shared Lab canvas handles trackpad pinch through nonpassive Ctrl-wheel events and native WebKit gesture events. Ctrl/Cmd + mouse wheel also zooms, retaining the logical position beneath the pointer where scroll bounds permit. Ordinary scrolling pans; editor-panel scrolling does not change canvas scale. Zoom is bounded to 10–300% and the selector displays the current gesture-derived value. Authored desktop/tablet/mobile artboard widths stay unchanged.

## Verification

- Full suite: **531 tests in 60 files passed**, including all 91 composition fixtures and section-addition audits, empty drafts, and Object Study across inherited art directions.
- Typecheck, lint and production build passed. Logs are in `evidence/`.
- **28 browser workflow checks passed** with no unexpected console/page errors. They cover transient previews, keyboard cancellation, exact one-click insertion, supported replacement, blocked duplicates, pointer-anchored zoom, ordinary wheel pan, modal Cancel/Escape/confirmation, optional demos, complete reset, keyboard activation, commerce on a blank page and touch tap.
- Automated WCAG A/AA audit of the populated editor reported zero violations.
- Screenshots of the hover preview, confirmation dialog and populated editor were visually inspected.

Run the existing `scripts/design-engine-qa.mjs` with `DESIGN_ENGINE_AXE` set to the axe script, serve `/tmp/vigil-design-engine-qa` on loopback port 4187, then run `scripts/design-engine-lab-workflow.mjs` with `PLAYWRIGHT_MODULE` set to the installed Playwright module. The harness exercises the actual Lab components without adding an application route or bypassing staff authentication. Physical trackpad hardware and Safari were not used: wheel and WebKit gesture event handling were exercised in local Chrome. Native touch input was exercised through a touch-enabled browser context. No signed-in staff session is claimed.
