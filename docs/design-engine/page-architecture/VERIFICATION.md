# Page & Site Architecture Foundation — verification

Verified 2026-10-05. Portable contracts and architecture are documented in [PAGE_ARCHITECTURE.md](../PAGE_ARCHITECTURE.md). This milestone extends the existing engine without new component registrations or collection generation.

## Final results

| Check | Result | Evidence |
| --- | --- | --- |
| Full regression suite after navbar editor follow-up | 1,131 tests passed, 68 files | [tests.log](evidence/tests.log) |
| Site architecture coverage | 53 tests passed within the full suite | `lib/design-engine-site.test.ts` |
| Standalone TypeScript check | Passed | [typecheck.log](evidence/typecheck.log) |
| Full ESLint check | Passed | [lint.log](evidence/lint.log) |
| Next production build | Passed, including `/admin/lab` | [build.log](evidence/build.log) |
| Browser workflows/layouts | 102/102 passed | [browser.json](evidence/browser.json) |
| Touch/keyboard/persistence/accessibility workflows | 56/56 passed | [accessibility.json](evidence/accessibility.json) |
| Automated WCAG A/AA audits | 15 audits, zero reported violations | [accessibility.json](evidence/accessibility.json) |
| Unexpected browser errors | Zero in both automated runs and observed authenticated Lab session | Browser/accessibility JSON and [live observations](evidence/live-route.json) |

The first final suite run overlapped the production build and exceeded the existing five-second timeout in the exhaustive composition/typography rendering test. The complete suite then passed in 21.96 seconds with the build finished. No timeout was increased or assertion removed. The retained log is the final passing run.

Tab-order follow-up: Pages now replaces Page between Layout and Site and includes both the Site Tree and page creative overrides. The 143 Composition/Site regression tests, standalone typecheck and focused lint passed after this change. The authenticated Lab confirmed the five-tab order, page controls, audition notice, Escape rollback and ArrowLeft navigation from Pages to Layout, with no observed errors. Screenshot: [pages-tab-order.jpg](evidence/pages-tab-order.jpg).

Navbar routing follow-up: menu items now expose label/page-destination controls directly, including nested items; the button, logo and utility links use the same destination picker. Fifteen additional tests cover automatic-to-custom conversion, stable internal targets, nested reordering/removal, shared CTA preservation, home/utility bindings, capability validation and atomic rejection of unsafe/broken destinations. The final full suite passed in 30.42 seconds, followed by full lint, standalone typecheck and production build. The updated browser/accessibility script checks direct shared CTA, logo and menu routing, adds a navbar-editor axe audit and passes all 56 checks/15 audits. The original 102 layout/workflow cases remain the foundation run; the updated editor was separately exercised in the authenticated Next Lab: “Book a call” → Contact saved, rendered `/contact`, and selected `page-contact` without leaving the Lab. The original automatic menu was restored afterward. Screenshot: [navbar-page-destinations.jpg](evidence/navbar-page-destinations.jpg).

## Regression coverage

The site suite covers strict JSON round trips, all 127 legacy composition migrations, complex fixture rendering, normalized/explicit/nested routes, duplicate routes, missing parents/cycles, deep hierarchies, stable IDs through rename/move, descendant route history, sparse sibling ordering, independent page editing, duplication identities/self-action retargeting, deletion strategies/incoming actions, globals/slot ownership, all six action types, safe binding paths/missing fields, all twelve production Navigation capability boundaries, selected/flat navigation scopes, semantic page-type registration and Services/Commerce page-aware destinations.

Existing component, approval, capability, configuration, rendering, dashboard and application regression suites remain included. A pre-existing React `createElement` typing failure in the Evidence test was corrected without changing its provider/child runtime behavior.

## Browser and mobile coverage

The disposable bundle mounts the real `ProfessionalLab` and portable `SitePagePreview` implementations. It is separate from the authenticated Next application and does not modify application authentication.

Composition editor checks import the 15-page fixture and exercise selection, isolated section removal, rename/slug changes with an incoming page-ID action, nested reparenting/descendant routes, sibling reorder, duplication, canceled/confirmed deletion, add, invalid parent choices, duplicate route rejection, incoming/broken action warnings, typed-action editing, reload persistence and internal preview navigation. Switching Design/Composition preserves site state and leaves Design inspection available.

All twelve production Navigation identities are checked at 1440px and 390px: Datum, Meridian, Dispatch, Pocket Dock, Viewfinder, Switchboard, Atlas Hall, Folio Takeover, Margin Rail, Threshold, Channel Directory and Open Doors. Checks cover horizontal overflow, direct links or menu opening as appropriate, keyboard activation, Escape closing and trigger focus restoration. Atlas Hall and Channel Directory render the complete fixture hierarchy; limited systems use an explicitly authored five-entry selection with a supported flat/two-level projection. Tests do not silently truncate unsupported trees.

Both deeper systems traverse a nine-level mobile hierarchy under reduced motion. Channel Directory retains staged department selection and Back focus restoration; Atlas Hall retains its directory structure. Touch-enabled browser contexts tap every mobile menu and both nested product disclosures; disclosure targets measure at least 44px high. Keyboard testing found and fixed a closed nested disclosure consuming Escape: Escape now collapses an open group before bubbling to close the outer menu.

Fifteen axe audits cover the twelve open mobile menus, Site Tree/page controls, direct navbar routing editor and typed-action inspector. Native deletion-dialog focus containment, Escape restoration and tab arrow navigation are also exercised. These are automated audits and explicit interaction checks, not a complete screen-reader audit.

Persistence checks verify complete JSON export, atomic invalid import, corrupt local-draft preservation and explicit Save recovery. Both runs report no unexpected console/page errors.

## Authenticated Next Lab observation

The existing signed-in session at `http://127.0.0.1:3000/admin/lab?workspace=composition` was exercised separately through native browser automation. The complex fixture showed all 15 pages and rendered Home. At a 390px authored artboard, Explore departments → Shop → Apparel displayed Product Alpha/Beta and their nested routes. Selecting Product Alpha stayed in the Lab and rendered `page-product-alpha` with `navigation.channel-directory`, `hero.object-study` and `commerce.material-anatomy`. The observed browser error log was empty. The session was returned to desktop/Home. This observation is not included in automated harness totals.

## Reproduction

Run repository checks sequentially to avoid unnecessary CPU contention:

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Build and serve the disposable fixture from the repository root, then run browser checks in a second terminal:

```sh
node scripts/design-engine-site-qa.mjs
python3 -m http.server 4290 --bind 127.0.0.1 --directory /tmp/vigil-site-qa
```

```sh
node scripts/design-engine-site-browser.mjs
DESIGN_ENGINE_AXE=/absolute/path/to/axe.js node scripts/design-engine-site-accessibility.mjs
```

Scripts reuse the established local Chrome/Playwright setup. Set `PLAYWRIGHT_MODULE` to another installed module if needed. Accessibility uses `DESIGN_ENGINE_AXE` or the existing `/tmp/vigil-pass008-qa/axe.js` fixture. Evidence is written beside this file. The bundler also accepts `DESIGN_ENGINE_AXE` to copy the test runtime. No production dependency was added.

## Visual evidence

![Composition Lab with the complex Site Tree](evidence/site-tree-desktop.png)

![Channel Directory mobile department index](evidence/channel-directory-mobile.png)

Screenshots for the other eleven mobile Navigation identities are retained beside these.

## Intentional limits and deferred work

- Footer has validated global/inherit/omit/replace slots; current inventory has no contributed production Footer. No unrelated component was substituted.
- The site graph has no arbitrary shallow depth limit. Existing section count, Navigation entry/label/group bounds and host URL limits still apply with explicit diagnostics.
- Persistence is versioned portable JSON and one local browser draft, without cloud collaboration. Customer hosts supply routing, SEO application, assets/fonts, publication and any reviewed redirects from historical route candidates.
- Recipes/detail grammars, dynamic content/CMS, AI composition, Collection 009, new overlays, dedicated Motion Engine, customer workspace/repository automation, automatic sitemap generation and Express generation remain deferred. Scar was untouched.
