# Creative Collection 001 — Navigation + Hero Systems

**Stage:** visual concepts for human review, 29 September 2026. These are not implemented or registered Design Engine components. The [editable Figma studies](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo) show an approximately 1440px desktop and 390px mobile composition for each concept. Names, sample copy, colors, fonts, and generated photographs are study material, not defaults for future client sites.

| Concept | Desktop study | Mobile study |
| --- | --- | --- |
| H01 Margin & Measure | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-5) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-6) |
| H02 Scene / Signal | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-32) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-33) |
| H03 The Pause | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-53) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-54) |
| H04 Counterpoint | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-73) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-74) |
| H05 Choicefield | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-95) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-96) |
| H06 Gridline | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-123) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=2-124) |
| N01 Hoverline | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-4) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-5) |
| N02 Contents / 001 | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-32) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-33) |
| N03 Veil / Frame | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-72) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-73) |
| N04 Atlas / Domains | [1440](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-100) | [390](https://www.figma.com/design/kRuCHlP62Uz5Y7adNvYaKo?node-id=3-101) |

## Engine fit and creative research

The existing `DesignThemeProvider` supports scoped `--de-*` color, type, spacing, shape, and layout tokens with partial client overrides. Container queries make Lab mobile previews meaningful. The primitive layer covers semantic section/layout/type/action/media building blocks. `VigilIcon` supplies functional glyphs. The twelve motion mechanisms cover entrance, clip, scroll, pointer, marquee, and horizontal movement. Registry definitions are serializable and require responsive/accessibility metadata, preview variants, and QA evidence before production. The Lab can inspect registered implementations, but concept boards stay in Figma until review. This collection neither modifies the registry nor claims readiness.

Research looked for *principles*, not reference layouts to reproduce:

| Observed principle | Primary source | Translation into this collection |
| --- | --- | --- |
| Editorial hierarchy can carry many content types when the grid is flexible and whitespace is controlled. | [Pentagram: Philadelphia Inquirer](https://www.pentagram.com/work/the-philadelphia-inquirer) | H01 treats type, captions, and a small image as a composed editorial field. |
| A visual catalog can offer distinct modes of looking rather than only a card grid. | [Pentagram: GLUCK+](https://www.pentagram.com/work/gluck-1) | H05 lets a visitor select a story lens; N04 exposes a clear content hierarchy. |
| Editorial content and commercial pathways can coexist as an exploratory journey. | [Hermès: digital flagship statement](https://assets-finance.hermes.com/s3fs-public/node/pdf_file/2020-06/hermes_20180403_communique_digitaleurope_en.pdf) | N02 is a table of contents with a featured story, while still showing destinations. |
| Curation and category entry points make a broad offering understandable. | [Arper homepage](https://www.arper.com/en_GB/) | H06 and N04 use explicit modular hierarchy instead of generic feature cards. |
| Immersive work succeeds when interaction remains a route into content. | [Pentagram: Zoo](https://www.pentagram.com/work/zoo) | H05 uses choice as storytelling; it does not require a 3D environment. |
| Film/media browsing benefits from editorially chosen entry points. | [Apple TV app](https://www.apple.com/apple-tv-app/) | H02 gives the media a controlled stage and a specific story entry. |
| Space and privacy can communicate a luxury experience before detailed selling copy. | [Aman: hotels and resorts](https://www.aman.com/hotels-and-resorts) | H03 uses a sparse statement and intentionally open field. |
| Fashion imagery gains meaning from pairing art direction with a clear story. | [LOEWE campaigns](https://www.loewe.com/usa/en/campaigns/stories-campaigns.html) | H04 makes primary and secondary image roles explicit. |
| A cultural program needs quick paths across types of events and works. | [Serpentine: What's On](https://www.serpentinegalleries.org/whats-on/?type=exhibitions) | N04's deeper information architecture can serve a complex institution. |

Original design decisions below use these general observations. No source site's composition, type system, or visual assets are copied. Scar is excluded entirely.

## Hero concepts

### H01 — Margin & Measure · editorial

**Intent and visual concept.** A confident introduction that reads like an opening spread: an oversized headline occupies a six-column field; a narrow running index and a modest image caption frame the story. The image punctuates the message rather than filling the page. Study copy: “Space shapes the way we live.”

**Structural distinction.** This has a persistent side rail, a dominant text field, a deliberately small media window, and a bottom rule connecting metadata to action. It is not the existing centered/left Statement Hero with another font.

**Best fit.** Practices with a strong point of view, cultural institutions, consultancies, makers, independent publications.

**Content contract.** Required: headline (roughly 4–10 words), one sentence of supporting copy, primary action, brand/section label. Optional: issue marker, short metadata line, secondary action, image caption. A long headline must wrap on the main measure rather than collide with the rail.

**Media contract.** Optional single image, preferably portrait or near-square, with authored focal point and alt text. No image leaves the small window as a typographic counterweight; it does not become a full-bleed substitute.

**Configuration.** Rail side (`start/end`), text measure (`compact/open`), media presence (`none/small`), editorial density (`spacious/condensed`). Client typography and color come from tokens, not variants.

**Responsive.** Desktop ~1440: 12-column field, side rail ~90px, headline about 8 columns, media about 3. Mobile ~390: rail becomes a top folio row; headline spans the viewport; image follows the action at a restrained ratio; caption stays with image. Reading order remains headline → copy → action → media.

**Motion and complexity.** `SplitTextReveal` for a short headline or `FadeReveal` for the whole message; `MediaReveal` once. No perpetual motion. **Medium** implementation. Likely needs a component-level display-size clamp token because the current `DesignHeading` tops out below the study scale.

### H02 — Scene / Signal · cinematic

**Intent and visual concept.** A full-viewport scene first, a clearly placed message second. A compact lower-left content plate, fine top navigation safe zone, and bottom chapter cue let the image or film establish atmosphere without hiding the destination. Study copy: “Go beyond the familiar.”

**Structural distinction.** Media forms the background and viewport boundary; content floats within tested contrast zones. This is unlike H04's separate overlapping media planes or H03's open background.

**Best fit.** Hospitality, film/entertainment, outdoor experiences, architecture with strong motion footage, photographic campaigns.

**Content contract.** Required: 3–8 word headline, one action, media fallback poster. Optional: kicker, one concise supporting line, chapter/campaign label, secondary action. A fixed readable text scrim follows content placement.

**Media contract.** Wide image or video plus poster; authored focal point for desktop and mobile. Background video must be muted, loop only when appropriate, never carry essential information, and expose a pause/play control. The static poster is a complete experience.

**Configuration.** Content anchor (`lower-start/lower-center`), safe-zone width (`narrow/wide`), media mode (`image/video`), overlay strength (`light/medium/strong`). Avoid arbitrary alignment over unreadable image regions.

**Responsive.** Desktop ~1440: scene fills viewport; text plate stays in the lower third with a maximum measure. Mobile ~390: use a mobile crop/poster and a darker stable text gradient; content moves above the safe bottom controls. Never rely on a panoramic crop to retain the subject.

**Motion and complexity.** `MediaReveal` for entry, optional modest `ScrollScale` on a contained media layer. **High** implementation. Needs a background-media mode beyond current controlled `DesignMedia` video, including playback state, reduced-motion static fallback, and focal-point-aware sources.

### H03 — The Pause · luxury minimal

**Intent and visual concept.** The brand makes a quiet claim through absence: a small introductory label high on the page, a short headline lower on a vast open surface, then one narrow action. A tiny material detail can sit far away from the text. Study copy: “Considered, by nature.”

**Structural distinction.** Intentional empty area is the primary compositional device. H01 uses multiple editorial fields; H03 uses almost none. It survives with zero media.

**Best fit.** Bespoke hospitality, wellness, craft, fine objects, discreet professional services, galleries.

**Content contract.** Required: headline of 2–6 words, primary action or clear scroll cue. Optional: quiet eyebrow, supporting line under ~110 characters, small provenance statement. The design should reject a paragraph-length hero rather than shrink it into illegibility.

**Media contract.** None or one small detail image; square/portrait crop; alt text if informative. A large promotional image is outside this mechanism.

**Configuration.** Vertical placement (`lower/center`), statement measure (`narrow/medium`), detail media (`absent/present`), edge inset (`standard/generous`). A client may vary typeface dramatically without changing structure.

**Responsive.** Desktop ~1440: whitespace covers most of the upper field; copy lands off-center near the lower region. Mobile ~390: preserve a significant opening pause without forcing the CTA below the first screen; detail image follows the statement if present.

**Motion and complexity.** One restrained `FadeReveal`; motion may be `none`. **Low–medium** implementation. No new motion required; requires a hero-specific vertical rhythm option independent of existing section spacing.

### H04 — Counterpoint · art-directed asymmetric

**Intent and visual concept.** Two media planes and a text plane form an intentionally unequal composition: one tall primary image anchors the right, a smaller contextual crop interrupts the lower left, and the headline crosses the central negative seam. Study copy: “A different kind of presence.”

**Structural distinction.** The composition depends on relationships between *two* images at different scales and a headline that bridges them. Flipping a split hero would not reproduce it.

**Best fit.** Fashion, portrait photography, interiors, makers, cultural programming, premium products with complementary details.

**Content contract.** Required: headline, brief context line, primary action, primary image. Optional: second image, image captions, issue/collection tag, secondary action. Without the second image, a deliberate blank plane maintains the tension.

**Media contract.** Primary portrait (about 4:5) and optional secondary square/wide detail. Separate alt text and focal points. Images may never overlap critical text; decorative photos may use empty alt only when the nearby copy fully conveys the subject.

**Configuration.** Primary media share (`dominant/balanced`), secondary media presence, overlap depth (`subtle/strong`), copy measure (`tight/open`). Image left/right alone does not define a new component.

**Responsive.** Desktop ~1440: independent media tracks and central headline seam. Mobile ~390: primary image becomes a top portrait window, headline follows, small image becomes an inset after the action. Overlap becomes a shallow offset, not text obstruction.

**Motion and complexity.** `MediaReveal` on primary, `Parallax` only on the secondary layer if performance permits. **High** implementation. Needs focal-point and art-directed crop props beyond fixed `MediaFrame` ratios; CSS geometry remains component-specific.

### H05 — Choicefield · interactive story selection

**Intent and visual concept.** The hero asks a visitor what they want to explore. Three large editorial pathways occupy the stage; selecting one changes the featured headline, image, description, and destination. Study pathways: “Places / People / Practice.”

**Structural distinction.** Choice changes the *content state* of the hero. This is not a carousel for decoration or H06's static information grid. The interaction is the narrative structure.

**Best fit.** Multi-disciplinary studios, destination groups, media portfolios, education, wellness businesses with distinct journeys.

**Content contract.** Required: 2–4 pathways, each with short label, headline, summary, destination, and image; one default pathway. Optional: eyebrow and numerical index. Each state must stand alone and have a direct link; no hidden essential story behind hover.

**Media contract.** One image per pathway, ideally 3:2 or 4:5 sources with focal positions; video is out of scope for the initial mechanism. All images have meaningful alt text.

**Configuration.** Pathway count (`2/3/4`), selector arrangement (`rail/cards`), media prominence (`large/medium`). The data shape, not a long set of booleans, configures the experience.

**Responsive.** Desktop ~1440: a featured image/content stage plus a narrow selector rail; pointer hover may preview but click commits. Mobile ~390: pathway buttons become a horizontal, keyboard-operable selector above a single featured panel; no hover dependency or hidden offscreen story.

**Motion and complexity.** `MediaReveal` for initial entry; a future bounded **content crossfade** between selected states would be justified. `MagneticInteraction` is optional on the active action, not the core behavior. **High** implementation. Needs a reusable accessible selection/state pattern with focus, arrow keys, and reduced-motion transition; the current motion registry does not supply content-state management.

### H06 — Gridline · structured modern

**Intent and visual concept.** A precise editorial grid conveys capability at a glance: a compact proposition across the top, a dominant project/media cell, a short numbered capability index, and a proof/metric cell. Study copy: “Build what lasts.”

**Structural distinction.** Meaning comes from relationships among *different information modules* on a disciplined grid. H01 is a single typographic statement with a small image; H06 is a structured overview with multiple roles.

**Best fit.** Architecture and engineering, advanced technology, multi-service studios, finance, institutions, infrastructure.

**Content contract.** Required: proposition headline, one primary action, one media item, 2–4 capability labels. Optional: metric/proof, project caption, secondary action. Each module has a defined priority; no generic list of interchangeable cards.

**Media contract.** One wide or square image (or poster-backed video later), crop chosen to preserve the visual subject; caption optional but attached. Media can be absent only if the proof cell expands into that grid zone.

**Configuration.** Information density (`standard/rich`), media share (`half/two-thirds`), proof slot (`metric/quote/none`). These change information architecture rather than surface styling.

**Responsive.** Desktop ~1440: 12-column grid with aligned rules and one intentional broken span. Mobile ~390: proposition, media, capability list, proof, then action; the rules reorganize into clear stacked dividers. Do not shrink the desktop grid into tiny boxes.

**Motion and complexity.** `StaggerReveal` for distinct modules or `FadeReveal` for the whole field; no animated grid rearrangement required. **Medium–high** implementation. May need a named grid-area primitive or component-local CSS; the current equal-column `DesignGrid` is intentionally too simple for this composition.

## Navigation concepts

### N01 — Hoverline · floating minimal

**Intent and visual concept.** A compact navigation island leaves the hero visually dominant: a brand mark/text at one end, two or three immediate links, and a single menu/action trigger at the other. The island can float over media or sit on a quiet surface.

**Structural distinction.** It is a self-contained floating control cluster with deliberately limited information, rather than a full-width header. The expanded menu is a small anchored panel, not a site-wide overlay.

**Best fit.** Portfolios, boutique hospitality, campaign sites, small specialist studios.

**Content contract.** Required: brand label or supplied mark, 2–4 priority links, accessible menu label. Optional: primary action and locale. More than 5 top-level destinations should choose N04 instead.

**Media contract.** None; accepts a client-supplied brand mark with text fallback. It must work over light, dark, or moving media with an opaque control surface.

**Configuration.** Dock (`center/end`), density (`compact/comfortable`), immediate link count (`2/3/4`), surface (`opaque/translucent-with-contrast-test`).

**Responsive.** Desktop ~1440: island inset from top edge. Mobile ~390: brand plus 44px menu trigger in a compact island; open panel anchors below with full-width touch targets and does not cover the entire page.

**Motion and complexity.** `FadeReveal` for arrival; panel fade/scale can use existing motion patterns. **Medium** implementation. Requires accessible popover dismissal/focus management beyond the existing PrimaryNavigation disclosure.

### N02 — Contents / 001 · editorial overlay

**Intent and visual concept.** Navigation becomes a readable table of contents. The resting masthead is spare; opening it reveals oversized numbered destinations in a full-height editorial sheet, with a featured story or short institutional note in a secondary column.

**Structural distinction.** The open state is a content surface with hierarchy and editorial context, not a list simply enlarged from N01 or a capability mega menu like N04.

**Best fit.** Publications, galleries, cultural institutions, creative practices, brands with strong stories.

**Content contract.** Required: brand, 3–7 destination labels and URLs, menu trigger. Optional: group labels, a featured link with summary, social/utility links, edition marker. Destinations remain plain accessible links.

**Media contract.** None or one optional supporting thumbnail in the open state; no decorative image is required for the hierarchy to work.

**Configuration.** Numbering (`shown/hidden`), secondary column (`feature/utility/none`), overlay width (`full/contained`). Type system comes from the client theme.

**Responsive.** Desktop ~1440: left destination column plus narrow editorial side column. Mobile ~390: full-height sheet, destination list first, secondary content lower; scrolling occurs within the open sheet if needed, with a persistent close control.

**Motion and complexity.** `MaskReveal` for the sheet and `StaggerReveal` for links, with immediate open/close under reduced motion. **High** implementation. Needs a modal navigation primitive: focus trap, Escape close, inert background, scroll lock, and focus restoration.

### N03 — Veil / Frame · cinematic transparent

**Intent and visual concept.** A thin transparent header overlays fullscreen media, showing only brand, two key destinations, and one quiet action. As the visitor leaves the cinematic region, it settles into a solid, legible bar.

**Structural distinction.** The header changes surface/contrast *in response to the content beneath it*. N01's island remains opaque; N03 is full-width, media-aware, and transition-sensitive.

**Best fit.** Film, hospitality, visual portfolios, destination brands, event launches.

**Content contract.** Required: brand, 2–4 links, accessible menu trigger, solid-state contrast tokens. Optional: locale, action, chapter cue. It must not rely on hover to reveal navigation.

**Media contract.** The navigation owns no media; its parent scene provides a contrast classification and safe-zone map. A translucent treatment is not allowed when measured contrast fails.

**Configuration.** Overlay contrast (`light/dark/auto-with-explicit-fallback`), settle threshold, action presence, link density. Client brand mark must have light/dark forms or a text fallback.

**Responsive.** Desktop ~1440: transparent full-width bar; settle state activates after media region. Mobile ~390: brand and 44px menu control remain on a guaranteed contrast plate; expanded menu uses a solid sheet, not transparent links on moving video.

**Motion and complexity.** `FadeReveal` for initial chrome only; transition opacity/background as a bounded state change. **High** implementation. Needs section/header contrast handoff and tested safe zones; current theme tokens alone cannot infer a moving image's luminance.

### N04 — Atlas / Domains · structured capability-rich

**Intent and visual concept.** A site with depth still feels composed. A primary row shows 3–6 content domains; activating a domain opens a deliberate two-column panel with grouped destinations on one side and a short contextual feature/description on the other.

**Structural distinction.** The interaction exposes a hierarchy of destinations and context. It differs from N02's single editorial index and N01's short popover.

**Best fit.** Multi-service firms, technology platforms, architecture practices, universities, cultural institutions, larger hospitality groups.

**Content contract.** Required: brand, 3–6 domains, each with 2–8 links and clear group labels; active destination semantics. Optional: search, one featured destination, utility links, action. Content data should be a typed tree, not hard-coded JSX.

**Media contract.** Optional small image or icon in the feature column; the information architecture must work without it. Client-scoped artwork never enters the shared icon registry.

**Configuration.** Domain count, feature panel (`none/text/media`), utility row (`present/absent`), panel alignment (`left/full`). Changes should map to genuine information depth.

**Responsive.** Desktop ~1440: primary domain bar and anchored mega panel with clear focus route. Mobile ~390: drill-down list with an explicit Back control, visible current domain, and preserved navigation context; no squeezed desktop columns.

**Motion and complexity.** `FadeReveal` can introduce panel content, but navigation state changes should be immediate and nonessential animation avoided. **High** implementation. Needs accessible hierarchical menu state, focus handoff, Escape behavior, and robust long-label wrapping; current PrimaryNavigation covers only one disclosure level.

## Diversity review

The surviving hero mechanisms occupy distinct structural axes: **H01** editorial folio and side rail; **H02** full-viewport scene; **H03** deliberate near-empty field; **H04** unequal two-image composition; **H05** selectable story state; **H06** multi-role information grid. The navigation mechanisms are **N01** floating short popover; **N02** full editorial contents sheet; **N03** media-aware transparent-to-solid header; **N04** hierarchical domain explorer. None depends on a color, font, border radius, side swap, or trivial animation to justify its existence.

Pairwise audit for heroes:

| Pair | Structural reason both survive |
| --- | --- |
| 01–02 | Small punctuating image and folio vs immersive background scene. |
| 01–03 | Multiple editorial fields vs almost empty single statement. |
| 01–04 | Text-led spread vs two-image spatial counterpoint. |
| 01–05 | Fixed reading order vs selected story state. |
| 01–06 | One thesis and metadata vs multiple information modules. |
| 02–03 | Media-defined atmosphere vs absence-defined atmosphere. |
| 02–04 | One continuous scene vs separate layered media planes. |
| 02–05 | Single campaign narrative vs visitor-selected pathways. |
| 02–06 | Scene and safe zone vs grid and capability hierarchy. |
| 03–04 | Minimal single statement vs deliberately crowded image relationship. |
| 03–05 | Passive contemplative entry vs active choice. |
| 03–06 | One claim vs modular overview. |
| 04–05 | Static art direction vs content-state selection. |
| 04–06 | Free asymmetric overlap vs aligned information grid. |
| 05–06 | User-controlled featured state vs stable multi-module overview. |

Pairwise audit for navigation:

| Pair | Structural reason both survive |
| --- | --- |
| 01–02 | Anchored compact panel vs full-height editorial contents. |
| 01–03 | Opaque island vs media-aware full-width chrome. |
| 01–04 | Few immediate links vs domain hierarchy and grouped panel. |
| 02–03 | Deliberate open editorial reading surface vs unobtrusive scene overlay. |
| 02–04 | Linear table of contents vs multi-level domain explorer. |
| 03–04 | Scene contrast transition vs information architecture depth. |

Navigation and hero systems solve different jobs and can be paired selectively. H02 + N03 is natural, but not mandatory; H04 can use N01, and H06 can use N04. A choice of pairing should follow content depth and imagery, not visual family matching.

## Reusability stress test

Each mechanism was checked against three unlike hypothetical brands: **architecture studio** (project imagery, concise proof), **fitness/wellness brand** (people, programs, action), and **photographer** (image-first portfolio, minimal copy). The structure survives the following swaps; content limits and crop contracts above remain non-negotiable.

| Concept | Architecture studio | Fitness/wellness | Photographer |
| --- | --- | --- | --- |
| H01 | Material thesis + project detail | Training philosophy + portrait detail | Artist statement + small work crop |
| H02 | Building film + visit action | Movement film + class action | Landscape series + view story |
| H03 | Practice ethos, no media | Recovery promise, small detail | One-line point of view, no media |
| H04 | Exterior + material detail | Athlete + equipment detail | Portrait + process contact frame |
| H05 | Residential / civic / interiors | Train / recover / belong | Portrait / place / commission |
| H06 | Projects + capabilities + proof | Programs + outcomes + schedule | Services + selected work + credentials |
| N01 | Small studio sections | Small class/retreat site | Portfolio essentials |
| N02 | Practice archive/manifesto | Journal-led wellness | Stories, work, about |
| N03 | Film-led project launch | Movement campaign | Fullscreen portfolio |
| N04 | Sectors/services/projects | Programs/locations/resources | Collections/services/prints |

Use the three generated photographs in `assets/` only as review media; their provenance and prompts are in [ASSET_NOTES.md](./ASSET_NOTES.md). They are not client assets or theme defaults. The concepts should be reviewed again with actual client media, short and long copy, different typefaces, and different colors before implementation.

## Review decisions and engine extensions

1. Select which concepts merit implementation, including any merges or rejections after reviewing the Figma desktop/mobile studies. Do not register all ten automatically.
2. Confirm content schemas and editorial limits for chosen concepts, especially H05 pathways and N04 domain groups.
3. Add only the needed engine extensions during implementation: responsive focal-point media; a controlled background-media mode for H02; display scale control for H01; accessible selection state for H05; modal focus management for N02; content-aware contrast handoff for N03; hierarchical navigation state for N04. These are documented gaps, not preapproved global primitives.
4. Have a human evaluate imagery, copy, motion, responsive compositions, contrast, and structural originality before anything moves from concept to `experimental` code. The existing `experimental → review → production` evidence gate remains unchanged.

**Scope stop:** no React hero/navigation production implementation, registry entries, page recipes, templates, or AI composition work was created in this milestone.
