# Collection 004 — controls audit, before collection work

30 September 2026. Existing dispositions and structures are preserved. The audit traces registry → schemas → provider → renderer → scoped CSS. Browser evidence and regression results are recorded separately in VERIFICATION.md; this document is the implementation rulebook, not a fabricated creative approval.

| Surface / option | Classification before correction | Correction and boundary |
| --- | --- | --- |
| Primary Navigation density with an art direction | Broken: both choices consumed the same nav height | Compact is 80% of the chosen art-direction height; comfortable uses it fully. Disclosure and structural DNA unchanged. |
| Statement Hero start/center, especially Salon | Broken: global alignment overruled explicit section alignment | Structural alignment wins; art direction still changes space, rhythm and actions. |
| Responsive Media cover/contain with art direction | Broken: provider selector won the cascade | Explicit fit wins. No fake crop control. |
| Text lead/body/small with a type profile | Broken: profile body rule flattened all three | Sizes scale relative to the selected body role. |
| Heading semantic h1/h2/h3 | Effective semantic change, not guaranteed visual difference | Keep: hierarchy and scale are independent. Subsection/section/display retain their real sizes. |
| Action Button solid/outline under Gallery, Publication, Runway | Unsupported combination: line direction made both identical | Outline disabled with a reason in line directions; imported/current conflicts block preview. Keep block/pill emphasis choices. |
| N01 overlay in standalone Design | Context-dependent: overlay lives in the composition wrapper | Standalone overlay disabled with explanation. Composition permits it only before an overlay-safe Hero. |
| Static Navigation, H18/H12 and motion-none section behavior | Ineffective intensity controls | Fixed none property, clear global-invariance explanation; no local intensity selector. Imported irrelevant local overrides are diagnosed. Site/page policy stays independent. |
| Calibration H09/H10/H12/H13 intensity | Unsupported: these studies have no entrance motion | Fixed none. H16 retains the actual left-origin exposure and three intensities. Original dispositions untouched. |
| Sticky Scroll / Horizontal Scroll expressive intensity | Unsupported: no separate expressive behavior | Foundation capability exposes none and restrained only. No invented distance change to justify expressive. |
| Sticky Scroll none/reduced motion | Broken: pinning and long spacer survived | Still state releases pinning and removes the long spacer. Narrow layout also releases it. |
| Marquee restrained/expressive | Broken: duration ignored intensity | Speed uses policy distance (restrained slower, expressive faster), with none/reduced/offscreen safeguards retained. |
| Button hover under reduced motion | Broken: transform persisted without transition | Reduced-motion hover remains still. |
| Primitive heading/text/link/icon art direction | Unsupported at mechanism level | Hidden selector, fixed-mechanism note. A demo child's surface does not prove mechanism support. |
| Divider / badge art directions | Duplicate effective states | Only publication (thin) and billboard (graphic) offered, preserving fixed rule/pill geometry. |
| Grid columns / Stack direction at narrow width | Context-dependent: responsive one-column/vertical behavior | Selector replaced by fixed-width explanation; desktop authored setting retained, not silently rewritten. |
| Existing Hero media geometry/tone | Effective | Retained only where section contract declares it; comparison protects one registered crop. |
| Existing section typography and art direction | Effective within declared set | Type roles and consumed space/gap/frame/action properties change. No promise that every art tendency rewrites every section. |

## Authoritative controls and transitions

`registry/capabilities.ts` declares typed foundation capabilities, consumed by registry entries. Composable sections derive creative controls from their `SectionContract`; no second UI support list. `motionIntensities` and `artBehavior` explain supported policy and fixed geometry. `CapabilityControl` renders one effective option as a property, disabled choices with reasons, and absent dimensions as concise notes. `composition/controls.ts` uses the same executable schemas and runtime compatibility validator for context-dependent choices.

Component/preset changes explicitly reset Design configuration and creative layers with a status announcement. Composition replacement is labeled as loading the new structure's fixture data and clearing local overrides; invalid replacements are disabled. Behavior → none explicitly removes local intensity and announces that transition. Other invalid combinations are not coerced: retained choices block preview until the user repairs them or explicitly restores defaults. Inherited site/page values remain independent; the global selector disables a change only when it violates a dependent section's actual capability. Import validation remains necessary when content or neighboring sections change elsewhere.

Static bodies must declare none, not a menu of aspirational motion. Future interactions must earn their capability declaration through renderer and browser verification. No superficial variation was introduced to rescue an ineffective art option.

## Refinements from browser review

- Button typography offers one representative for each distinct consumed body font (editorial, neo-grotesk, geometric, brutalist). Profile changes that only affect unused display roles are omitted. Button art choices collapse identical line styles; Container removes the repeated Publication/Runway gutter; Card keeps four distinct radii. These are component-local filters, not a global reduction of profiles.
- N01 local art choices depend on center/end structure. Center has no distinct Salon result relative to Gallery; Publication and Runway are equivalent in either structure. End permits Salon because its authored offset changes. Global Salon/Runway remain valid for a page. The inspector tells reviewers to open the menu to inspect border/panel effects; the island's rounded silhouette is invariant.
- OS reduced motion replaces local/site/page intensity selectors with an effective-none explanation and retains the authored preference. Motion-only configuration fields are inactive with an explicit retained-value note.
- A browser regression exposed behavior→none being filtered before its explicit intensity reset. Choice validation now uses `transitionSection` too, so the accepted choice and applied transition agree. Direct imported data still receives strict runtime diagnostics; no input import is silently repaired.
- S01/S03/S06 have fixed none motion. Optional future interactions are recorded in study rationale only, never offered as controls.
- Reduced-motion reload revealed a hydration mismatch in conditional inspector markup. `MotionPolicy` now subscribes to the OS media query through `useSyncExternalStore`, using an identical initial server/hydration snapshot; CSS reduced-motion safeguards remain in place. This also keeps the effective policy current when the OS preference changes.
