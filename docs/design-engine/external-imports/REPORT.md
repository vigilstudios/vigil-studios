# External component import batch — 6 October 2026

The six user-supplied references are implemented in the existing Professional engine in `vigil-studios`. The host already uses Next.js 16.3, React 19, TypeScript and Tailwind 4. Its portable components live in `design-engine/sections/` and scoped styles in `design-engine/styles.css`; dashboard helpers live separately in `components/vigil/`. The references' shadcn setup and `components/ui` placement instructions are superseded by the supplied engine brief. Installing shadcn or copying a second component architecture would not improve this integration.

No dependency was added. The batch uses existing Framer Motion, `MeasuredLoop`, `MotionPolicy`, `Plate`, `SectionActions`, `ItemAction`, `ActionMedia`, native dialogs and the standardized icon/action presentation system. No customer content, external demo endorsements, years or image URLs are embedded in reusable implementations.

## Disposition

| Reference | Production system | Engine category | Disposition / structural capability |
| --- | --- | --- | --- |
| 1: ConditionGrid | `work.gallery-hanging` / Gallery Hanging v1.1.0 | Media / Work (`portfolio`) | Extend M07 with a paired 5/7 then 7/5 image grid. Preserve the original hanging and gallery labels. |
| 2: Testimonials columns | `proof.moving-chorus` / Moving Chorus v1.1.0 | Social Proof / Results (`proof`) | Extend E06 with independently measured vertical columns and opposing travel directions. |
| 3: AnimatedMarqueeHero | `hero.image-marquee` / Image Marquee Hero v1.0.0 | Hero | New: a proposition and optional actions above a tilted continuous image ribbon. |
| 4: Timeline | `story.process-timeline` / Process Timeline v1.0.0 | Brand / Story (`storytelling`) | New: a pinned, measured horizontal process track with alternating stations, progress line and stems. The supplied Hyperiux Vault timeline is structural inspiration. |
| 5: 3D testimonials | `proof.moving-chorus` / Moving Chorus v1.1.0 | Social Proof / Results (`proof`) | Extend E06 with perspective columns. Reuse its attribution/source integrity and canonical reading wall. |
| 6: SphereImageGrid (attached file) | `work.image-sphere` / Image Sphere v1.0.0 | Media / Work (`portfolio`) | New: deterministic image sphere, pointer drag, automatic rotation, keyboard controls, complete index and native spotlight dialog. |

Six references produce **three new systems and two existing-system extensions**. Three additional near-duplicate registrations were intentionally avoided: gallery reuse and two testimonial references share existing mechanisms. Registry totals: **111 registrations / 76 Production systems**. Composition inventory: **137 fixtures**, including ten new mixed contexts (two per new/extended system). No new taxonomy category or numbered creative collection was introduced.

## 1 — Gallery Hanging / ConditionGrid

- **Customization:** hanging or paired composition; landscape/square/portrait cells; below-image or opaque overlay captions; open/compact gaps; optional grouped reveal; 4–12 distinct works; independent title, context, category, notes and images. An unmatched last item fills its row. Controls that belong only to paired geometry are hidden when using the original hanging.
- **CTA capability:** optional section primary; per-item link, media or whole-item action. Every item may remain actionless.
- **CTA customization:** section CTA uses the full existing variants, small/medium/large sizes, alignment, auto/full width, semantic surfaces and configured icons. Item links retain editorial treatments and no nested controls. Media uses a named anchor around the authored image; whole-item actions stretch from the caption.
- **Page/action integration:** stable `works` IDs feed the existing action editor. Page and Section selectors use Site Definition identities. No new internal href fields.
- **Typography:** existing semantic display/heading/body/accent/mono roles; all ten profiles. The paired layout retains inherited gallery title/label hierarchy.
- **Art direction:** existing Runway, Gallery and Publication compatibility. Gaps, radius and rule weights consume semantic tokens.
- **Motion:** `none` or existing `stagger`; no custom animation package. Motion-none and OS reduce show complete images/captions.
- **Responsive:** desktop alternating spans; narrow frames use a full-width sequence. Overlay captions move below images on mobile. Long captions have a scrollable opaque panel on desktop.
- **Accessibility:** semantic figures/captions, real optional anchors, inherited focus styles, authored alt/focal/mobile sources. No decorative arrow masquerades as an action.
- **Registry/editor:** the existing M07 entry now has typed finite configuration and alternate paired preview; both Labs retain the original hanging. New versions carry this batch's engineering evidence.
- **Page capability:** section-and-page-capable, unchanged from the existing system.

## 2 — Moving Chorus / Testimonials columns

- **Customization:** ribbon/columns/perspective; two or three columns; existing quote style, alignment, scale, author treatment, surface, direction, speed, intensity, pause, edge fade and gap controls. Source evidence permits 3–24 unique voices, with an ideal 4–9. Columns are distributed from the single canonical data set.
- **CTA capability:** no contextual CTA. The uninterrupted chorus remains editorial; author/source destinations already belong to the evidence model. No buttons are forced into quotations.
- **Page/action integration:** portable, source-grounded evidence works on any page. Existing publication validation rejects illustrative or unapproved evidence. No routes or client identities are embedded.
- **Typography/art direction:** all ten semantic typography profiles and all six existing art directions. Quote roles and author treatments retain their established behavior.
- **Motion:** existing `marquee` plus optional `none`; the shared measured loop now supports vertical travel. Each column measures its own full period including the terminal gap. Adjacent columns reverse direction. Persistent pause, hover/focus pause, page visibility and intersection suspension are retained.
- **Responsive:** three columns become two and then one visual column; the accessible canonical reading wall includes every voice regardless of hidden visual columns. It becomes a complete static view under motion-none or OS reduce.
- **Accessibility:** repeated animation copies are inert and aria-hidden. Canonical quotes, authors and provenance remain available in the reading disclosure. Opening it stops animation; focus pauses motion. Existing evidence integrity remains authoritative.
- **Registry/editor:** E06 receives typed layout/column controls and the same shared hover/focus preview and rollback behavior as existing choices. Inactive motion controls retain authored values and are hidden or explained.
- **Page capability:** existing section-and-page capability is retained.

## 3 — Image Marquee Hero

- **Customization:** centered/start proposition; optional eyebrow; title/introduction; 3–16 unique image records; direction, three semantic speeds, flat/alternating tilt, portrait/square/landscape ratios and transparent/surface/framed treatment. Static collection ratios remain meaningful when movement is disabled. Direction/speed/tilt controls are inactive in motion-none.
- **CTA capability:** optional primary + secondary; independent image destinations in the canonical collection. Moving copies have no destinations or tab stops.
- **CTA customization:** existing hero presentations, sizes, widths, surfaces and icon placement. Hero alignment belongs to the proposition; independent CTA alignment is deliberately not exposed.
- **Page/action integration:** the existing primary/secondary and stable `images` item groups use typed Page/Section/external/email/phone/download actions. Internal targets follow changed slugs and parent pages.
- **Typography/art direction:** all ten profiles and six directions. Heading is a semantic h1, fluidly bounded with a readable introduction; fonts are owned by the host.
- **Motion:** existing measured horizontal marquee with persistent pause, hover/focus pause, offscreen/tab suspension and a canonical collection disclosure. No forced full-screen height or absolutely positioned copy/media overlap.
- **Responsive:** proposition wraps naturally; image sizes remain bounded and the ribbon preserves its horizontal structure. Still contact sheet reduces to two/one columns.
- **Accessibility:** labelled Hero, real actions, visible focus, meaningful client alt text, inert duplicate imagery, complete static collection under reduce/site-none.
- **Registry/editor:** new Production entry and exhaustive render cases; finite layout/media/motion controls, strict serializable content/media data, shared action editor, three unrelated client adaptations and two mixed compositions.
- **Page capability:** section-and-page-capable.

## 4 — Process Timeline

- **Customization:** alternating or above-line stations; optional opening image and period; editable title/introduction/eyebrow; 2–10 uniquely identified steps with independent labels/titles/body; open/compact spacing and transparent/surface/framed treatment. Chronology is authored order, not hard-coded dates.
- **CTA capability:** optional section primary and independent step links; no required destination on a process station.
- **CTA customization:** existing full section CTA presentations and editorial step links. Client labels and destinations remain independent from station labels.
- **Page/action integration:** stable `steps` identity uses the shared action editor. Page and Section actions survive route edits and reparenting.
- **Typography/art direction:** all ten profiles and all six directions; semantic h2/h3/body/mono roles, bounded copy and client art tokens for rhythm, progress/stems and framing.
- **Motion:** existing `horizontal-scroll` behavior classification; local measured overflow maps document/Lab scroll distance to the track transform. Progress line, stems and station entrance update in one scheduled frame. No global selectors, GSAP, SplitText or new global Motion Engine. Restrained/expressive intensity adjusts entrance distance while scroll progression remains spatially accurate.
- **Responsive:** desktop pins only when width and available height support the composition. Mobile, short viewing regions, long content that cannot fit, motion-none and OS reduce use the vertical ordered timeline. A named button switches to complete reading; keyboard focus on a step automatically enters the reading view.
- **Accessibility:** semantic ordered process stations, labelled heading, native actions, visible focus, static interaction alternative and ordinary vertical touch scrolling. No document scroll interception. All records remain in the DOM in authored order.
- **Registry/editor:** new Production entry with strict bounded schema and finite controls; shared Page/Section selectors; two mixed compositions. `flow.sticky` accepts a truthful boolean, and the contract validator requires an implemented scroll behavior for sticky flow.
- **Page capability:** section-and-page-capable.

## 5 — Moving Chorus / Perspective testimonials

This is the same E06 extension described in reference 2, rather than a second testimonial registration. It adds a perspective field with alternating vertical travel, preserves the source concept's spatial tilt, bounds the perspective treatment on narrow screens, and leaves the canonical reading wall upright. No separate Card/Avatar dependency or second marquee CSS contract was introduced. CTA classification, evidence integrity, page portability, typography/art-direction compatibility, pause/reduced-motion behavior and editor controls are exactly those of the shared Moving Chorus system.

## 6 — Image Sphere

- **Customization:** centered or split composition; 4–32 independent image records; circle/rounded nodes; semantic speed and direction; transparent/surface/framed surface; heading/introduction/eyebrow and per-record labels, metadata, notes and client images. Node size responds to real container width and count. More than eight records require explicit thumbnails.
- **CTA capability:** optional section primary and per-item editorial link. Spotlight/selection is a button interaction; destination links stay separate in the index/dialog. Whole-item/media links are intentionally excluded from inspection controls.
- **CTA customization:** existing full section and editorial item presentations, sizes, surfaces and icon system. No arbitrary href fields or component-specific CTA implementation.
- **Page/action integration:** stable `images` IDs feed existing Page/Section selectors and warning behavior. Route changes and parent changes resolve through the Site Definition.
- **Typography/art direction:** all ten profiles and six directions; semantic heading/body/mono labels, client gutters/radius/borders and opaque dialog surface.
- **Motion:** deterministic equal-area distribution instead of filler images and O(n²) collision passes. Frame-rate-independent automatic travel and drag momentum update DOM transforms through refs, without React state updates per frame. Motion policy, page visibility, intersection, hover/focus, explicit pause and an open spotlight stop automatic work. All observers and animation frames clean up.
- **Responsive:** sphere measures its local container, including narrow Lab artboards; visual node size responds to count. Split view stacks on mobile. Index reduces to one/two columns and remains complete.
- **Accessibility:** four named rotate buttons and arrow-key support, complete named image index, normal vertical touch scrolling, pointer cancellation, native modal dialog with Escape/focus containment/restoration, real optional links and authored alt text. Reduced motion disables automatic travel but retains manual inspection.
- **Registry/editor:** new Production entry, strict serializable schema, meaningful finite configuration, shared action editor, three illustrative client media contexts, two mixed compositions and native spotlight behavior.
- **Page capability:** section-and-page-capable.

## Shared integration and standards

- Reused `MeasuredLoop` gains a vertical axis; its generic styling moves from the proof-only scope to `motion/measured-loop.css`, so Hero can use it without importing proof layout.
- Finite-choice visibility is shared by Design and Composition. Hidden values persist; switching to a supported layout restores them. Every free-form edit uses the existing strict draft-and-Apply data surface.
- Three new schema/contract/renderer/registry entries; gallery and chorus schemas accept old data with backward-compatible defaults. There is no parallel registry or editor.
- Existing typed actions and CTA presentation were extended only with new component/group classifications. Existing Page/Section pickers, validation and warning behavior remain authoritative.
- Lifecycle: new Production systems v1.0.0; extended systems v1.1.0. Existing creative studies and approval histories are preserved. The user's explicit external-batch productionization instruction supplies task authorization; engineering evidence is retained here.
- Architecture and component contribution documentation record reusable import, periodic-motion and drag/dialog lessons. `CREATIVE_DIRECTION.md`, Scar, Page Recipes, AI composition, client automation and the future global Motion Engine remain outside this batch.

## Verification

See [verification and evidence](VERIFICATION.md) for the exact commands, results, screenshots and browser logs.
