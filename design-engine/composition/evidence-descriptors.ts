import type { TypographyProfileId } from "../foundations/typography/profiles";
import type { ArtDirectionId } from "../foundations/art-direction";
type ProofId = "E01"|"E02"|"E03"|"E04"|"E05"|"E06"|"E07"|"E08"|"E09"|"E10"|"E11"|"E12";
export type EvidenceDescriptor = {
  id: ProofId;
  name: string;
  family: string;
  dna: string;
  content: string;
  scale: string;
  media: string;
  usage: "section-oriented" | "page-capable" | "section-and-page-capable";
  typography: [TypographyProfileId, TypographyProfileId, TypographyProfileId];
  art: [ArtDirectionId, ArtDirectionId, ArtDirectionId];
  mobile: string;
  interaction: string;
  motion: string;
  accessibility: string;
  limitations: string;
  compatibility: string;
  axes: [string, string, string, string, string, string, string, string];
};
export const evidenceDescriptors: EvidenceDescriptor[] = [
  {
    id: "E01",
    name: "A voice, in the margin",
    family: "Direct customer voice",
    dna: "One attributed statement occupies a reading field; a tall portrait and an editorial annotation establish who spoke and why this experience matters.",
    content: "testimony {quote, author, portrait?, provenance} + annotation",
    scale: "Minimal · exactly one voice",
    media:
      "One optional portrait, with consent and honest relationship to the speaker. Demo portrait is illustrative, not the quoted person.",
    usage: "section-oriented",
    typography: ["editorial", "humanist", "fashion"],
    art: ["publication", "salon", "runway"],
    mobile:
      "Portrait becomes a narrow identity column beside attribution; quotation follows at a bounded reading size. Source remains adjacent.",
    interaction: "Native source disclosure; no sequencing or hidden quote.",
    motion:
      "Propose existing MediaReveal on the portrait only; quote remains still. Current motion none.",
    accessibility:
      "blockquote/figcaption attribution, labelled portrait, native details, readable full quotation.",
    limitations:
      "A weak or anonymous quote cannot support the same hierarchy; no rating or aggregate count.",
    compatibility:
      "Quiet proof after Full Scene or a dense Services section; avoid two oversized quotations in a row.",
    axes: [
      "personal authority",
      "single annotated quotation",
      "portrait beside reading field",
      "no numbers",
      "source disclosure",
      "low",
      "one sustained pause",
      "editorial testimony",
    ],

  },
  {
    id: "E02",
    name: "The outcome equation",
    family: "Quantitative result + voice",
    dna: "Baseline and outcome share a typographic equation. A proportional comparison, explicit arithmetic and measurement basis explain the number before a supporting voice signs it.",
    content:
      "result {before, after, unit, direction, basis, provenance} + explanation + voice",
    scale: "Minimal · one measured comparison and one quote",
    media: "None required. Numbers and measurement context are the evidence.",
    usage: "section-oriented",
    typography: ["technical", "poster", "geometric"],
    art: ["precision", "billboard", "gallery"],
    mobile:
      "Before and after stay paired horizontally; the equation wraps its explanatory unit below. Measurement notes occupy full width.",
    interaction:
      "Open measurement source and inspect arithmetic. No animated counter.",
    motion:
      "Propose restrained FadeReveal of the complete equation, never count from zero. Current none.",
    accessibility:
      "Text labels and values accompany bars; before/after meaning does not depend on color, width or arrow.",
    limitations:
      "Comparable units and measurement basis required; before zero yields no relative percentage. Correlation is not causation.",
    compatibility:
      "Balances image-heavy HX02 or Work. Avoid immediately adjoining other oversized number sections.",
    axes: [
      "measured difference",
      "baseline to outcome equation",
      "no imagery",
      "paired proportional values",
      "method disclosure",
      "medium",
      "one large numeric beat",
      "arithmetic then testimony",
    ],

  },
  {
    id: "E03",
    name: "The change dossier",
    family: "Transformation",
    dna: "Three unequal chapters preserve the original condition, the intervention and the observed outcome. Paired media supports a process record; limitations qualify the apparent change.",
    content:
      "subject + baseline {title, body, media?} + intervention {title, body, duration} + outcome {title, body, media?} + result + voice + limitation",
    scale: "One transformation · exactly three stages",
    media:
      "Optional baseline/outcome records. Matching subject and capture conditions are a publication responsibility; diagrams can be more honest than unrelated photographs.",
    usage: "section-and-page-capable",
    typography: ["neo-grotesk", "humanist", "luxury"],
    art: ["publication", "salon", "gallery"],
    mobile:
      "A numbered case spine anchors three different chapter forms: compact baseline, inset intervention, expanded outcome. No image drag interface.",
    interaction:
      "All stages visible; source disclosure supplements the reading sequence.",
    motion:
      "Propose existing MediaReveal per complete chapter. No scroll pinning or Motion Engine extension.",
    accessibility:
      "Ordered stages, h3 labels, textual state descriptions, limitations visible before source details.",
    limitations:
      "Never infer outcome from a generated image; real transformation needs comparable media, dates and measurement conditions.",
    compatibility:
      "Works under H12 when the Hero compares a different subject; otherwise repeated comparison competes. Gives Commerce a customer-outcome bridge.",
    axes: [
      "traceable change",
      "three unequal chronological chapters",
      "paired state records",
      "baseline plus intervention duration",
      "linear reading",
      "high",
      "compressed start expanded outcome",
      "problem intervention observation",
    ],

  },
  {
    id: "E04",
    name: "Case cross-section",
    family: "Case-study evidence",
    dna: "A panoramic project record is cut by an opaque result caption; challenge, intervention and customer voice form a compact evidence footer with a route-neutral case destination.",
    content:
      "case {client, challenge, intervention, result, voice, media?, destination {kind,key,label}}",
    scale: "One condensed case",
    media:
      "One project or documentary image; result text uses an opaque surface independent of image contrast.",
    usage: "section-oriented",
    typography: ["poster", "geometric", "editorial"],
    art: ["billboard", "publication", "runway"],
    mobile:
      "Media becomes a wide contextual strip; result caption leaves the photograph and joins the case facts in normal flow.",
    interaction:
      "Destination button opens a local case synopsis; future host maps semantic destination to a route.",
    motion:
      "Propose MediaReveal on project media; caption stays visible. Current none.",
    accessibility:
      "Case heading, figure caption, semantic result labels, focus return from local synopsis.",
    limitations:
      "Condensed evidence only, no finished case-study page; destination has no generated URL.",
    compatibility:
      "Use after Services or before Work; do not repeat the same project image in both neighbors.",
    axes: [
      "project specificity",
      "panorama and evidence footer",
      "large project slice",
      "result caption",
      "local destination preview",
      "medium",
      "image impact then tight facts",
      "condensed case",
    ],

  },
  {
    id: "E05",
    name: "The credential library",
    family: "Trust / recognition",
    dna: "Recognition is catalogued as inspectable records: issuer, scope, type, year and validity. A selected accession sits beside a typographic index, without invented seals or logos.",
    content:
      "3–12 records {organization, kind, title, scope, year, expires?, provenance}",
    scale: "Moderate / large · 3–12 recognitions",
    media:
      "No logos required; supplied official marks could be reviewed later with permission. Current study uses text records.",
    usage: "section-and-page-capable",
    typography: ["luxury", "technical", "neo-grotesk"],
    art: ["gallery", "precision", "publication"],
    mobile:
      "Index becomes a wrapping set of named record controls; selected accession opens below. All records also available in a native register disclosure.",
    interaction:
      "Pressed record selectors; full register preserves access without advanced interaction.",
    motion:
      "Propose subtle FadeReveal on selected record only; current instant swaps.",
    accessibility:
      "Named buttons, aria-pressed, polite selection announcement, native full-register fallback, explicit validity date.",
    limitations:
      "Certification scope and expiry cannot be generalized; fictional issuers visibly marked as demo.",
    compatibility:
      "Quiet structured proof after loud HX02, Commerce campaign or Media gallery. Avoid adjacent dense directories.",
    axes: [
      "independent recognition",
      "index and accession plate",
      "typographic records",
      "year and expiry",
      "record selection",
      "medium",
      "compact index open record",
      "issuer scope validity",
    ],

  },
  {
    id: "E06",
    name: "People, in their own words",
    family: "Human evidence / chorus",
    dna: "A slow typographic loop presents attributed voices, with a complete unequal reading wall available below or in Still mode. Credibility comes from distinct experiences, not a summed rating.",
    content: "4–9 voices {quote, author, portrait?, provenance}",
    scale: "Moderate · 4–9 distinct voices",
    media:
      "Optional documentary portraits on selected voices; not every quote receives an avatar.",
    usage: "section-and-page-capable",
    typography: ["playful", "brutalist", "humanist"],
    art: ["salon", "billboard", "publication"],
    mobile:
      "The loop clips inside its own viewport without widening the page. Still mode becomes a continuous reading wall; images remain with their attributed voice.",
    interaction:
      "Slow looping attributed voices with Pause/Resume and hover pause; opening the complete reading wall pauses the loop. Still mode exposes every voice and source.",
    motion:
      "Implemented: existing Marquee, slow continuous loop; pauses offscreen, in a hidden tab, on hover, on explicit pause and while reading sources. Reduced motion and Still use the complete static chorus.",
    accessibility:
      "Independent figures and blockquotes; DOM order matches reading order; each source owns its attribution.",
    limitations:
      "Not suitable for long transcripts or thousands of reviews; curator must avoid implying representativeness.",
    compatibility:
      "A human pause after technical service evidence; do not combine directly with another quote-dominant study.",
    axes: [
      "plural human experience",
      "loop and unequal reading wall",
      "occasional human portraits",
      "no aggregate",
      "document reading",
      "medium",
      "short and long alternating voices",
      "independent experiences",
    ],
  },
  {
    id: "E07",
    name: "The review reading room",
    family: "Reviews / distribution",
    dna: "An honest sample distribution introduces a readable review journal. Source filters expose different perspectives; lower ratings remain present and the sample never masquerades as platform-wide sentiment.",
    content:
      "3–30 reviews {rating, quote, author, date, platform, verifiedPurchase, provenance} + selectionPolicy",
    scale: "Moderate / large · 3–30 supplied reviews",
    media: "None. Rating counts derive only from supplied records.",
    usage: "page-capable",
    typography: ["humanist", "playful", "technical"],
    art: ["publication", "salon", "precision"],
    mobile:
      "Compact average and five labelled distribution rows precede a full-width journal. Source controls wrap; review text never truncates.",
    interaction:
      "Source filtering; sample average/distribution stay explicitly whole-sample, visible-review count changes. All reviews button resets.",
    motion:
      "None proposed; stable reading position takes priority over animated ratings.",
    accessibility:
      "Accessible textual rating out of five, dates, labelled bars, polite count, visible non-verified status. No star-only meaning.",
    limitations:
      "No ingestion, platform totals, independent verification or fake verified badges. Sample must be described.",
    compatibility:
      "Works after customer transformation and before product collection; add breathing room after dense Services.",
    axes: [
      "review sample transparency",
      "distribution plus review journal",
      "text only",
      "derived ratings distribution",
      "source filtering",
      "high",
      "summary followed by reading rows",
      "sample scope and dissent",
    ],
  },
  {
    id: "E08",
    name: "In conversation",
    family: "Interview / video testimony",
    dna: "A cinematic still introduces a named speaker, then a question-and-answer transcript exposes specific experience. The transcript is the core evidence, with optional genuine video.",
    content:
      "speaker + provenance + still? + video? + 2–6 question/answer exchanges",
    scale: "Minimal · one interview",
    media:
      "Optional interview still or user-started video using existing caption/transcript schema. Demo has no playable video and labels the still as illustrative.",
    usage: "section-and-page-capable",
    typography: ["fashion", "editorial", "geometric"],
    art: ["runway", "publication", "gallery"],
    mobile:
      "Still becomes a shallow establishing frame; speaker precedes a transcript with questions as margin-free headers.",
    interaction:
      "Native transcript chapter disclosures; first answer open, full transcript also available. Optional native video controls only with a real source.",
    motion:
      "Propose MediaReveal on still; never autoplay. New timed transcript synchronization is deferred.",
    accessibility:
      "Semantic Q&A headings, native summaries, full transcript fallback; speech video requires captions, no false play button.",
    limitations:
      "No video host integration, modal player or timed chapters; still is not proof that an interview occurred.",
    compatibility:
      "Good after dense quantitative evidence; avoid a second cinematic section immediately under a photographic Hero without a text interval.",
    axes: [
      "depth of lived experience",
      "film frame and interview transcript",
      "cinematic documentary still",
      "none",
      "native chapter disclosure",
      "medium",
      "scene then conversational beats",
      "question and answer",
    ],
  },
  {
    id: "E09",
    name: "Relationships, over time",
    family: "Client / partner relationships",
    dna: "Organizations occupy rows of a time register, with labelled tenures and a concrete relationship statement. Trust comes from what was done together, not the familiarity of a logo.",
    content:
      "4–18 relationships {organization, role, since, through, outcome, provenance}",
    scale: "Large · 4–18 client or partner records",
    media:
      "No marks required; text organization names prevent assumed logo permissions.",
    usage: "section-and-page-capable",
    typography: ["geometric", "neo-grotesk", "luxury"],
    art: ["precision", "publication", "gallery"],
    mobile:
      "Each organization becomes a compact relationship entry with date span, role and outcome. Timeline axis is removed but years remain explicit.",
    interaction: "All relationships visible; per-row source disclosure.",
    motion:
      "None now; optional existing FadeReveal per whole row. Do not grow tenure bars as if measured performance.",
    accessibility:
      "Text date ranges duplicate timeline graphics, decorative bars hidden, source tied to each named organization.",
    limitations:
      "Relationship duration does not imply continuous engagement or endorsement; scope states the actual relationship.",
    compatibility:
      "Supports older Contents/Front Page as well as NX12/HX02; avoid repeating a dense services register immediately before it.",
    axes: [
      "continuity of relationships",
      "organization time register",
      "no logo dependency",
      "dated tenure ranges",
      "source inspection",
      "high",
      "repeated horizontal intervals",
      "relationship scope over time",
    ],
  },
  {
    id: "E10",
    name: "Progress, with a paper trail",
    family: "Longitudinal results",
    dna: "Successive dated observations form a rising or falling typographic staircase. Every measurement is paired with the event and method that make change interpretable.",
    content:
      "label + unit + basis + 3–6 points {date,value,event,provenance}, strictly increasing dates",
    scale: "One metric · 3–6 observations",
    media: "None; events and method carry the narrative.",
    usage: "section-oriented",
    typography: ["brutalist", "technical", "poster"],
    art: ["billboard", "precision", "publication"],
    mobile:
      "Horizontal progression becomes a dated vertical ledger; values retain comparable type size. No chart panning.",
    interaction: "All points visible, each source expandable.",
    motion:
      "Propose StaggerReveal of whole observations. No counter tween and no novel motion dependency.",
    accessibility:
      "Ordered dates, explicit units at each observation, source and method text. Position never substitutes for numeric meaning.",
    limitations:
      "Consistent measurement basis required; missing intervals and intervention causality must be disclosed by the host.",
    compatibility:
      "Useful between an open Story and image-led Work; unlike E02 it shows sustained observation rather than one endpoint claim.",
    axes: [
      "sustained measured observation",
      "dated staircase ledger",
      "no imagery",
      "serial values",
      "linear source reading",
      "medium",
      "successive measured beats",
      "longitudinal events",
    ],
  },
  {
    id: "E11",
    name: "Show the working",
    family: "Supporting evidence / artifacts",
    dna: "A claim sits beside numbered exhibits. Each exhibit explains what it establishes, with a document or screenshot when useful; a qualification remains visible above the evidence.",
    content:
      "claim + qualification + 2–5 artifacts {title,finding,media?,provenance}",
    scale: "One claim · 2–5 supporting exhibits",
    media:
      "Optional screenshots, documents or detail images; text findings remain complete when media fails.",
    usage: "section-and-page-capable",
    typography: ["technical", "geometric", "editorial"],
    art: ["precision", "gallery", "publication"],
    mobile:
      "Claim becomes a signed header; complete numbered exhibits follow in a vertical inspection list. No floating annotation hotspots.",
    interaction:
      "Native evidence disclosures; first exhibit open, full findings always visible.",
    motion:
      "Propose MediaReveal within opened exhibits only. Current none; no evidence hidden by motion.",
    accessibility:
      "Numbered exhibit headings, textual findings, meaningful screenshot alt text, native keyboard summaries.",
    limitations:
      "A screenshot is supporting context, not independent verification. Redaction and private information review are host responsibilities.",
    compatibility:
      "Use with restrained Hero or after a service claim; breathing room needed beside dense Capability Desk.",
    axes: [
      "inspectable substantiation",
      "claim and numbered exhibits",
      "source documents or screenshots",
      "claim-specific not required",
      "native exhibit inspection",
      "high",
      "assertion then audit trail",
      "claim qualification evidence",
    ],
  },
  {
    id: "E12",
    name: "The customer story switchboard",
    family: "Customer stories / case collection",
    dna: "A persistent named customer index selects one complete story with challenge, intervention, outcome and voice. Every index row includes its result so inactive stories still communicate core proof.",
    content:
      "2–6 stories {client,challenge,intervention,result,voice,media?,destination}",
    scale: "Moderate · 2–6 customer stories",
    media:
      "Optional context media per story; images change with the complete selected record.",
    usage: "page-capable",
    typography: ["neo-grotesk", "fashion", "playful"],
    art: ["publication", "runway", "salon"],
    mobile:
      "Two-column index becomes a wrapping story selector with visible result labels; selected story follows in a single reading panel. No auto rotation.",
    interaction:
      "Pressed story selectors plus visitor-started 10-second sequence, Play/Pause, hover pause, stop on focus/manual selection; local destination and all-story summaries remain available.",
    motion:
      "Implemented: visitor-started repeating story sequence with existing FadeReveal (zero displacement). No autoplay on load; offscreen/hidden-tab pause, manual reading stops playback, reduced motion uses manual selection.",
    accessibility:
      "Named selectors, aria-pressed, polite selected-customer announcement, focus preserved at selection; full summaries in native disclosure.",
    limitations:
      "Finite authored stories, no search backend or finished customer pages; production must map semantic destinations.",
    compatibility:
      "Useful after Services under any tested navigation; unlike E04 it owns discovery across several cases.",
    axes: [
      "relevant customer precedent",
      "persistent index and selected narrative",
      "contextual customer scene",
      "result in every index entry",
      "story selection",
      "high",
      "compact index expanded story",
      "multi-case discovery",
    ],
  },
];
