# Collection 007 · verification

1 October 2026 · **Human creative review passed for P01–P14**. The implementation evidence below is from the original review submission; productionization remains a separate pass.

## Automated gates

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript | Passed, no diagnostics | `evidence/typecheck.log` |
| Repository ESLint | Passed, no diagnostics | `evidence/lint.log` |
| Full Vitest suite | **453 tests, 59 files passed** | `evidence/tests.log` |
| Commerce-specific suite | **46 tests**: 42 adaptation cases plus lifecycle/currency/invalid-data checks; each adaptation exercises authored, long-copy and missing-media rendering | `lib/design-engine-commerce.test.ts` |
| Production build | Passed; `/admin/lab` included as a dynamic staff route | `evidence/build.log` |
| Browser layout/content matrix | **336 cases**, no document/component overflow or broken image loads | `evidence/layout.json`, `evidence/browser-matrix.log` |
| Automated accessibility | **84 audits**, no WCAG 2 A/AA or 2.1 AA rule violations in the study subtree | `evidence/accessibility.json` |
| Interaction/keyboard/workspace | **25 checks passed**, no page errors | `evidence/interactions.json` |
| Reduced motion | **42 adaptations checked**; no CSS animations/transitions, hidden essential content or autoplay | `evidence/interactions.json` |

Browser matrix: fourteen studies × three contexts × four authored viewport widths (1440, 768, 390, 320), plus long-copy and missing-media modes at 1440 and 390. This is 168 authored + 84 long-copy + 84 no-media cases. All visible product links/buttons/selects/disclosures measured at least 44px high. Option radios use larger labelled wrappers. Horizontal sequence overflow is intentionally local; descendants inside those regions are excluded from the document-boundary detector and their advancement is tested separately.

All 42 adaptations were audited at 1440 and 390px. Automated audits may return incomplete checks requiring judgment; this is not a conformance certificate. No manual screen-reader session or real-device Safari/Firefox certification is claimed.

## Keyboard and interaction coverage

- Product link opens an in-study destination summary and focuses its heading; Return restores the originating link.
- Native refinement disclosure opens with Enter. Category + available-only filtering changes the bounded list and announces count. Price order changes only the supplied fixture slice.
- Look/item buttons work with keyboard activation; changing the look resets the product selection to a valid record.
- P07/P14 previous/next controls advance native horizontal regions without expanding document width. The scroll region itself is focusable; there is no wheel interception or mandatory swipe.
- Material selection changes the named detail and corresponding image.
- P10's 360 entry is clearly a static fallback. Video is controlled, paused on selection and never autoplay; switching media removes the video element.
- Native radio arrow keys move through sizes. Available, unavailable and nonexistent combinations produce distinct truthful receipts; nonexistent variants do not display a fabricated resolved price.
- Comparison changes candidate while retaining the baseline.
- Design Lab opens Collection 007, changes a real artboard to 390px, exposes the Product Detail capability in Contract, compares fourteen inert previews, and returns through Inspect. Collection 006 remains reachable.

## Browser and visual review

Automated checks use installed local Chrome through a disposable, loopback-only QA bundle. The bundle renders the actual `CommerceStudyPreview`, `CommerceCollectionGallery` and existing `DesignLab` components and loads the existing local font fixtures. It does not add a public or unauthenticated application route. Supporting scripts are `scripts/design-engine-commerce-{qa,matrix,interactions}.mjs` and the `.tsx` QA entry.

The native in-app browser also verified the existing Design Lab workspace selector, Collection 007 controls, keyboard disclosure, category selection and available-only count. Representative desktop/mobile images and the fourteen-study contact sheets were visually inspected, including the shop-the-look mobile layout, detail inspection, skincare option worksheet and technical comparison. Individual final screenshots for each context at 1440/390px are retained as `P01-0-1440.png` through `P14-2-390.png`; `0` is streetwear, `1` skincare, `2` audio.

**Authentication limitation:** opening the actual `http://localhost:3000/admin/lab` route redirected to the existing staff sign-in page. This browser session was not signed in, so authenticated route interaction was not verified. The app route import and production build are verified; component interaction is verified through the isolated harness. No auth bypass or seeded account was added.

The harness supplies neutral opaque chrome tokens and basic CSS reset because it is independent of the app's global styles. The current screenshot `evidence/lab-review-ready.png` captures the final Lab layout after artboard sizing settled. The user-facing preview is available at `http://127.0.0.1:4178/?workspace` while the local review server is running. In the real application, use Lab → Design → Collection 007 · Commerce / Product after staff sign-in.

## Findings corrected

1. The first visual draft of Material anatomy duplicated the overview in its inspection well. Six reference-based generated details now establish the intended object/detail relationship, and the single-product gallery/folio use those related views.
2. The first campaign sequence allowed absolutely positioned assistive sale-price text to expand the page's scroll width. Positioning containment now keeps it within the study/native scroll region. The final 336-case matrix has zero overflow failures.
3. The editorial lead repeated its introductory copy. It now carries a separate buying perspective.
4. Apparel product photography was corrected so the charcoal cargo record uses the charcoal model plate, not the unrelated olive training image.
5. The initial automation selector for a wrapped native select was too strict about label text. The check now targets its accessible combobox role/name; native keyboard disclosure and real filtering were independently verified in the in-app browser.

## Contract and lifecycle preservation

Strict schemas reject unknown provider/backend fields, malformed media, inconsistent sale prices, invalid/duplicate variant combinations, cross-currency variants and misaligned comparison criteria. Money formatting tests cover USD, JPY and KWD exponents. All 42 models validate under mechanism-specific schemas. Serial render checks require h2 semantics, valid destination affordances, no autoplay and no images in missing-media mode.

Registry count is unchanged at **68**, with **32 Production** implementations. No change was made to the canonical creative-review ledger, lifecycle promotions, existing component registrations or the 63 Composition fixtures. Study proposals alone introduce commerce family/page awareness and the Product Detail building-block usage label. Existing uncommitted repository work was preserved; no commit, push, publication or deployment was performed.

## Review handoff

Read [the complete report](README.md), [91-pair comparison](ANTI_CONVERGENCE.md) and [asset provenance](ASSET_NOTES.md). The recommended first proofs are P01/P02/P05/P06/P08/P10. This is the original recommendation only; the user subsequently approved all fourteen concepts. P08’s close-up imagery preference is recorded as media guidance, with no foundation change. No commerce backend, completed page, Collection 008 or productionization follows in this task.
