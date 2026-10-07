# Verification · Collection 006

1 October 2026. **Creative review ready; no production approval or promotion.**

## Repository checks

- `npm run typecheck`: passed.
- `npm test -- --reporter=dot`: **327 tests passed in 55 files**. Five new tests cover all 36 valid adaptations, required media and content bounds, duplicate IDs, relationship-column validation, strict rejection of unrelated commerce data, preservation of earlier lifecycle/human review decisions and readable composition labels with stable IDs.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed, including the existing dynamic `/admin/lab` route.
- No auth, database, schema migration or production registry changes. Database validation was not needed for this Lab-only change.

Logs are preserved in `evidence/{typecheck,tests,lint,build}.log`.

## Browser and visual verification

The standalone loopback harness imports the actual Collection 006 preview and gallery components. It uses the same scoped CSS and the existing licensed font files. It does not add an app route, expose customer data or bypass staff authorization.

- **108 resting-state cases:** 12 concepts × 3 adaptations × 1440/768/390px real browser viewports. No horizontal overflow, broken loaded images or axe WCAG 2 A/AA and 2.1 AA violations. See `evidence/browser-matrix.json`.
- **54 refinement checks:** repeated the affected concepts across all three contexts and viewports after fixing typography specificity, mobile poster scale, atlas offsets, media descriptions and the mobile matrix column structure. No overflow or automated accessibility violations; all images loaded. See `evidence/refinement-checks.json`.
- **Keyboard with OS reduced motion:** capability and case selection, need selection, native disclosure via Space, mobile phase selection and independent scope selectors. Pressed states updated; activation retained focus. Service-summary links focused their destination heading and Return to offerings restored the original link. See `evidence/keyboard-reduced-motion.json`.
- **Gallery workflow:** Study/Contract/Review tabs, all twelve overview entries, adaptation control, phone artboard, correct two-column mobile matrix, zoom and inspect-from-overview all worked. No click-through on inert overview artwork. See `evidence/lab-workflow.json`.
- Captured desktop and phone screenshots for every concept, distributed across the three adaptations. Representative frames were visually inspected for typography, media, disclosure hierarchy, timeline, table readability, meaningful connectors, discovery flow and differing rhythms. All-pair structural comparison is in `ANTI_CONVERGENCE.md`.
- Visual review corrected issues the automated checks did not flag: orphaned last letters in mobile poster verbs, atlas offsets suppressed by a higher-specificity reset, and a hidden-column table whose cells became too narrow. C07 now renders a real two-column mobile table instead of hiding columns in a table with desktop colspans.
- Lazy images were explicitly loaded before evidence captures so full-page screenshots show the complete media. Runtime still uses native lazy loading.

Automated accessibility checks are supporting evidence, not an accessibility certification. These are bounded study fixtures; exhaustive production content extremes, real client asset delivery, assistive-technology testing and mixed-composition performance remain part of the future selected-implementation gate.

## Authentication boundary

The production-built `/admin/lab` route correctly redirected this browser session to `/login?next=%2Fadmin%2Flab`. The session had no staff login, so authenticated application-shell verification was not completed. No authentication state or access checks were altered. The Collection 006 gallery itself was exercised through the isolated fixture harness; compilation verifies its integration into the existing staff route.

## Review reproduction

From the repository root:

```sh
node scripts/design-engine-services-qa.mjs
python3 -m http.server 4176 --bind 127.0.0.1 --directory /tmp/vigil-service-qa
```

Open `http://127.0.0.1:4176/` for actual viewport studies or append `?lab` for the gallery/editor. To include a locally installed axe runtime, set `DESIGN_ENGINE_AXE` to its `axe.min.js` path when building the harness. No new runtime dependency was installed. The main application review location remains **Lab → Design → Collection 006 · Services / Capabilities** after staff sign-in.

## Preserved boundaries

54 existing registrations and 18 Production entries remain. Collection 004 S04/S05 and Collection 005 M03 retain their revision/rejection decisions. C01–C12 have no registry source-concept entry, creative approval or production status. All 35 existing Composition fixtures keep their IDs and section content; only their visible names changed. No new Composition recipes were introduced.

Stop here for human review. Recommended experiments: C01, C03, C07, C09 and C11. No next collection has begun.


## Subsequent human approval — 1 October 2026

After the verification above, the user approved all twelve Collection 006 concepts and especially favored C03/C10 for imagery and animation potential. The canonical review ledger and Gallery review text now reflect approval. The original verification and shortlist above describe the pre-review handoff. H09/H16 creative approval was reaffirmed separately; no migration, rendering change, new animation or production promotion is part of this follow-up.
