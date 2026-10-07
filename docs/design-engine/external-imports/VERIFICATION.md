# External imports — verification

Verified locally on 6 October 2026 in `vigil-studios`. The engine is already TypeScript/Tailwind/Next.js; no package or lockfile change was needed.

## Automated gates

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | Pass; no warnings |
| Types | `npm run typecheck` | Pass |
| Production build | `npm run build` | Pass; compilation and all 56 static pages completed |
| Full suite | `npx vitest run --maxWorkers=1 --testTimeout=30000` | 1,284 tests / 71 files passed |
| Focused final integration tests | `npx vitest run lib/design-engine-external-imports.test.ts lib/design-engine-client-preview.test.ts lib/design-engine-evidence-production.test.ts --maxWorkers=1 --testTimeout=30000` | 242 tests / 3 files passed |

The final full run passed 1,284 tests across 71 files. Three additional tests verify Page and Section actions after slug changes and page reparenting for each new system. The focused run includes all ten external-import tests. One worker and an explicit timeout keep exhaustive section-addition tests from competing with browser/build work.

Coverage includes production rendering, strict serializable configuration, optional actions, stable item identities, thumbnail budgets, unsupported action rejection, backward-compatible gallery/chorus defaults, source evidence integrity and equal-area sphere geometry. Existing production inventory assertions now account for 111 registrations, 76 Production systems and 137 compositions.

## Browser and layout

The loopback QA entry imports the real registry, renderer, Design Lab and Composition Lab. It uses existing client-adaptation fixtures and engine styles; it does not modify authenticated app routes. Scripts and evidence are retained for review:

- `scripts/design-engine-imports-qa.tsx`
- `scripts/design-engine-imports-browser.mjs`
- `scripts/design-engine-imports-lab.mjs`
- `scripts/design-engine-imports-final-browser.mjs`

The local QA bundle was built with the existing `scripts/design-engine-pass008-qa.mjs` script, with `DESIGN_ENGINE_QA_ENTRY=scripts/design-engine-imports-qa.tsx` and `DESIGN_ENGINE_QA_OUTPUT=/tmp/vigil-imports-qa`, then served on loopback port 4299. These scripts use the local Chrome, Playwright and axe installations identified in the scripts; they are QA utilities rather than application dependencies.

**384 render/layout checks passed**, with zero unexpected console errors, failed visible media or document overflow. Coverage spans gallery, columns, perspective, hero, timeline and sphere at 1920, 1440, 1280, 768, 390 and 320 pixels; maximum allowed content; all ten typography profiles; six art directions for the compatible systems and the gallery's three declared directions. Twelve axe audits (desktop/narrow for each reference) reported zero WCAG 2/2.1 A/AA violations. Automated accessibility checks supplement the interaction tests and visual inspection; they are not a substitute for a screen-reader audit.

Interaction evidence confirms measured vertical/horizontal loop periods, persistent pause, reduced-motion static views, pinned timeline progression and its named reading switch, and sphere modal opening, focus containment, Escape closing and focus restoration. Screenshots cover every reference at 1440 and 390 pixels.

**16 Lab checks passed**, with zero unexpected console errors: all five systems render in Production inventory and their mixed Composition contexts; hover and keyboard option previews work; Escape rolls back; commit retains the choice; item action controls appear; and a saved sphere composition survives reload.

**11 final interaction checks passed**, with zero unexpected console errors: the 32-record sphere stays bounded; pointer dragging rotates without opening a spotlight; deliberate selection opens it; sphere and ribbon stop when offscreen; timeline active/static views work; and all three new systems fit a narrow artboard.

See [browser results](evidence/browser.json), [Lab results](evidence/lab.json) and [final interaction results](evidence/final-interactions.json). Representative visuals: [paired gallery](evidence/gallery-1440.png), [columns](evidence/columns-1440.png), [perspective](evidence/perspective-1440.png), [hero](evidence/hero-1440.png), [timeline](evidence/timeline-390.png), [sphere](evidence/sphere-390.png), [Design Lab](evidence/design-lab.png) and [Composition Lab](evidence/composition-lab.png).

## Performance review

No dependency, duplicate avatar/card system or global animation service was added. Existing measured loops now support both axes and pause outside the viewport or hidden tab. Sphere positioning is O(n) over at most 32 authored records, uses refs for animation transforms, and requires explicit thumbnails above eight images. Timeline measures local overflow, batches scroll work into an animation frame, observes its own frame and falls back when content cannot fit. Resize/intersection observers, listeners and frames clean up on unmount. Static alternatives preserve every record without animation copies receiving focus or accessibility exposure.

The browser results establish bounded layout and suspension behavior. No cross-device frame-rate or network benchmark is claimed. Publication of illustrative client fixtures remains subject to the existing engine evidence/media rules.

## Logs

Successful gate and browser logs are retained alongside JSON and screenshots in `evidence/`: `tests.log`, `focused-tests.log`, `lint.log`, `typecheck.log`, `build.log`, `browser.log`, `lab.log` and `final-interactions.log`.
