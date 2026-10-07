# Collection 005 · Media / Work

30 September 2026 · **Ready for human creative review.** Open the authenticated `/admin/lab` → Design → **Collection 005 · Media / Work**. The inspector offers study, client adaptation, 1440/768/390px artboards, a twelve-study comparison, contracts and the implementation shortlist. Earlier Collection 003/004 surfaces remain available.

These are twelve implemented creative studies, not twelve new production registrations. No commerce, page recipes, automatic composition, Services collection, new Motion Engine or Scar-derived work was added.

## Collection 004 feedback applied

[Authoritative human review](../creative-collection-004/HUMAN_REVIEW.md): S01, S02, S03, S06, S07 and S08 **Approved**; S04 **Promising / Revision Required**, with its requested arrow correction implemented and awaiting human confirmation; S05 **Rejected**, retained as a clearly labeled historical study. The approved designs are preserved. S03's text animation and preferred audio layer are future proposals, with a readable transcript and user-controlled audio as requirements. Registry lifecycle is unchanged.

## Twelve concepts and contracts

All use engine category `portfolio`, named h2 sections, semantic type roles and scoped theme providers. “Both” means section-oriented and page-capable. Page-capable sections still require a host page's navigation/title/routing; none is a hard-coded page template.

| ID / concept | Visual family | Scope | Key media contract | Viewing mechanism |
| --- | --- | --- | --- | --- |
| M01 Open index | Portfolio / Work | Both | 3–12 projects, one mixed-ratio cover plus title/discipline/note each | Native expandable project rows; project names remain the navigation |
| M02 Project chapters | Portfolio / Work | Page-capable | 3–8 ordered scenes; wide safe crops, next-scene inset | Long-form numbered narrative with scene/detail scale contrast |
| M03 Project constellation | Portfolio / Work | Both | 3–6 covers, any ratio contained; short names and notes | Spatial project selectors around a central selected image |
| M04 Contact room | Gallery / Photography | Both | 4–24 stills, all ratios preserved | Compact proof sheet beside a single enlarged frame |
| M05 The screening room | Gallery / Photography | Both | 3–30 photographs, one mounted at a time, contained in stable stage | Deliberate previous/next viewing in a dark room; no autoplay |
| M06 Horizon walk | Gallery / Photography | Page-capable | 3–12 dimensioned images, natural ratio determines scene width | Native horizontal promenade with aligned caption baseline |
| M07 Salon hanging | Gallery / Photography | Both | 4–12 uncropped stills; inconsistent portrait/landscape works welcome | Asymmetric wall with changing image size, offset and pauses |
| M08 Campaign folio | Lookbook / Campaign | Both | 4–12 images in authored spreads; odd ending becomes a single plate | Paged portrait plate + facing editorial page; visible spine |
| M09 Look / closer | Lookbook / Campaign | Section-oriented | 4–12 images forming 2–6 explicit pairs | Overview and companion switch together; not a magnifier |
| M10 Campaign score | Lookbook / Campaign | Page-capable | 3–6 safe-crop campaign images; short phrases; full-frame companions | Overscale type, broad image bands and visual counterpoints |
| M11 Media cabinet | Mixed Media | Both | 4–24 image/video records with subjects, format, dimensions, notes; video poster + descriptive transcript | Subject filtering and independent native playback |
| M12 Light table | Mixed Media | Both | 3–16 stills, mixed ratios/resolutions; no matched-camera requirement | Two independent comparison wells assigned from a shared tray |

`studies.ts` declares content, media, counts, ratios, type/art compatibility, supported controls, motion proposals, responsive behavior and constraints for every concept. `studyContract()` expresses the handoff in the existing `SectionContract` vocabulary. It is explicitly a proposal: no fictional schema is registered in Composition. `validateStudyBrief()` rejects count violations, incomplete media, duplicate IDs, incomplete M09 pairs and unsupported/missing video fields. The Lab displays an actionable invalid-content state rather than attempting to render unsupported media.

## Three unrelated adaptations per concept

- **SELVEDGE**, imagined apparel label: warm paper, burgundy accent, garment rails, outfit flat lay, leather/ceramic objects and a showroom. Four media records, two authored pairs. Editorial and expressive fashion profiles coexist with functional directory/proofing profiles depending on the mechanism.
- **INTERVAL / OFFICE**, imagined architecture practice: cool blue paper, architectural type relationships, coastal building/daylight/blue-hour, limestone, an interior and a chair. Five records create a different density and mixed ratios; M09 intentionally uses four to form two complete pairs.
- **Supper Club**, imagined neighborhood restaurant: yellow paper, wine-red typography, breakfast, dinner, coffee and dining-room imagery. Six records include two explicitly repeated editorial views, demonstrating a longer sequence rather than pretending to have six separate source photographs; three authored pairs.

Each concept has three different typography profiles, subject sets, color palettes and copy. M05 preserves its dark viewing-room behavior through three client-specific dark palettes. M04 uses each client's paper palette rather than a universal gray. There are ten typography profiles across the collection, six spatial profiles, and no universal radius or hover-zoom effect. These fixtures establish plausible structural reuse; they are not claims of completed client work.

## Responsive art direction

| Concept | Important narrow-screen decision |
| --- | --- |
| M01 | Title/discipline stay in the row; opened image precedes note. No miniature table. |
| M02 | Chapter number leads; detail and note remain adjacent below a taller main scene. |
| M03 | Spatial selectors become a two-column numbered band above the selected image. No drag or miniature diagram. |
| M04 | Enlargement precedes a four-column proof sheet with touch-size buttons. |
| M05 | Whole image remains contained in a taller stage; caption and controls move below. |
| M06 | Native horizontal pan remains, with a visible next-scene edge and keyboard progression buttons. No wheel interception. |
| M07 | Two unequal tracks plus a wider third work maintain gallery rhythm and source order. Notes stay available. |
| M08 | Spread becomes a large plate and a facing-page inset/note. Spread controls remain explicit. |
| M09 | Unequal overview/companion remain adjacent; notes sit below their images. Pair choices wrap. |
| M10 | Short chapter phrases precede taller image bands; full-image companion preserves the cropped context. |
| M11 | Two columns of stills; video occupies both columns. Filters wrap; video preload remains none. |
| M12 | Two comparison wells stay adjacent; source tray scrolls horizontally. Selection needs no dragging. |

768px artboards contract margins and retain each mechanism. Native controls provide keyboard paths alongside touch. No automatic animation or playback runs. Images have intrinsic dimensions, reserved frames and lazy loading except the principal visible image; video does not preload. Large production archives will require dedicated thumbnails, pagination and a client delivery policy.

## Motion proposals

The review round implements selection and native scrolling, not ornamental animation. Motion is fixed `none`; global production motion controls are not falsely exposed.

- M01: disclosure-height reveal; M02: chapter reveal / shallow parallax; M03: selected connector emphasis.
- M04: short enlargement crossfade; M05: cinematic crossfade after explicit navigation; M06: optional restrained smooth progression.
- M07: per-work reveal; M08: spread dissolve; M09: coordinated paired-image reveal.
- M10: type masks and opposing media progression; M11: optional filter reveal; M12: short selected-image dissolve.

All proposed capabilities require an immediate, fully visible reduced-motion state. No infinite movement, scroll hijacking, typewriter reading gate or autoplay is proposed. M11's optional native playback uses six-second **silent still-image edits** with visual transcripts, not original video footage or a simulated play button.

## Diversity review

[All 66 pairwise decisions](DIVERSITY_REVIEW.md) inspect spatial structure, type, media scale/crop/rhythm, captions, interaction and density. The closest pairs are deliberately distinguished by capability: M04's concurrent proof sheet versus M05's sequential single frame; M08's paged editorial spreads versus M09's semantically paired views; M07's spatial wall versus M02's linear chapters; M11's filterable records versus M04's frame inspection. Shared CSS utilities are not separate concepts.

**Salon hanging** uses authored image hierarchy and deterministic source order rather than a generic masonry mechanism. **Light table** introduces independent comparison wells rather than counting another thumbnail carousel. No extra grid-column or corner-radius variants are counted as concepts. M01 resembles the earlier H21 expanding-index territory; it is a body-level portfolio experiment of that mechanism, not a claim to an unrelated new production primitive. Production selection should consolidate shared mechanics where useful.

## Recommended experimental implementation shortlist

This is a recommendation only. Human selection is still required.

| Concept | Why / reusable capability | Limits | Complexity |
| --- | --- | --- | --- |
| M01 Open index | Useful compact work directory with progressive disclosure and stable location | One cover/note per project; full case studies and URL/deep-link state still need design | Medium |
| M04 Contact room | Proofing and inspection across inconsistent media ratios | Bounded sheet; dedicated thumbnails and archive pagination required | Medium |
| M08 Campaign folio | Premium editorial campaign sequencing with a real responsive spread model | Concise copy, authored pair relationships; no simulated page physics | Medium |
| M11 Media cabinet | One coherent archive for heterogeneous media, categories and native playback | Strict video/caption-track schema, pagination, source delivery and media-error states needed | High |
| M12 Light table | Independent visual comparisons without image registration or drag dependency | Stills only; no synchronization, saved annotation or persistent selection | Medium |

## Design Engine limitations uncovered

1. Runtime composition currently has finite registered image/body schemas, not a generic ordered media collection or typed pair/spread schema. Study contracts therefore remain outside runtime inventory; selected concepts need strict schemas and renderer integration in productionization.
2. The production media contract needs caption tracks, transcripts, posters, thumbnail sources and loading/error states for mixed video archives. This round supplies a limited, playable local prototype only.
3. Three authored typography profiles per concept demonstrate compatibility. Arbitrary profile/art overrides, media focal editing and content editing are not exposed or implied to work.
4. The Lab is a desktop editor with container-based client artboards. A narrow browser correctly shows its existing desktop guard. Mobile client compositions were tested at 390px artboard width; this is not a real-device touchscreen or screen-reader certification.
5. Reused assets limit the evidence: apparel consists of still-life/flat-lay imagery, and the video example is a still edit. Model-led fashion, real cinematography, multilingual copy, hundreds of records and low-bandwidth delivery need later selected-system QA.
6. Finite count contracts are not virtualization. The current experimental maximum must not be interpreted as a scalable arbitrary gallery backend.

## Verification and handoff

See [verification](VERIFICATION.md), [asset provenance](ASSET_NOTES.md), and [browser evidence](evidence/browser-matrix.json). This phase stops with Collection 005 ready for human review. No commit, push, deploy, database change, service integration or subsequent collection is included.


Urban apparel follow-up: [faceless streetwear / gymwear adaptation and verification](URBAN_REVIEW.md). Fourth client available across all twelve concepts.


Current human feedback: [twelve visually accepted, M03 revision required](HUMAN_REVIEW.md). Additional concept: [M13 Viewport gallery](M13_VIEWPORT_GALLERY.md), explicitly approved and now [registered in Composition Lab](../productionization-004-005/M13_PRODUCTION.md). Current collection has thirteen concepts / four client adaptations; earlier twelve-study sections above record the original scope.
