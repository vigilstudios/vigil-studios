# Collection 003B — Approval and navigation refinements

Recorded 2 October 2026. **NX01–NX12 are all creatively approved.** The owner values each concept’s flexibility and customization, identifies NX04 as an important customer direction, and explicitly defers mobile refinement. The canonical dispositions are in `design-engine/registry/creative-review.ts`.

## Implemented in the existing Lab

Open `/admin/lab` → Design → Collection 003B · Navigation Expansion. The Study inspector exposes the new controls; Review records the approval. These remain experimental Lab implementations. Production registration/migration has not occurred.

- **Every study:** Sticky, Reveal on upward scroll, and Hero-centric options. Hero-centric removes the navigation background over the Hero and restores a solid surface when the actual Hero has left the artboard viewport. The threshold follows measured Hero geometry, including resized content; it is not a fixed scroll distance. Light/dark opening text is independently configurable. Choosing this mode switches flow headers to overlay while preserving floating and edge placement.
- **Dropdowns:** Header chrome has a stacking layer above the Hero and later page content. Disclosures and large nonmodal menus overlay the page, with bounded internal scrolling. Opening and closing menus leaves Hero and following-section geometry unchanged. Normal flow headers reserve only their closed height; floating/overlay headers reserve none.
- **NX04:** Capsule, Architectural frame, Soft glass, and Segmented dock styles. Left/center/right docking; compact/wide widths; close/relaxed edge spacing; zero/two/three visible priority destinations; CTA and utility visibility; brand/contrast/density controls. Static, Sticky, Reveal, Hero-centric, and Compact remain compatible with its floating placement. Hero-centric resolves even the glass style to a fully opaque surface after the Hero. These four treatments extend one structural concept rather than claiming four new studies.
- **All eight current Heroes:** Statement, Front Page, Open Circuit, Comparison, Vertical Record, Between Acts, Assembly, and Object Study. Removed the Comparison-only restriction; the selected Hero renders without a floater spacer or a navigation-specific Hero implementation.
- **Close controls:** Nonmodal panels use the existing menu trigger to close, plus Escape and outside dismissal. Removed duplicate internal Close buttons. Native modal dialogs retain their necessary internal Close button because the outside trigger is inert while open. Keyboard focus restoration and modal focus containment remain intact.

Transparent navigation needs an appropriate author-selected text contrast and position for the actual Hero imagery/copy. All eight Heroes are selectable; this does not guarantee every possible client image, label length, and placement combination is compositionally ideal. NX09 retains its reserved side column, and NX10 retains its post-Hero destination shelf. Full mobile art-direction refinement remains deferred; narrow-width regression coverage preserves current access.

## Verification

All checks below passed. Browser evidence is in [`approval-followup/`](approval-followup/).

| Check | Result |
|---|---|
| Complete unit suite | 547 tests across 61 files |
| Typecheck, ESLint, production build | Passed |
| Desktop shared motion matrix | 288 cases: 12 studies × 8 Heroes × 3 required policies; measured Hero boundaries, stable page geometry, sticky placement and reveal direction |
| Expanded desktop menus | 11 overlay/modal/native-disclosure checks; no geometry shifts; nonmodal panels above content; no duplicate Close button. NX09 has visible routes rather than a desktop dropdown. |
| NX04 floating matrix | 68 cases: 4 styles × 3 placements × 5 scroll policies, plus wide/three-link/relaxed-offset across 8 Heroes; zero header footprint and no horizontal overflow |
| Fully solid Hero-centric surfaces | All 4 NX04 styles transparent before / opaque after Hero exit |
| Hero/responsive regression | 192 pairings: 12 studies × 8 Heroes × desktop/mobile widths; headings, image loading and horizontal bounds |
| Accessibility automation | 50 navigation-scoped axe audits across resting/expanded states; no WCAG A/AA findings |
| Keyboard/editor checks | 8 checks: disclosure entry/Escape, outside dismissal, staged focus/Back, structural capability filtering and eight-Hero availability |
| Scroll geometry regression | 100 desktop/mobile policy cases |
| Reduced motion | NX04 reveal remains visible; zero animated descendants under emulated reduced motion |
| Runtime errors | None in either browser suite |

Screenshots include each Hero-centric study, expanded desktop panels, four NX04 styles, and the Lab inspector. NX04 was also visually inspected in the authenticated Lab with Object Study and Hero-centric mode. Automated accessibility checks are scoped checks, not a full accessibility certification.

The repeatable scripts are `scripts/design-engine-navigation-followup.mjs`, `scripts/design-engine-navigation-interactions.mjs`, and `scripts/design-engine-navigation-scroll.mjs`, using the existing loopback QA harness built by `scripts/design-engine-navigation-qa.mjs`. No public QA route or authorization bypass was introduced. The original `evidence/` and initial proposal remain historical records; current assertions and results live here.

## Scope boundary

No auth, database, client routes, deployment, production Navigation/Hero implementation, or Motion Engine changes. Existing review dispositions remain preserved. Approval resolves the Collection 003B human-review gate; Collection 008 has not been started.
