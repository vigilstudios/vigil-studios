# Milestone 4A verification and handoff

30 September 2026. Implemented in `vigil-studios`, the Design Engine host. No additional section collection, full-site template, industry template, recipe, AI generator or customer page builder was created.

## Ready architecture

- Strict typed site/page/section configuration, layer precedence, executable content/media schemas and serializable section capability metadata.
- Site-owned brand colors and icon system; independent typography, art direction and motion language. Page/section overrides are bounded to supported creative fields.
- Separate H17 publication, H18 signal, H22 bookends, H24 assembly and H12 comparison implementations; N01 island and N02 contents implementations; existing Primary Navigation, Statement Hero and Feature List also compose. Content/media remain client inputs. Original creative studies, feedback and review/rejected dispositions remain intact.
- Shared full-bleed, contained, framed, panorama, portrait-emphasis and editorial-crop geometry, plus natural, monochrome and high-contrast tone. Masked/layered treatments are deferred until a selected mechanism proves a reusable contract.
- One staff-only desktop Lab at `/admin/lab`, with Design and Composition switches and retained state between workspaces. Composition supports ordered registered sections, independent global layers, controlled page/section overrides, strict client data editor, structural/media controls, compatibility diagnostics and responsive artboards. All three Design workspaces remain available, including all twelve Batch 003 studies. Legacy routes redirect to the correct workspace.
- Fixed viewport editor with a hideable right inspector, draggable and keyboard-adjustable panel width, control sizing and artboard zoom. Canvas selection opens the current section's settings beside its preview. Below 1024px the admin entry is hidden and editor access is replaced by a desktop requirement message.
- Capability-based overlay/surface rules, section ordering/singletons, unique page/section identifiers, supported creative layers, image treatment restrictions, comparison geometry and assembly part integrity. Invalid compositions do not render.

## Automated checks

| Check | Result |
| --- | --- |
| `npm test` | 50 files / 298 tests passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed without warnings |
| `npm run build` | Passed; unified Lab and both legacy redirects included |
| `git diff --check` | Passed |

Composition tests cover serializable contracts and current profile catalog agreement, lifecycle preservation, independent precedence, all five fixtures, declared type/art pairings, resting states, strict unsupported input rejection, ordering/landmarks/overlay behavior, all shared geometry/tone combinations, accessible media, comparison registration requirements, constant/extreme finite signal data, replacement copy, long headlines and preview neutrality. Existing registry and calibration tests still pass.

## Browser verification

Authenticated Chrome checks exercised all five fixtures at fluid desktop, 768px and 390px Lab frames. No frame overflow; scene assets loaded and actual computed fonts differed by selected profile. All five also fit actual 390px and 768px browser viewports; the admin chrome reduces the available embedded frame width, as expected. Selected mobile and desktop stills were inspected for structural identity and reading order.

N02 passed native modal state, initial focus, focus containment, Escape dismissal, scroll lock/restoration and trigger focus restoration. Its mobile sheet fit without horizontal overflow. N01 passed disclosure, Escape with focus restoration and outside dismissal; Primary Navigation's narrow disclosure also worked. H12 passed keyboard range adjustment, reset and variant reset; mobile scene geometry was corrected to preserve subject visibility above opaque controls. H24 plane labels were centered to remain readable inside the diagram. Long navigation identity and headline replacement tests preserved menu access and frame fit. Framed/monochrome controls applied the expected geometry and image filter. Site/page/section type precedence preserved the same site palette and icon stroke. Reordering blocked invalid Hero placement, additions/removal worked with unique identifiers, and client data editing rejected styling fields.

The optimized production server was smoke-tested separately: both Labs loaded, all five compositions rendered without compatibility issues, fonts/media loaded, and the native navigation dialog worked. Design Lab retained the twelve Batch 003 originals and Calibration 003 re-tests; the individual H17 reusable preview rendered correctly.

The subsequent desktop editor refinement was checked in authenticated Chrome: canvas selection and selected-section dropdown update the right inspector; selecting the representative body section scrolls the canvas while the inspector stays fixed; structural and typography edits render beside their controls. Panel keyboard resize honors 260–560px bounds, control sizing changes inspector density, hide/show restores toolbar focus, and preview zoom preserves the authored artboard width. Interaction mode permits the native Contents dialog. Design retains individual H17 inspection, all twelve Batch 003 concepts/overview, and Calibration 003 controls. Design/Composition switching retains selections and overrides, shows only one editor, and updates the unified URL. At 768px the editor unmounts and the Lab navigation entry is hidden. Overlay navigation keeps its authored absolute position. Mobile artboards remain available for testing client sections from desktop.

## Lifecycle and next campaign

The catalog now contains 36 entries: the original 29 remain `experimental`; seven curated reusable registrations remain `review` with source concept provenance. These are functioning implementations for composition QA. Milestone completion does not fabricate human production approval or replace the existing evidence/promotion gate. Client deployment still requires selected font/media delivery, real destinations, actual image registration and content/contrast/accessibility/performance review. No Footer exists yet.

The next **Brand / About / Storytelling** creative campaign can start from [the composition architecture](./COMPOSITION_ARCHITECTURE.md) and [the section contribution contract](./COMPONENT_CONTRIBUTION.md). It must supply a distinct narrative structure, strict client data/media schemas, h2/h3 semantics, supported layers/treatments, finite variants, reading order, accessibility responsibilities and explicit compatibility capabilities. Preserve concept disposition, then add selected implementations to both Labs and test them in at least two unlike compositions before the normal promotion gate. That collection has not been generated in this milestone.
