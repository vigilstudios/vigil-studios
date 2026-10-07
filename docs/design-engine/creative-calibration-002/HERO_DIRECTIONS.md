# Creative Calibration 002 — ten hero directions

**Stage:** art direction for review, 30 September 2026. These are proposals, not implemented or registered components. The [creative profile](./CREATIVE_PROFILE.md) records the feedback that shaped this batch. Study copy, photography, type, and colors are examples; none is a client identity or engine default. Scar's project is excluded.

The [Figma exploration](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy) contains editable desktop and mobile studies. These show one credible use of each mechanism, not a fixed template. Concepts below define the reusable structure behind the studies.

| Direction | Desktop study, 1440 × 860 | Mobile study, 390 × 844 |
| --- | --- | --- |
| H07 The Seam | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-2) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-3) |
| H08 The Aperture | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-13) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-13) |
| H09 Object Study | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-24) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-21) |
| H10 Two Scales | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-33) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-28) |
| H11 Long Take | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-44) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-39) |
| H12 Becoming | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-57) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-49) |
| H13 Type as Terrain | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-70) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-62) |
| H14 Field Notes | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-80) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-70) |
| H15 Dialogue | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-97) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-86) |
| H16 The Vertical Record | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-107) | [Open](https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=4-96) |

## Engine fit

The existing scoped theme tokens, `DesignThemeProvider`, type/action/media primitives, icon adapter, and named motion behaviors are a useful base. A client should still own image assets, typefaces, colors, copy, and focal points. The current registry and Design Lab become relevant **after** a concept is selected for production work; no proposal in this batch is registered. Needed capabilities below are proposals, not silently added dependencies. The current media primitive handles an image or controlled video in a frame; fullscreen focal art direction, object viewing, image comparison, and timed media stories would need reviewable extensions. Existing motion is reused for entry and restrained scroll treatment; stateful storytelling needs its own accessible state logic.

## H07 — The Seam

**Art direction and layout.** A single cinematic image fills the viewport. An opaque, softly rounded editorial shelf rises from the bottom edge and continues into the next section. The image and content surface meet at a deliberate boundary: the shelf carries the thesis and action while the landscape remains largely unobstructed. The rounded edge is a transition into the page, not a floating card.

**Obvious version rejected.** Fullscreen image plus a black rectangular text overlay. The shelf has a continuous page role and a stable reading surface.

**Type.** One large low-set headline with a short supporting sentence; the line breaks are authored within a max measure, never centered over a face. **Content contract:** required headline, primary action, hero image/poster; optional eyebrow, one-line context, secondary action. **Media:** image or poster-backed silent video, separate desktop/mobile focal points and alt/label; no information depends on movement.

**Interaction and motion.** Scrolling makes the shelf become the following page surface. `MediaReveal` can introduce the scene; a small `ScrollScale` is optional. Video needs pause and reduced-motion poster. **Mobile:** shelf occupies the lower part of the viewport with a broad curved top corner, never hiding the subject; copy remains readable within the first screen. **Configuration:** shelf height (`low/medium`), edge character (`one-corner/continuous-curve`), copy measure, image/video. **Fit:** destination hospitality, outdoor equipment, film festival. **Difference:** unlike Batch 001 H02, the content surface is structurally connected to the page; unlike H11, no visitor-selected chapter. **Feedback:** preserves the praised immersion and contextual type while resolving the detached square overlay. **Complexity:** high. **Engine extension:** fullscreen media with authored focal regions and an accessible video poster/pause contract; shared section-boundary geometry token.

## H08 — The Aperture

**Art direction and layout.** A large shaped opening in a solid typographic plane reveals a subject or place. The opening sits off-axis and expands toward the next section on scroll. The shape is chosen to frame the subject, such as an architectural arch for a space or a broad rounded capsule for a horizon; it is not an arbitrary decoration.

**Obvious version rejected.** A rounded rectangle photograph beside a heading. The media is an aperture through the content plane, so the visual hierarchy changes as the aperture opens.

**Type.** A decisive title occupies the solid field, with a small caption at the aperture edge. **Content contract:** required short headline, image, action; optional caption, place/material marker, supporting line. **Media:** one high-resolution image or video/poster with an authored subject focal point; image should retain meaning under a crop that changes shape. **Interaction and motion:** `MaskReveal` on entry, then a bounded scroll-driven opening; a static open mask under reduced motion. **Mobile:** the statement leads and a rounded opening spans most width beneath it; the mask expands vertically on scroll rather than growing beyond viewport edges. **Configuration:** mask family (`arch/capsule/organic-geometry`), aperture position, growth extent, text measure. **Fit:** architecture studio, fragrance maker, cultural venue. **Difference:** the image is seen *through* a foreground plane, unlike H07's unrestricted scene and H13's image inside letters. **Feedback:** tests purposeful shape and masking. **Complexity:** high. **Engine extension:** reusable responsive aperture mask and focal-point controls; scroll progress must not be essential to navigation.

## H09 — Object Study

**Art direction and layout.** A single material object is given a quiet, almost museum-like field. It occupies a controlled area of a vast neutral space, with a fine calibration line, small provenance label, and a typographic claim held well away from it. The object is the reason for the whitespace.

**Obvious version rejected.** Minimal headline with a decorative spinning 3D model. The object must reveal material, craft, or function; a still image can carry the same narrative.

**Type.** Restrained, precise, and low density; a large statement can appear at one edge without becoming a centered slogan. **Content contract:** required short claim, object name/subject, action; optional material/provenance and one explanatory sentence. **Media:** a static subject image is baseline; optional 3D model or sequenced views with poster, text description, and load-on-intent. **Interaction and motion:** drag/keyboard rotate by discrete increments; `FadeReveal` for copy, no perpetual spin. **Mobile:** object sits in the upper two thirds, statement and controls below; rotation control must have tap and keyboard equivalents. **Configuration:** object scale, view mode (`still/turntable/model`), annotation presence, statement edge. **Fit:** furniture atelier, scientific instrument maker, culinary brand. **Difference:** a solitary inspectable subject, unlike H08's scene aperture or H10's paired evidence. **Feedback:** explores the requested purposeful 3D in a minimal field. **Complexity:** high with 3D, medium as still. **Engine extension:** optional progressive spatial viewer with model fallback, loading strategy, controls, and reduced-motion mode.

## H10 — Two Scales

**Art direction and layout.** One subject is shown as a broad environment and a circular or softly lobed detail lens. A thin index connects the detail to its location in the main scene. The paired views answer a question: what changes when we move from whole to material? The detail is evidence, not a second mood image.

**Obvious version rejected.** Two overlapping stock photos, one large and one small. Both views depict the same subject, and their spatial connection is explicit.

**Type.** A strong headline lives outside the detailed region; concise callouts name the scale change. **Content contract:** required headline, whole image, detail image, action; optional detail caption and secondary proof line. **Media:** two crops of the same subject (or coordinated wide/macro video stills), with per-view alt text and focal data. **Interaction and motion:** pointer/focus may expand the detail lens; `MediaReveal` for entry; the detail remains accessible by a visible control. **Mobile:** wide scene fills upper field, detail lens becomes a large separate shaped viewport anchored to its caption; no tiny hover target. **Configuration:** detail placement, lens geometry, detail size, caption mode. **Fit:** architecture and materials, outdoor apparel, food and agriculture. **Difference:** paired *scale* relationship differentiates it from H04's rejected unrelated layered imagery and H14's multiple annotations. **Feedback:** gives a large image an explicit narrative role and uses shape meaningfully. **Complexity:** medium-high. **Engine extension:** linked media crop contract and accessible detail-state control; otherwise existing media and motion primitives suffice.

## H11 — Long Take

**Art direction and layout.** A continuous horizontal panorama or film sequence runs beyond the viewport. One fixed vertical marker and a small text anchor reveal a clear start point; successive scenes are encountered through native horizontal movement or controlled scroll. It feels like a single long take rather than a carousel of interchangeable slides.

**Obvious version rejected.** A full-width slider with dots and centered captions. The scene has continuity, editorial pacing, and a visible position in a longer spatial story.

**Type.** Large initial thesis, then quiet scene captions at the marker. **Content contract:** required opening headline, 2–4 ordered scenes, each scene label, media, destination or terminal action. **Media:** each scene has image or poster-backed video, consistent horizon/subject continuity, and alt text; a single panoramic image is also valid. **Interaction and motion:** use existing `HorizontalScroll` mechanics and a bounded position cue; native scroll, keyboard buttons, and touch remain primary. **Mobile:** vertical sequence of generous near-fullscreen scenes with a persistent chapter number; horizontal forced swiping is unnecessary on narrow screens. **Configuration:** scene count, continuous panorama versus sequence, marker position, caption density. **Fit:** documentary photographer, destination group, industrial maker. **Difference:** storytelling unfolds over *time/space*, unlike H07's one scene or H16's vertical document. **Feedback:** media remains immersive while structure becomes nontraditional. **Complexity:** high. **Engine extension:** synchronized scene position/caption state, media preloading policy, scroll snap QA; the existing `HorizontalScroll` is a base, not a complete narrative controller.

## H12 — Becoming

**Art direction and layout.** Two perfectly registered visual states share the full viewport, divided by a movable reveal seam. The user can inspect an actual transformation: restoration, transformation, night/day, raw/finished. A fixed short claim frames the comparison and a result action follows it.

**Obvious version rejected.** Before/after stock slider as a gimmick. This only belongs in a hero when the change is the brand's central evidence and both states are art directed to match.

**Type.** One firm sentence plus succinct state labels. **Content contract:** required two states with labels, headline, action, summary of what changed. **Media:** matched image pair or short synced poster-backed videos with identical camera geometry and focal data; text alternatives describe the difference. **Interaction and motion:** draggable seam plus keyboard step buttons and a reset; initial state gives enough information without action. `FadeReveal` may introduce labels; movement itself is user controlled. **Mobile:** the reveal seam spans the full-width scene, with a large touch handle and stable state labels; implementation must also expose explicit step buttons. **Configuration:** initial reveal fraction, seam orientation, label placement, media type. **Fit:** architecture restoration, fitness coaching, conservation science. **Difference:** the entire concept is comparison between *two registered states*, distinct from H10's whole/detail and H15's choice between unrelated narratives. **Feedback:** supports purposeful interaction and full-viewport imagery. **Complexity:** high. **Engine extension:** accessible media comparison primitive and sync strategy for video; no decorative animation dependency.

## H13 — Type as Terrain

**Art direction and layout.** Monumental type behaves as the hero's visual structure. A cropped word or short phrase defines an image window within selected letterforms while a smaller complete headline gives an unambiguous reading path. The media and letters have a semantic relation; the word is not chosen merely because its shapes look attractive.

**Obvious version rejected.** Giant slogan over a background photograph. Here type controls the media aperture and the viewer reads the same idea at two scales.

**Type.** Extreme display scale balanced by a complete accessible headline and modest action; no dependence on one font. **Content contract:** required short display word (ideally 4–9 characters), complete headline, image, action; optional one sentence of context. **Media:** one high-contrast image with subject positioned to survive letterform clipping; a normal rectangular fallback is required for fonts/languages that do not make a useful mask. **Interaction and motion:** optional `SplitTextReveal` only on the complete headline; a subtle image position shift may expose parts of the subject. **Mobile:** full word becomes smaller or breaks into a two-line editorial stack; image window moves to a broad shaped strip when glyph masking hurts readability. **Configuration:** display word, type scale mode, media-in-type extent, fallback strip position. **Fit:** fashion label, music venue, editorial publication. **Difference:** typography is a physical media boundary, unlike H08's geometric opening or H15's pure verbal exchange. **Feedback:** develops the praised typographic confidence and request for masking. **Complexity:** high. **Engine extension:** robust text-mask technique with language/font fallback and contrast testing; current heading primitive can remain the semantic heading.

## H14 — Field Notes

**Art direction and layout.** One full-viewport photograph becomes an annotated field. Two or three markers sit on actual locations or details in the image; a quiet perimeter ledger names them. The marks reveal evidence or a route through the scene, so the photo carries more than atmosphere.

**Obvious version rejected.** Hotspots scattered over a background image with floating glass cards. Marks need authored coordinates, meaningful descriptions, and a visible ordered reading path.

**Type.** Editorial heading at a tested quiet edge; small caption typography is paired with large numbered markers. **Content contract:** required headline, image, 2–3 annotations with title/body/coordinate, action; optional source/location and overall caption. **Media:** single image/poster with desktop/mobile crops and annotation anchor maps; every annotation has textual order independent of spatial location. **Interaction and motion:** focus/click expands one note in a solid edge drawer; `StaggerReveal` can introduce ledger labels. **Mobile:** notes move to a numbered list beneath or over a stable image band, with direct visual highlight when selected. **Configuration:** ledger side, marker count (2/3), detail presentation (`edge drawer/inline`), image crop. **Fit:** architecture practice, wildlife travel, industrial technology. **Difference:** one scene with authored *spatial evidence*, unlike H10's dual scale and H11's temporal sequence. **Feedback:** makes the hero image bigger and more meaningful without generic cards. **Complexity:** high. **Engine extension:** responsive annotation coordinates, accessible marker/list linking, crop-aware anchor mapping.

## H15 — Dialogue

**Art direction and layout.** Two short statements occupy opposing edges of a mostly empty viewport, with a precise connective line or shared baseline. The reader understands a tension, then the second statement resolves it. An optional narrow image strip can act as evidence between them, but the composition survives without media.

**Obvious version rejected.** Centered two-line slogan with a decorative slash. The spatial distance and reading order carry the argument, and both statements have real semantic roles.

**Type.** Two distinct scales or weights, set with deliberate measures; avoids a generic startup display stack. **Content contract:** required paired phrases and action, optional explanatory line and proof/source. **Media:** optional one narrow image strip or short silent clip, never needed to decode the thesis. **Interaction and motion:** second phrase may reveal as the reader scrolls a small amount; `SplitTextReveal` or `FadeReveal`, with both phrases present under reduced motion. **Mobile:** phrases stack with clear sequencing and more breathing room, while the connector becomes a vertical rule; action follows the resolution. **Configuration:** phrase relationship (`question/answer`, `then/now`, `tension/resolution`), media presence, connective rule orientation, type contrast. **Fit:** cultural organization, research lab, strategy consultancy. **Difference:** a *verbal relationship* across empty space, not H09's object study or Batch 001 H01's folio. **Feedback:** carries the praised typography and restraint into a new content structure. **Complexity:** medium. **Engine extension:** likely none beyond a hero-specific type scale and robust content-length limits.

## H16 — The Vertical Record

**Art direction and layout.** A tall portrait media spine runs through the viewport and visibly continues below the fold. A headline sits in one side field, a compact chronology or provenance in the other. The continuation cue promises a deeper record rather than a scroll gimmick; the spine may be a film strip, building facade, garment, or landscape cut.

**Obvious version rejected.** Image-left/text-right split with an extra caption column. The spine crosses the fold and binds the page's first two sections; the side fields are asymmetrical in purpose and rhythm.

**Type.** One expansive statement offset against small documentary metadata. **Content contract:** required headline, vertical image, action, one provenance line; optional 2–4 milestones and contextual sentence. **Media:** tall image or poster-backed clip with enough visual continuity to extend below the fold; alt text and mobile crop. **Interaction and motion:** scrolling reveals the lower part of the media spine and the next record; `Parallax` or a restrained `MediaReveal` can support it. **Mobile:** spine becomes a broad cropped vertical band with an adjacent thin metadata rail; the headline leads, while continuation remains visible without requiring horizontal squeeze. **Configuration:** spine width, offset, metadata side, continuation depth. **Fit:** heritage fashion house, architecture studio, craft distillery. **Difference:** *vertical continuity across the fold* is the mechanism, unlike H11's horizontal scene progression or H07's shelf transition. **Feedback:** gives media substantial meaning and preserves a side structure without repeating H01's small image rail. **Complexity:** medium-high. **Engine extension:** section-spanning media layout contract and crop-safe responsive boundaries; current motion primitives cover the reveal.

## Navigation decision

No new navigation concepts are proposed in this batch. N01–N04 were all positively received and already span four different behaviors: floating compact island, full editorial contents, media-aware transparent header, and hierarchical domain navigation. A fifth idea would need a distinct information or interaction model, not another visual treatment. Navigation remains independent of hero choice. Indicative pairings: N01 with H08/H09/H15, N02 with H13/H16, N03 with H07/H11/H12/H14, and N04 with H10/H16. Pairings are suggestions, not coupled components.

## Diversity and reusability review

The ten mechanisms occupy different primary axes: **boundary** (H07), **aperture** (H08), **isolated inspectable subject** (H09), **whole/detail evidence** (H10), **horizontal time** (H11), **registered transformation** (H12), **letterform/media fusion** (H13), **spatial annotation** (H14), **verbal relation** (H15), and **vertical continuity** (H16). None is justified by its palette, font, corner radius, or direction of image placement. H10 differs from the rejected H04 because its paired images must be of the same subject at different scales; H16 differs from a split layout because the media continues through the section boundary. H07 and H08 both use a solid plane, but one creates a *page transition* while the other creates an *opening through the plane*. H11 and H12 both use interaction, but one traverses ordered scenes while the other compares registered states. H09 and H15 both use whitespace, but one is object inspection and the other is a two-part argument.

| Direction | Architecture | Fitness | Photography | What survives a brand change |
| --- | --- | --- | --- | --- |
| H07 | Building in landscape | Athlete in environment | Location-led body of work | Full scene and integrated shelf. |
| H08 | Architectural threshold | Training space opening | Framed portrait/session | Subject-led aperture. |
| H09 | Material model | Equipment form | Camera/object study | Quiet inspectable subject. |
| H10 | Facade and material joint | Whole movement and muscle detail | Scene and contact-sheet detail | Whole-to-detail evidence. |
| H11 | Sequence through a site | Journey through a course | Travel series | Continuous ordered passage. |
| H12 | Before/after restoration | Measured progression | Retouching or light change | Registered transformation. |
| H13 | A word filled by built space | Discipline word and athlete | Editorial title and image | Media shaped by meaningful type. |
| H14 | Annotated plan or facade | Technique cues in an action scene | Subject/location notes | Authored evidence points. |
| H15 | Form/function thesis | Effort/recovery thesis | Seen/unseen thesis | Two-part verbal relationship. |
| H16 | Facade through the fold | Vertical movement trail | Tall portrait/contact strip | Continuing portrait spine. |

The matrix is a stress test, not suggested marketing copy. Some concepts require genuine source material: H10 needs two scales of one subject, H12 needs matched states, H14 needs annotatable image details, and H16 needs a convincing tall crop. Those requirements are design constraints and should be disclosed early in client selection, rather than filled with unrelated stock images. Long copy, weak photography, or inaccessible interactive states should disqualify a particular use, not be hidden by styling.

## Research principles

The research was used to derive principles, not to reproduce source sites: [Pentagram's Zoo](https://www.pentagram.com/work/zoo) demonstrates an immersive interface with a reason to explore; [Pentagram's Impala](https://www.pentagram.com/work/impala/story) treats visual behavior as part of a coherent identity; [Instrument's Eames Institute](https://www.instrument.com/work/eames-institute) shows how tactile media can support an editorial journey; [Studio Freight's Psyop](https://studiofreight.com/work/psyop) links visual interaction to specific work. This batch translates those broad observations into distinct, brand-neutral structures.

## Decision gate

Review each direction for art direction, content availability, brand fit, and whether its interaction improves the story. Select concepts for a separate implementation phase; only then define exact typed props, responsive QA cases, registry metadata, and Design Lab previews. No proposal in this file is Production.

## Study verification and limits

The Figma file contains ten editable 1440 × 860 desktop frames and ten editable 390 × 844 mobile frames, with populated image fills where the concept uses media. Every frame was visually inspected. The day/blue-hour comparison was rebuilt around aligned views of one scene; the material lens uses a close view of its parent scene; the mobile object crop, comparison headline, and vertical-record reading order were corrected after inspection. These are static compositions. Motion, drag behavior, keyboard interaction, responsive interpolation between the two widths, and production contrast remain implementation and QA work after concept approval. This batch changed only concept documentation, study imagery, and Figma exploration; it does not change the Design Engine runtime.
