# Production Library Action & CTA Integration completion report

5 October 2026, `vigil-studios`. This milestone extends the mature engine in place. Inventory remains **108 registrations / 73 Production components / 127 original Composition QA fixtures**. The connected action fixture is a separate variant of the existing nested 15-page fixture. Nine non-Production runtime predecessors also receive compatible contracts without promotion. Collection 009 and Collection 012 remain unstarted; Scar and unrelated application work are untouched.

## Audit and coverage

All 73 Production components were individually audited against executable schemas, renderers, existing controls and structural DNA. [AUDIT.md](AUDIT.md) lists **every component**, its classification, primary/secondary/item/media/whole-item capability and the reason for each intentionally actionless decision. [inventory.json](evidence/inventory.json) records the canonical metadata.

| Family | Audited | Primary | Secondary | Item | Media | Whole item | Actionless |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Navigation | 12 | 12 | 0 | 0* | 0 | 0 | 0 |
| Hero | 5 | 5 | 5 | 0 | 0 | 0 | 0 |
| Brand / Story | 6 | 4 | 0 | 0 | 0 | 0 | 2 |
| Media / Work | 12 | 11 | 0 | 12 | 8 | 1 | 0 |
| Services / Capabilities | 12 | 10 | 0 | 9 | 1 | 1 | 2 |
| Commerce / Product | 14 | 14 | 0 | 14 | 1 | 1 | 0 |
| Social Proof / Results | 12 | 7 | 0 | 3 | 0 | 0 | 4 |
| **Total** | **73** | **63** | **5** | **38** | **10** | **3** | **8** |

Counts overlap. *Navigation retains its existing typed per-destination menu, logo and utility editing independently of the new contextual item contract. Classification totals: **22 section-primary-action**, **5 section-primary-secondary-actions**, **36 mixed-action**, **2 per-item-action**, **8 no-action**.

The five Production heroes H09, H12, H16, HX01 and HX02 support primary, secondary, both and neither at their existing copy/panel/scene/context positions. Eight intentionally actionless systems: Decision Ledger and Manifesto Fold preserve complete editorial statements; Capability Manifesto preserves its promise and boundaries; Capability Coverage preserves the aligned inspection matrix; Margin Voice preserves attributed testimony; Credential Library keeps verification destinations inside disclosures; Moving Chorus E06 preserves its continuous-motion and complete still-view architecture; Review Reading Room retains review evidence and source links. Their exact rationales are in the audit.

Item-capable systems retain stable service, project, product, collection, case and relationship identities. Work Viewport Gallery and Proof Case Cross-section intentionally offer only item navigation. Media-capable systems are Open Index, Project Chapters, Contact Room, Screening Room, Photographic Promenade, Gallery Hanging, Campaign Folio, Campaign Score, Service Field Atlas and Collection Atlas. Whole-item modes are limited to Offering Index rows, Gallery Hanging figures and Collection Atlas entries. Video controls, disclosure summaries and selection thumbnails remain independent controls.

## Architecture, customization and registry

The existing `Action` union and central `resolveAction` remain authoritative. The optional `contextualActions` section envelope introduces discriminated enabled slots, visitor labels, separate `ActionPresentation` and stable item group/identity/display bindings. No resolved route is persisted. `SectionContract.actions` is attached to existing registry composition metadata, preserving family contract identity. Schema parsing rejects unsupported slots, presentation and interaction combinations; the editor consumes those same finite declarations.

The [Action contract](../ACTIONS.md) documents every option: seven semantic visual variants (primary/secondary/outline/ghost/text/underline/inverse); small/medium/large where appropriate; left/center/right on compatible continuation groups; auto/full width; none or 20 typed Vigil icons; leading/trailing icon position; inherit/light/dark/brand surfaces; token-based shape; and declared link/media/whole-item display. `display` size is reserved by schema and intentionally offered by no current component. H12 and editorial/item actions have restrained subsets; scene/hero alignment follows structural controls. No arbitrary radius, unsupported large editorial button or media button presentation is exposed.

`DesignButton` supplies native semantics, token styling and shared focus/hover/disabled behavior. Section/nav/item/media consumers share resolution and capability context. Component-specific action placement, copy hierarchy, typography, art direction, media and existing evidence integrity remain intact. Existing proof-link CSS now excludes typed action links so it cannot override contrast; product-link and Pocket Dock rules no longer mask semantic sizes. Scene ink inheritance does not override explicitly selected surfaces.

## Editors, routes and persistence

Composition Lab offers supported primary/secondary/item slots, enable/disable, labels, typed destinations, permitted presentation/display controls, real-section hover/focus audition, Escape restoration and explicit commit. It can remove stale item actions and restore authored fallbacks. Page options follow the actual ordered Site hierarchy with nested arrows, readable names and derived routes while storing page IDs. Section options use the selected page's effective section IDs, including inherited/replaced globals. External URL, email, phone and download editors validate appropriate values.

Design Lab resets action inspection when changing components and shows canonical capability rationale/metadata and permits presentation inspection with a clearly labelled external example. Creative-study workspaces and artifacts remain independent. The example is transient inspection state; real client configuration belongs in Composition.

Disabling a configured CTA retains its label, destination and presentation for re-enabling; unsupported presentation is rejected even while inactive; inactive self-targets also remap during duplication. Site version 1 remains compatible. Optional slots and presentation serialize with the existing Site/Page/Section document, survive local persistence/import/export and are usable as client source data. Old href payloads and typed path bindings remain supported; contextual overrides control their slot. No migration is needed. Duplication remaps self page/section destinations; deletion impact includes contextual incoming targets. Missing page, section or item identities surface in QA and block affected page preview, without a stale href fallback. Standalone unavailable targets do not navigate.

The connected fixture verifies Home Hero → Contact, independent Services items → nested service pages, Work → Project Alpha, and Result → Project Beta. Renaming Contact to `/book` and moving Web Design from Services to About derive `/about/web-design` without changing stored IDs. Reload preserves the complete configuration. Native media interaction follows the selected page inside Composition Lab.

## Accessibility and responsive behavior

Navigation uses anchors; selector, disclosure, pause and video interactions retain native controls. Whole-item links use one visible stretched anchor, without duplicate hidden links or nested interactive elements. Media links use one labelled anchor around the principal image, never a video with controls. Decorative typed icons do not duplicate accessible names. Actions maintain 44px minimum targets, readable wrapping, visible keyboard focus, native download attributes and non-navigating unavailable states.

At narrow container widths, primary/secondary groups stack intentionally, button treatments fill available width and restrained text links keep their reading alignment. Long labels are checked at **1920 / 1440 / 768 / 390 / 320px**. Existing structural scene alignment and mobile navigation architecture are retained. Hover uses restrained underline/icon movement and respects motion-none/reduced-motion preferences.

Automated action accessibility audits cover all 65 Production systems with a contextual action. Surface combination audits cover all exposed primary variants × four surfaces on seven representative systems in neutral/light and technical/dark themes. Existing family suites continue covering original controls and layouts. The actual Composition and Design CTA inspectors are also audited. Arbitrary future client colors, supplied photography and content still require review in their actual composition; these checks verify the supplied token/themes/fixtures, not every possible client input.

## Verification evidence

Final command/browser totals:

- Unit/integration suite: **69 files / 1,239 tests passed**, including **108 new action tests** and all prior suites. [tests.log](evidence/tests.log). Run: `npm run test -- --maxWorkers=1`. Exploratory parallel runs hit existing PDF-extraction and worker timeouts under concurrent load; the final sequential full run passed without changing those tests.
- Typecheck: **passed**. [typecheck.log](evidence/typecheck.log).
- Lint: **passed**. [lint.log](evidence/lint.log).
- Production build: **passed**. [build.log](evidence/build.log).
- Production browser matrix: **4,604 passing** assertions, including 365 responsive component/width assemblies, every offered presentation choice, native item modes, keyboard focus, reduced motion, 65 action WCAG audits and all four connected journeys. [browser.json](evidence/browser.json), [summary](evidence/browser-run.log).
- Surface accessibility matrix: **337 checks passed**, no violations or console errors. [surfaces.json](evidence/surfaces.json).
- Media geometry regression matrix: **49 checks passed**, comparing all image dimensions/crops before and after media linking at 1440/320px, including the alternating second Collection Atlas entry, plus native target/focus checks and inherited Collection Atlas heading typography. [media.json](evidence/media.json). Work chapter/campaign links stay in the narrative grid cell; media wrappers preserve principal-picture aspect ratios and alternating atlas sizing.
- Actual Lab browser journey: **32 checks passed**, including two inspector WCAG audits, serialization/reload, hover/focus/Escape, typed destination editing, native download, disabled/secondary-only with retained configuration, item/whole/media controls, slug/reparent and deletion diagnostics. [lab.json](evidence/lab.json).
- Unexpected browser console/page errors: **zero** across final Production, surface and Lab runs.

Reproducible browser harness: `scripts/design-engine-actions-qa.mjs` bundles the real production sections and both real Labs with existing local esbuild; the loopback server uses port 4291. Browser scripts are `design-engine-actions-browser.mjs`, `design-engine-actions-surfaces.mjs`, `design-engine-actions-media.mjs`, `design-engine-actions-lab.mjs`. Playwright/Chrome and axe use the existing local QA installation; no application dependency was added. The harness waits for committed React configuration, respects modal focus scopes and checks settled colors rather than transition frames.

Visual evidence includes full-page desktop/narrow-mobile captures for H12, HX01, HX02, Offering Index, Gallery Hanging, Collection Atlas and Outcome Equation, plus [Composition controls](evidence/composition-actions.png) and [Design controls](evidence/design-actions.png). Screenshots were reviewed for the compact H12 panel, scene context, record-level link placement and narrow label wrapping. Final evidence supersedes intermediate failed assertions.

## Documentation and scope

Created [ACTIONS.md](../ACTIONS.md), the complete [audit](AUDIT.md) and this report. Updated architecture, Page architecture, future component contribution requirements and the concise Astra context. Future collections must explicitly decide action requirements and verify only supported controls. No lifecycle promotion, creative-study rewrite, new collection, backend booking/modal/cart/checkout, CMS, page recipe, Motion Engine expansion, AI composition or Scar work is included.
