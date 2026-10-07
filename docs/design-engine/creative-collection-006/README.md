# Collection 006 · Services / Capabilities

1 October 2026 · **Creatively approved by the user** · 12 Lab-only studies · 36 adaptations.

Open **Lab → Design → Collection 006 · Services / Capabilities**. The Study inspector selects a concept, client adaptation and 1440/768/390px artboard. Compare twelve studies provides a static overview with individual inspect buttons. Contract explains the payload, media, bounds, mobile strategy and proposal compatibility; Review contains the shortlist and boundaries.

This creative review round is approved; reusable implementation remains a separate phase. None of C01–C12 is registered in Composition or promoted. The existing 54 registrations, 18 Production implementations, earlier collection workspaces and earlier authoritative human review decisions remain unchanged. Collection 006 approval is now recorded in the canonical review ledger. No Service Detail routes, pricing, commerce, recipes, automatic generation, Collection 007 or Motion Engine expansion were added. Scar was not referenced.

## Human review — 1 October 2026

All twelve concepts, **C01–C12**, are approved. The user particularly likes **C03 · Capability desk** and **C10 · Evidence in practice** for their image usage and animation potential to make pages feel more alive.

Ongoing direction: sections/components should be immersive and invite interaction through animation, visual attraction, imagery, graphics and functional icons. Preserve these qualities during future implementation; maintain meaningful content, keyboard/touch access and reduced-motion alternatives. This feedback does not request animation implementation or production promotion in this pass.

The same review explicitly reaffirms **H09 · Object Study** and **H16 · The Vertical Record**. Their approval is recorded in the canonical review ledger and Calibration 003 feedback document. The user expressly reserves their Composition Lab migration for another model; no migration or component changes were made here.

## Inventory and information models

| Study | Information / discovery model | Scale | Page capability |
| --- | --- | --- | --- |
| C01 · The service index | A numbered directory places service titles on a broad left spine and concrete deliverables in a narrow right margin. Readers scan names before committing to detail. | 3–7 offerings; 2–4 deliverables each | section-and-page-capable |
| C02 · What we make possible | A service manifesto turns short verbs into a typographic wall, each followed by the promise and the explicit limit of that commitment. | 3–5 commitments | section-oriented |
| C03 · Capability desk | A persistent capability directory controls a single evidence desk: selected description, outcome and one image or technical diagram. The visitor chooses the reading order. | 4–8 capabilities | section-and-page-capable |
| C04 · Inside the offering | A calm directory exposes a short summary at rest; each independently expandable row explains what is included and what is outside the engagement. | 5–10 services | section-and-page-capable |
| C05 · From friction to possibility | A large visitor problem is answered by a narrower capability bridge and a concrete outcome. Repeated horizontal triptychs make the causal story readable at a glance. | 3–5 customer situations | section-and-page-capable |
| C06 · The capability journey | An ascending sequence of numbered stations follows a visitor through inputs, work and handoff. Responsibilities make the progression actionable rather than decorative. | 3–6 ordered stages | page-capable |
| C07 · Discipline matrix | A grouped responsibility matrix maps capabilities to delivery phases. Lead, Support and not-in-scope cells communicate coverage rather than a list of marketing claims. | 6–20 capabilities in 3–4 groups; 3–4 phases | page-capable |
| C08 · Connected capabilities | A system cutaway traces an input through named responsibility layers to an output. Each connector labels the actual handoff between layers. | 3–5 dependent layers; 2–4 components each | section-and-page-capable |
| C09 · Service field atlas | Unequal photographic plates place a service name alongside a concrete application. Large and small evidence plates alternate; imagery carries the first reading. | 3–5 offerings with visual evidence | page-capable |
| C10 · Evidence in practice | Two explicitly labelled evidence plates sit across a capability explanation. A case selector switches the complete problem/intervention/result relationship. | 2–4 capability cases | section-oriented |
| C11 · Find your starting point | A visitor starts with a need, not a service name. Selecting that need reveals one explained starting point and an explicit alternative when it is a poor fit. | 3–5 visitor needs | section-oriented |
| C12 · Scope companions | A scope comparison exposes how engagements differ without price or ranking. Visitors pin a baseline and a candidate while shared criteria stay aligned. | 2–3 offerings; 5–10 shared criteria | section-and-page-capable |

## Three unrelated adaptations

Every study is rendered with all three briefs, not just three palette samples. They use independently authored service/program/platform content, imagery, foreground/background tokens and typography relationships. All names and content are fictional.

- **COMMON GROUND — architecture practice:** site reading, concepts, technical coordination, observation and reuse. Warm limestone paper and architecture/detail photography. Four entries in C01/C03, six discipline rows in C07, two evidence cases.
- **RELAY / DATA — infrastructure platform:** ingestion, transformation, governance, observability, delivery and replay. Dark green technical surfaces; four new explanatory SVG diagrams replace photographs. Six entries in C01/C03, twelve discipline rows in C07, three evidence cases. Content describes platform features and responsibilities rather than agency services.
- **Gather school — community cooking school:** beginner meals, seasonal workshops, group learning, skills and habits. Warm ochre paper, food/table imagery and approachable language. Five disclosures in C04, six discipline rows in C07, two evidence cases. The scope comparison describes program differences without price.

The 108-case browser matrix covers these 36 adaptations at desktop, tablet and phone widths. [Verification](VERIFICATION.md) distinguishes automation from visual and keyboard checks.

| Study | Architecture typography | Platform typography | Cooking typography | Spatial direction |
| --- | --- | --- | --- | --- |
| C01 | editorial | technical | humanist | publication |
| C02 | poster | brutalist | playful | billboard |
| C03 | neo-grotesk | technical | geometric | precision |
| C04 | humanist | neo-grotesk | luxury | salon |
| C05 | luxury | humanist | editorial | publication |
| C06 | geometric | editorial | technical | gallery |
| C07 | technical | geometric | neo-grotesk | precision |
| C08 | brutalist | technical | geometric | precision |
| C09 | fashion | neo-grotesk | luxury | runway |
| C10 | editorial | humanist | poster | publication |
| C11 | playful | luxury | humanist | salon |
| C12 | neo-grotesk | brutalist | technical | precision |

All ten existing typography profiles are used. No consecutive primary studies share a profile. Roles use licensed fonts already supplied at the Lab route; no new font library or global font preload was introduced. Poster C02 uses oversized verb bands; technical C07 exposes dense tabular hierarchy; fashion C09 uses large italic type and offset plates; humanist C04 uses conversational summaries. Typography changes hierarchy and measure, not just font family.

## Study dossiers

Content is validated by twelve separate strict schemas in `design-engine/preview/collection-006/contracts.ts`. Unknown properties are rejected. Common heading limits are brand 60, title 100 and introduction 260 characters; titles within offerings cap at 60 unless otherwise stated. Required images carry source, alt text and positive intrinsic dimensions. Lists reject duplicate IDs within their ownership scope. C07/C12 validate one relationship value per column/criterion.

Each study declares an existing `SectionContract` proposal, including usage, typography, art direction, reading order and flow. These proposals are review metadata, not runtime registrations or proof of arbitrary pairing compatibility. Brand tokens inherit from the host; these studies expose no arbitrary local style controls. All current motion is **none**. Future motion is described separately below.

### C01 · The service index

- **Content contract:** entries: id, title ≤60, summary ≤220, 2–4 deliverables ≤60, detail link. Section title ≤100; introduction ≤260.
- **Media requirement:** None. No icon system needed.
- **Responsive decision:** Number becomes an inline prefix; deliverables become a compact line below the summary, preserving the index rather than cards.
- **Actual interaction:** Native anchors lead to an in-study service summary; future hosts can supply service detail URLs.
- **Proposed motion:** Future StaggerReveal for rows; all entries visible with motion none.
- **Composition compatibility:** Contents or Primary Navigation; Front Page or Statement Hero; Open Letter before / Open Index after. Inherited opaque surface, inset document flow. Avoid an adjacent giant type manifesto.
- **Limitations:** Names should fit two lines. Seven entries maximum; no nested taxonomy.

### C02 · What we make possible

- **Content contract:** promise ≤120; principles: verb ≤28, pledge ≤160, boundary ≤120. Not a service list.
- **Media requirement:** None. Type is the primary visual material.
- **Responsive decision:** Oversize verbs become separate full-width bands; the promise and boundary remain visibly paired, with no clipped display type.
- **Actual interaction:** Static reading; no false button treatments.
- **Proposed motion:** Future SplitTextReveal for verbs only; whole readable text in reduced motion.
- **Composition compatibility:** Quiet Primary Navigation and Statement Hero; restrained Open Letter or Contact Room neighbors. Inherited opaque full-width section; do not place beside Manifesto Fold or Campaign Score without a quiet interval.
- **Limitations:** Not for technical inventories or exhaustive descriptions. Editorial verbs must be concrete.

### C03 · Capability desk

- **Content contract:** capabilities: id, title, category ≤32, description ≤220, outcome ≤120, image and detail link.
- **Media requirement:** One image or diagram per capability; intrinsic size and alt required. All source ratios contained.
- **Responsive decision:** Directory becomes a wrapping two-column button list before the selected evidence; selected title repeats above the evidence.
- **Actual interaction:** Click, keyboard activation or touch selects; pressed state and live title. No hover-only content.
- **Proposed motion:** Future restrained MediaReveal after selection; instant swap in current study.
- **Composition compatibility:** Contents / Primary Navigation, Open Circuit or Front Page Hero; Decision Ledger and Screening Room neighbors with clear section boundaries. Inherited inset surface, no sticky ownership.
- **Limitations:** Eight choices maximum. Only selected media mounted; authored explanations must stand without the image.

### C04 · Inside the offering

- **Content contract:** services: id, title, summary ≤120, 2–5 included items ≤80, boundary ≤140, detail link.
- **Media requirement:** None. Functional chevrons use VigilIcon; no decorative service icons.
- **Responsive decision:** Native disclosures retain source order; open content stays attached to its trigger. Several services may remain open for comparison.
- **Actual interaction:** Native details/summary with Enter and Space. No custom accordion focus trap.
- **Proposed motion:** Native instant disclosure now; a future measured-height transition would need testing beyond current engine primitives.
- **Composition compatibility:** Any in-flow approved Navigation with Statement / Between Acts Hero. Working Conversation nearby can repeat disclosure rhythm; separate with Gallery Hanging. Inherited inset surface, no sticky behavior.
- **Limitations:** No nested accordions. Ten top-level offerings maximum.

### C05 · From friction to possibility

- **Content contract:** situations: need ≤120, response ≤140, outcome ≤120, evidence ≤160. Evidence is authored and must not imply verified results.
- **Media requirement:** None. Written evidence is mandatory.
- **Responsive decision:** Problem and outcome sit on opposite sides of a vertical spine, with the capability between them. Labels preserve causal order.
- **Actual interaction:** Static ordered narratives.
- **Proposed motion:** Future FadeReveal per complete situation; never reveal outcome before the problem.
- **Composition compatibility:** Primary Navigation and quiet Statement / Front Page Hero; Object Biography then Light Table can extend evidence. Inherited inset document flow. Avoid competing horizontal scroll regions.
- **Limitations:** Outcomes must be framed as intended outcomes unless substantiated. Not a substitute for a case-study evidence contract.

### C06 · The capability journey

- **Content contract:** stages: id, title ≤60, input ≤100, work ≤140, output ≤100, owner ≤60. Ordered data is the journey.
- **Media requirement:** None. Rules connect actual adjacent handoffs only.
- **Responsive decision:** An alternating vertical timeline keeps station numbers in a left rail. No sticky panels or horizontal scrolling.
- **Actual interaction:** Continuous document reading with all stages exposed.
- **Proposed motion:** Future StaggerReveal by stage; optional progression must not become scroll pinning.
- **Composition compatibility:** Contents Navigation, Front Page / Assembly Hero; Material Relay may duplicate sequence, so prefer Open Letter and Gallery Hanging. Inherited inset flow; no sticky ownership.
- **Limitations:** Only valid for genuinely sequential work; independent services should use C01 or C03.

### C07 · Discipline matrix

- **Content contract:** phases: 3–4 labels; groups: 3–4 names with 2–5 capabilities, id, title and exactly one coverage value per phase.
- **Media requirement:** None. Text cells convey meaning without color or icons.
- **Responsive decision:** A phase selector shows one readable column at a time, retaining every group and capability. Desktop exposes the full table.
- **Actual interaction:** Mobile select changes the inspected phase. Table row/column headers preserve relationships.
- **Proposed motion:** None proposed; stable information layout is the useful behavior.
- **Composition compatibility:** Primary / Contents Navigation and Open Circuit / Statement Hero; Decision Ledger and Contact Room as neighbors. Precision art direction only; light or dark inherited opaque tokens, inset flow.
- **Limitations:** Not a pricing table; no numerical proficiency scores. Twenty capabilities maximum; no virtualized archive.

### C08 · Connected capabilities

- **Content contract:** input and output ≤80; layers: id, title, responsibility ≤100, 2–4 component names ≤50 and handoff ≤80.
- **Media requirement:** Semantic HTML diagram generated from the layered contract. No image dependency.
- **Responsive decision:** The cutaway becomes a vertical stack with handoff labels between layers; full explanations remain in document order.
- **Actual interaction:** Static inspectable diagram; no meaningless animated connectors.
- **Proposed motion:** Future capability tracing via existing reveal primitives, only in input-to-output order.
- **Composition compatibility:** Primary Navigation and Open Circuit / Assembly Hero; follow Working Conversation or precede Project Chapters. Opaque inherited inset surface, no overlay safe zone or sticky behavior.
- **Limitations:** A linear dependency chain only; branching graphs require a future contract. Do not infer causal relationships from spatial proximity.

### C09 · Service field atlas

- **Content contract:** plates: id, title, image, caption ≤160, application ≤140, detail link. Caption explains the service-to-image relationship.
- **Media requirement:** One authored image or diagram per offering, all contained. Portrait and landscape remain different sizes without subject cropping.
- **Responsive decision:** Two tracks retain unequal image scale; every second plate spans the width. Labels follow the corresponding image in source order.
- **Actual interaction:** Native links to in-study service summaries; future detail-page destinations belong to the host.
- **Proposed motion:** Future MediaReveal at plate boundaries; no parallax or pointer effects in study.
- **Composition compatibility:** Quiet Primary / Island Navigation with Statement or Between Acts Hero; Open Letter then a compact Open Index. Avoid Gallery Hanging immediately adjacent. Inherited full-width flow.
- **Limitations:** Needs useful evidence imagery, not unrelated stock decoration. Long prose belongs elsewhere.

### C10 · Evidence in practice

- **Content contract:** cases: id, title, before/after image+label+note, capability ≤80, evidence ≤180. Labels may describe two illustrative states rather than measured before/after.
- **Media requirement:** Two authored images/diagrams per case; matching camera geometry is not required. Captions state the relationship honestly.
- **Responsive decision:** Both evidence plates remain adjacent above the full explanation; no comparison wipe, dragging or tiny text overlay.
- **Actual interaction:** Named case buttons switch both plates, the capability and evidence together. Live case title; no automatic progression.
- **Proposed motion:** Future paired MediaReveal; static swap is current behavior.
- **Composition compatibility:** Contents Navigation, quiet Statement / Front Page Hero; Decision Ledger before and Contact Room after. Avoid adjacent Comparison Hero / Look Closer repetition. Inherited inset document flow.
- **Limitations:** Demonstration assets are illustrative, never proof of client outcomes. Needs editorial evidence review before client publication.

### C11 · Find your starting point

- **Content contract:** question ≤100; paths: id, title, need ≤90, recommendation ≤100, reason ≤160, alternative ≤120, detail link.
- **Media requirement:** None. Text-only choices with no category icon decoration.
- **Responsive decision:** Needs remain large wrapping choices; the recommendation follows directly, with clear selected state and no route change.
- **Actual interaction:** Named buttons with pressed state update a polite result region. No lead capture, automated diagnosis or score.
- **Proposed motion:** Future restrained FadeReveal on the recommendation; no quiz transitions or automatic advancement.
- **Composition compatibility:** Primary Navigation and Statement / Between Acts Hero; Working Conversation and Screening Room nearby. Inherited inset opaque surface; centered art direction only.
- **Limitations:** One authored decision level, not a rules engine. No inferred personalized advice.

### C12 · Scope companions

- **Content contract:** criteria: 5–10 labels; offerings: id, title, bestFor ≤140, exactly one value per criterion, boundary ≤120, detail link.
- **Media requirement:** None. Every cell uses explicit wording, not ambiguous ticks.
- **Responsive decision:** Two labelled selectors retain a side-by-side comparison; criteria occupy their own full-width line above each value pair.
- **Actual interaction:** Independent baseline/candidate selectors; desktop shows all scopes. Identical selection is permitted and labelled as such.
- **Proposed motion:** None proposed; stable aligned comparisons take priority.
- **Composition compatibility:** Primary Navigation and Statement / Open Circuit Hero; Open Letter and Open Index neighbors. Avoid adjacency with C07 or other dense tables. Precision only, inherited inset document flow.
- **Limitations:** No price, billing period, checkout or automatic best choice. Requires truly shared comparison criteria.

## Media and detail awareness

C03/C09 require one image or diagram per capability; C10 requires an explicit pair per case. Sources are contained rather than cropped. The other studies require no bitmap media. C08 is a semantic HTML system diagram with real named handoffs; C04 alone uses a functional VigilIcon chevron. There are no decorative service icons.

Architecture sources are existing Calibration 002 coastal/day/evening/stone assets plus Collection 001's architecture study. Cooking sources are Collection 005's four restaurant assets; their original provenance remains in that collection's asset notes. No Express layout/code was imported. RELAY diagrams are original native SVG illustrations, not product screenshots. C10 expressly describes illustrative relationships, not measured before/after outcomes. These are internal review assets; production asset rights/delivery remain subject to the existing client gate.

C01/C03/C04/C09/C11/C12 include named links and local summary destinations. Activating a link focuses a local summary; Return to offerings restores focus. The current Lab schema accepts only local anchors to avoid creating broken service routes. A selected future implementation must use the engine's shared link schema at its host boundary. No Service Detail page or routing layer is implemented.

## Anti-convergence review

See [the complete 66-pair comparison](ANTI_CONVERGENCE.md). All twelve retain distinct information mechanisms; none is a card-grid restyle. Close pairs receive explicit scrutiny. C10 uses paired case evidence to distinguish it from C03’s single-stage explorer. C07 uses grouped responsibility relationships to go beyond a flat feature checklist. These are design decisions, not human rejections or production approvals.

The common brand/section masthead is review context; comparison focuses on the actual offering mechanism beneath it. The first browser inspection exposed engine heading specificity overriding display roles; scoped study styles now preserve the intended display hierarchy. Overview button styles were also scoped to the inspect buttons so they cannot restyle the client studies.

## Original experimental implementation shortlist — before human review

- **C01 · The service index:** Low interaction and responsive complexity. A useful compact directory that can also anchor a full services page; limited to seven clearly named offerings. Distinction: A numbered directory places service titles on a broad left spine and concrete deliverables in a narrow right margin. Readers scan names before committing to detail.
- **C03 · Capability desk:** Medium interaction and responsive complexity. Adds deliberate service discovery with an evidence relationship; supports a substantial capabilities page, bounded to eight choices. Distinction: A persistent capability directory controls a single evidence desk: selected description, outcome and one image or technical diagram. The visitor chooses the reading order.
- **C07 · Discipline matrix:** Medium interaction and responsive complexity. Fills the complex-organization gap with explicit responsibility coverage; page-capable, but requires a meaningful phase taxonomy. Distinction: A grouped responsibility matrix maps capabilities to delivery phases. Lead, Support and not-in-scope cells communicate coverage rather than a list of marketing claims.
- **C09 · Service field atlas:** Low interaction, medium responsive complexity. Proves services through application imagery and supports an entire services page; strong media curation is required. Distinction: Unequal photographic plates place a service name alongside a concrete application. Large and small evidence plates alternate; imagery carries the first reading.
- **C11 · Find your starting point:** Medium interaction, low responsive complexity. Helps visitors who do not know service terminology. Section-oriented; a deeper branching journey remains future work. Distinction: A visitor starts with a need, not a service name. Selecting that need reveals one explained starting point and an explicit alternative when it is a poor fit.

The user subsequently approved all twelve studies and especially favored C03 and C10. The original shortlist above is historical; it does not limit the approval. No reusable implementation or migration is performed by recording that approval. A future implementation must retain its source study, add neutral component source and strict host-facing contracts, then prove two unlike mixed compositions and pass the existing promotion gate.

## Design Engine limitations discovered

1. The existing typography selector rules have greater specificity than a simple `.de-root .study h2` rule. The study needs an explicit scoped role override; no global engine styles were changed.
2. The current flow contract supports only `sticky: false`. These studies deliberately use document flow; a sticky service journey would need a proved contract extension later.
3. Native disclosures are reliable at motion none. A measured-height accordion transition is not currently an established engine behavior; it remains a proposal.
4. The Lab has authored content fixtures rather than a generic per-study content editor. Bounds are executable schemas and visible in the inspector; production editing/data adapters remain future work.
5. Service destinations can be modelled now, but the internal summary preview is not a substitute for a Service Detail router or page contract.
6. Comparison overview frames are intentionally clipped and inert. Individual inspection is the authority for full reading order, interactions and mobile states.
7. Capability compatibility is declared as a proposal. No unapproved studies were inserted into executable mixed compositions simply to claim runtime compatibility.

## Composition title cleanup

All 35 existing test compositions now use readable scenario titles while retaining their stable IDs and content. Examples: “Architecture · Editorial introduction”, “Workshop story · Object biography with editorial hero”, and “Viewport Gallery · Hospitality · Poster composition”. Machine-like collection codes and kebab-case component fragments no longer lead the selector. Reset fixture now reads Reset composition. The composition unit-test suite and its eight test names also state the behavior under test in plain language.

[Verification and evidence](VERIFICATION.md) · [Anti-convergence review](ANTI_CONVERGENCE.md)


## Production follow-up — 1 October 2026

All twelve current human dispositions remain Approved. [Productionization Pass 006](../productionization-006/VERIFICATION.md) introduces twelve separate reusable Production implementations; this collection retains its original creative studies, proposals, adaptation assets and review notes. Creative acceptance and implementation lifecycle remain separate. Collection 007 is the next creative campaign and was not generated here.
