# Creative Collection 004 · Brand / About / Storytelling

> Update: [Authoritative human review](HUMAN_REVIEW.md) is now recorded. Earlier pending-selection language below is historical. Approved directions are preserved; S04 has its requested arrow correction; S05 is rejected from production consideration.

30 September 2026 · Creative review handoff. All eight studies remain outside reusable inventory. S01, S03 and S06 have separate **experimental** implementations, version 0.1.0. This shortlist is an engineering/design judgment for testing portability, not human creative approval. Earlier approvals and rejections remain unchanged.

## Review in Lab

Open `/admin/lab` on a desktop. Choose **Design → Collection 004 · Brand / Story**. The Study tab selects S01–S08, one of three imagined briefs, and 1440 / 768 / 390 px client artboards. “Compare eight studies” uses the same client brief across all eight, retaining each authored type/art pairing. Rationale exposes purpose, requirements, DNA, responsive reading, interaction boundaries and candidate contracts. Review explains the shortlist.

**Design → Component catalog** contains the three experimental implementations, including two structural variants, three adaptations and short/standard/long content. **Composition → 004 F–K** has two unlike Navigation/Hero contexts per implementation. The original five compositions, Calibration 003 and Batch 003 remain available. These are internal combinations, not site templates.

See [the controls audit](CAPABILITY_AUDIT.md), [implementation contracts and limitations](CANDIDATES.md), and [verification evidence](VERIFICATION.md).

## Three unrelated adaptations

Every study renders all three briefs through its own mechanism. All names, voices and copy are invented for review. No dates, awards, testimonials, project outcomes or measured results are claimed.

| Study | Common Form · furniture repair | Open Room · community learning | Field Signal · environmental research |
| --- | --- | --- | --- |
| S01 | Chair as a record of keeping and repair | Door/place as a record of welcome | Material observation as a field-note record |
| S02 | Keep useful / question perfect / allow repair | Listen / make space / keep open | Observe / expose uncertainty / return |
| S03 | Keeper and maker question what changes | Participant and host question access | Observer and reviewer question interpretation |
| S04 | Looking → treatment → use → renewed attention | Listening → invitation → gathering → listening | Observation → interpretation → trial → return |
| S05 | An object and its material inheritance | A place and its human continuation | A detail and the larger context it enters |
| S06 | Patina versus performance, access, continuity | Structure versus freedom, access, response | Clarity versus complexity, uncertainty, correction |
| S07 | Letter to the next keeper | Letter to those shaping the room | Letter to the next reader of a record |
| S08 | Find → work → pass responsibility for an object | Find → work → pass responsibility for a place | Find → work → pass responsibility for an observation |

Fixtures live in `design-engine/preview/collection-004/fixtures.ts`. Reusable source does not import them.

## Study records

All eight studies are complete with **motion none**. No hover-only text, scroll gates, fake play buttons or hidden narrative panels are required. Every study has a body h2 and subordinate h3s where appropriate. Their authored typography profiles are all different; eight profiles exceed the six-profile minimum, with no consecutive duplicate.

### S01 · Object biography

**Typography / art direction:** editorial / publication.

- **Visitor purpose:** Understand an origin through a tangible thing and the decisions it carries.
- **Narrative and spatial mechanism:** An artifact occupies the center of an annotated dossier. Three numbered observations orbit its edges; an origin-to-continuation sentence closes the record.
- **Required content:** One real artifact or place, three observations, an origin and a continuing question. No invented dates or provenance.
- **Media:** One source image with alt, dimensions and authored focal points. Portrait/emphasis or contained crop; keep the object complete. Attribution in caption.
- **Reading order:** Desktop: title, object with side records, continuation. Tablet: narrower object plus records. Mobile: title → object → three records → continuation. DOM order is constant.
- **Implemented / proposed:** Study is fully static. Candidate implements the same reading surface; no hotspots or hover-only notes.
- **Candidate capability boundary:** story.object-biography · two structures · image treatments · none · publication/gallery/precision/runway spatial support
- **Nearest concepts:** H23 also values an object, but S01 is a body dossier of observations rather than an edition Hero; H27 keeps one margin whereas this uses several authored records.

### S02 · The manifesto fold

**Typography / art direction:** poster / billboard.

- **Visitor purpose:** Make a set of beliefs memorable and give each a practical meaning.
- **Narrative and spatial mechanism:** Three large statements occupy alternating full-width folds; each is interrupted by one small explanation. A continuous argument, not a card set.
- **Required content:** Exactly three concise beliefs and their practical explanations; a shared introductory line.
- **Media:** Type only. No image or icon requirement; the hierarchy must stand without decoration.
- **Reading order:** Desktop: long fold / inset fold / long fold. Tablet keeps alternating indentation. Mobile removes indentation and reads top to bottom.
- **Implemented / proposed:** No interaction or animation implemented. Optional future print/export is a proposal only.
- **Candidate capability boundary:** Potential: three-clause schema; fixed fold; all type roles; billboard/publication; none; no media.
- **Nearest concepts:** S06 turns beliefs into inspectable tradeoffs; S02 is a spoken argument. H19 is an event bill, with date/program rather than beliefs.

### S03 · Working conversation

**Typography / art direction:** humanist / salon.

- **Visitor purpose:** Meet a practice through the questions and perspectives that shape its work.
- **Narrative and spatial mechanism:** A question crosses the page, answered by a named role in an offset transcript lane. Successive exchanges make a conversation with visible turns.
- **Required content:** Two to four approved questions, speakers, roles and answers. Fixtures are explicitly invented dialogue, never testimonials.
- **Media:** No media required. A conversation must be legible without portraits or stock people.
- **Reading order:** Desktop: broad question → narrow speaker gutter → answer. Tablet retains speaker gutter. Mobile stacks question, speaker, answer, attribution before next turn.
- **Implemented / proposed:** Study/candidate are static transcripts. A future audio reading is proposed, not a working play button.
- **Candidate capability boundary:** story.working-conversation · transcript/roundtable · no media · none · salon/publication/precision/gallery
- **Nearest concepts:** S07 is one sustained letter; this alternates questions and voices. H20 is a first-screen invitation, not an attributed exchange.

### S04 · A practice in orbit

**Typography / art direction:** geometric / precision.

- **Visitor purpose:** Explain why a process returns to its starting question.
- **Narrative and spatial mechanism:** Four stations share a circular route around one constant question. The return link is the narrative; no claim of linear completion.
- **Required content:** A central question, four named steps and a meaningful return relationship.
- **Media:** Code-native diagram, no photograph. All diagram labels also appear in semantic ordered text.
- **Reading order:** Desktop: orbit beside a short key. Tablet retains the orbit above key. Mobile converts to numbered reading list and a small still loop; no horizontal pan.
- **Implemented / proposed:** Static diagram only. Keyboard station highlighting is a possible future experiment, not implemented.
- **Candidate capability boundary:** Potential: four-step cycle schema; fixed orbit; geometric/technical/humanist; precision/publication; none; semantic SVG plus list.
- **Nearest concepts:** H24 exposes physical parts; S04 explains recurrence. S08 is an irreversible handoff, so it should never be drawn as a loop.

### S05 · Two inheritances

**Typography / art direction:** luxury / gallery.

- **Visitor purpose:** Show what a practice receives and what it chooses to carry forward.
- **Narrative and spatial mechanism:** Unequal photographic shelves are connected by a shared verbal hinge. Origin and continuation remain distinct readings, not an interactive before/after.
- **Required content:** Two related images, two clear captions and one bridge statement. Avoid unsupported heritage dates.
- **Media:** Two independently cropped sources. Broad first shelf and tighter second; never imply identical camera registration. Author focal points and credit both.
- **Reading order:** Desktop: wide first shelf, hinge, inset second shelf. Tablet preserves unequal widths. Mobile reads first caption/image → hinge → second caption/image.
- **Implemented / proposed:** Static; no wipe, auto-crossfade or drag comparison. Optional future source links are proposed.
- **Candidate capability boundary:** Potential: paired-story schema; fixed shelves; luxury/editorial/humanist; gallery/publication; none; two independently authored images.
- **Nearest concepts:** H12 is a registered visual comparison; S05 explicitly is not. S01 examines one object, while this binds two moments with an inheritance.

### S06 · The decision ledger

**Typography / art direction:** technical / precision.

- **Visitor purpose:** Understand a belief through its tensions and observable working choices.
- **Narrative and spatial mechanism:** A continuous ruled ledger aligns principle, tension and practice. Rationale sits under the decision it qualifies; no score or invented proof.
- **Required content:** Two to five principles with a real tradeoff, a working choice and a rationale. Client must approve the promises.
- **Media:** Type only; rules express relationships, not a decorative grid.
- **Reading order:** Desktop: three aligned ledger columns. Tablet keeps three at readable widths. Mobile each numbered record becomes principle → tension → practice → rationale.
- **Implemented / proposed:** Study shows the complete open ledger. Candidate additionally implements native rationale disclosures (Enter/Space, visible focus), with no animation.
- **Candidate capability boundary:** story.decision-ledger · open/disclosure · no media · none · precision/publication/billboard
- **Nearest concepts:** Feature List is a collection of independent cards. This binds three comparison dimensions row by row. S02 voices beliefs without weighing a tradeoff.

### S07 · A letter, still open

**Typography / art direction:** fashion / runway.

- **Visitor purpose:** Let a visitor read one sustained, personal explanation of intent.
- **Narrative and spatial mechanism:** An expansive salutation opens a narrow letter column. An indented second thought and a detached postscript slow the cadence before the sign-off.
- **Required content:** One approved author or collective voice, salutation, two paragraphs, sign-off and postscript. Do not simulate a real signature.
- **Media:** No media. Typography, line measure and pauses carry the correspondence.
- **Reading order:** Desktop: salutation across field, inset letter, side postscript. Tablet contracts the pause. Mobile reads salutation → paragraphs → sign-off → postscript.
- **Implemented / proposed:** Static complete letter; no typewriter, scroll gate or fake signature animation.
- **Candidate capability boundary:** Potential: letter schema; fixed letter; fashion/editorial/humanist; runway/publication; none; no media.
- **Nearest concepts:** S03 is multi-voice and turn-based; S07 is one author in a continuous reading column. H27 is evidence-led and would lose its purpose without the source margin.

### S08 · Material relay

**Typography / art direction:** brutalist / billboard.

- **Visitor purpose:** Follow a material or idea as responsibility passes from one step to another.
- **Narrative and spatial mechanism:** Three adjacent image slices make a single contact strip, crossed by oversized handoff verbs. A common caption rail ties each slice to its responsibility.
- **Required content:** Three stages with distinct responsibility, image and verb; preserve causal sequence.
- **Media:** These fixtures use three authored crops of one source object, not documentary process records. A client can supply three related stage images. Each slice has a separate accessible caption and focal point; detail is intentional.
- **Reading order:** Desktop: uninterrupted triptych and caption rail. Tablet retains strip with smaller verbs. Mobile folds into three consecutive image/caption records.
- **Implemented / proposed:** Static relay. A later source-inspection interaction is a proposal only; images are not fake buttons.
- **Candidate capability boundary:** Potential: three-stage relay schema; fixed strip; brutalist/poster/technical; billboard/precision; none; three image records.
- **Nearest concepts:** S05 connects two open-ended inheritances; S08 is a specific three-stage transfer. S04 returns to its beginning whereas this hands off forward.

## Media provenance

No images were generated or acquired for this campaign. Review fixtures reuse generated concept assets already retained in Creative Collection 001 and Calibration 002: metal-chair-portrait, coastal-architecture, coastal-stone-detail and portrait-study. The existing stage-performer import remains available as a fixture but is not used by these eight rendered studies. Original provenance records are retained in those collections. Images and footer copy explicitly identify illustrative/generated material; they are not client documentary evidence.

S01 keeps a single authored object with dimensions, alt text and desktop/mobile focal points. S05 uses two unrelated crops joined by an editorial idea; it never claims the photographs register for comparison. S08 was revised from a mixed-source strip to three crops of the same subject, making the handoff mechanism coherent. Those crops are an illustrative reading of responsibility, not three documented manufacturing stages. Real adaptations require approved content, actual relevant media, credits and rights.

## Visual comparison and revisions

The eight individual desktop compositions were inspected in the actual Lab, followed by responsive artboards and the comparison view. The assessment below is qualitative; no numeric diversity score or metadata-derived pass is asserted.

| Study | Typography / rhythm observed | Composition / media observed | Interaction / motion observed |
| --- | --- | --- | --- |
| S01 | Fraunces-led editorial title; numbered, measured pauses | Central artifact dossier, three side records, closing continuation | Static, full record visible / none |
| S02 | Anton statements build three loud beats with small explanation pauses | Alternating full-width folds, no image field | Static argument / none |
| S03 | Humanist questions alternate with quieter attributed responses | Offset transcript lanes rather than repeated picture/text splits | Static turns / none |
| S04 | Geometric labels follow circular rather than linear rhythm | Central still orbit plus ordered semantic key; diagram only | Static diagram, no fake station buttons / none |
| S05 | Fine display serif and broad pauses at the hinge | Two unequal photographic shelves and one verbal bridge | Static pair, no comparison slider / none |
| S06 | Technical aligned labels and repeated ruled decisions | Three relational columns; rationale attaches to each row; no imagery | Open ledger study / none; candidate adds native disclosure |
| S07 | Expressive serif salutation, sustained narrow reading, detached P.S. | One authored letter field rather than alternating speakers | Static correspondence / none |
| S08 | Dense blunt verbs across a continuous image strip | Stepped triptych with a shared caption rail; three related crops | Static forward transfer / none |

The strongest collision risks were S01/S05, S02/S06, S03/S07 and S04/S08. Comparing those pairs in rendered form preserves one dossier versus two inheritances; spoken convictions versus explicit tradeoffs; turn-taking versus one author; and a return loop versus a forward handoff. S06's header initially lost alignment with its rows and was corrected to span all three columns. Typography selectors initially flattened several study display sizes; scoped structural selectors now preserve the intended hierarchy. S08's long verbs were narrowed and kept intact at small widths; its unrelated montage was replaced with a single-subject relay. S05/S08 frame-ratio specificity was corrected after visual review.

### All-pair comparison

Typography and rhythm differences are established in the table above for each endpoint. **Interaction and motion are deliberately shared across all 28 study pairs: static reading and none.** They are not counted as artificial differences. The following comparison addresses composition/media and the resulting narrative cadence for every pair.

| Pair | Distinction retained after inspection |
| --- | --- |
| S01 / S02 | One photographed object with surrounding evidence versus three type-only declarations |
| S01 / S03 | Object-centered dossier versus alternating attributed voices |
| S01 / S04 | Artifact and observations versus diagrammatic recurrence around a question |
| S01 / S05 | One subject examined in depth versus two unequal image shelves joined by a hinge |
| S01 / S06 | Asymmetric image-led annotations versus continuous relational rows |
| S01 / S07 | Evidence around an object versus a sustained authorial letter |
| S01 / S08 | Stationary artifact under observation versus a forward strip of responsibilities |
| S02 / S03 | Declarative full-width beats versus questions with offset answers |
| S02 / S04 | Linear typographic argument versus circular return with a semantic key |
| S02 / S05 | Image-free convictions versus slow photographic inheritance |
| S02 / S06 | Three memorable statements versus principle/tension/practice relationships |
| S02 / S07 | Repeated loud folds versus salutation, continuous prose and postscript |
| S02 / S08 | Type is the subject versus verbs crossing a continuous photographic strip |
| S03 / S04 | Human turn-taking versus a recurring process diagram |
| S03 / S05 | No imagery, alternating voices versus image shelves and a shared hinge |
| S03 / S06 | Question/answer cadence versus simultaneous relational columns |
| S03 / S07 | Explicit successive voices versus one sustained voice and detached afterthought |
| S03 / S08 | Conversational pauses versus connected photographic handoffs |
| S04 / S05 | Return loop versus a two-source open-ended inheritance |
| S04 / S06 | Spatial recurrence around a center versus repeated aligned tradeoffs |
| S04 / S07 | Diagram and key versus literary field and postscript |
| S04 / S08 | Recurrence returns to the beginning; the photographic relay passes forward |
| S05 / S06 | Unequal photographic shelves versus type-only continuous ledger |
| S05 / S07 | Two visual inheritances versus a single written address |
| S05 / S08 | Two separated shelves and pause versus three contiguous responsibility slices |
| S06 / S07 | Comparative reading across rows versus continuous prose and an afterthought |
| S06 / S08 | Type-only measured tradeoffs versus image-led handoff beats |
| S07 / S08 | Long quiet reading with an expansive opening versus compressed photographic verbs |

Human review should judge whether each mechanism earns its content and whether the preferred directions merit further development. The implementation shortlist does not settle that decision.
