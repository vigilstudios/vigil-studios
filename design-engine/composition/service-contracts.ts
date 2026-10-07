import { getActionCapabilities } from "../actions/capabilities";
import type { TypographyProfileId } from "../foundations/typography/profiles";
import type { ArtDirectionId } from "../foundations/art-direction";
import type { SectionContract } from "./contracts";
import type { ServiceSectionId } from "./service-schemas";
/** Runtime metadata; the original creative proposals remain in Design Lab. */
export type ServiceDescriptor = {
  id: string;
  name: string;
  scale: string;
  usage: NonNullable<SectionContract["usage"]>;
  typography: readonly [
    TypographyProfileId,
    TypographyProfileId,
    TypographyProfileId,
  ];
  dna: string;
  content: string;
  media: string;
  mobile: string;
  interaction: string;
  limitations: string;
};
export const serviceDescriptors: readonly ServiceDescriptor[] = [
  {
    id: "C01",
    name: "The service index",
    scale: "3–7 offerings; 2–4 deliverables each",
    usage: "section-and-page-capable",
    typography: ["editorial", "technical", "humanist"],
    dna: "A numbered directory places service titles on a broad left spine and concrete deliverables in a narrow right margin. Readers scan names before committing to detail.",
    content:
      "entries: id, title ≤100, summary ≤220, 2–4 deliverables ≤60, optional detail link. Section title ≤180; introduction ≤600.",
    media: "None. No icon system needed.",
    mobile:
      "Number becomes an inline prefix; deliverables become a compact line below the summary, preserving the index rather than cards.",
    interaction:
      "Native optional destinations navigate normally to client-owned routes or anchors. No synthetic summary interception.",
    limitations:
      "Names should fit two lines. Seven entries maximum; no nested taxonomy.",
  },
  {
    id: "C02",
    name: "What we make possible",
    scale: "3–5 commitments",
    usage: "section-oriented",
    typography: ["poster", "brutalist", "playful"],
    dna: "A service manifesto turns short verbs into a typographic wall, each followed by the promise and the explicit limit of that commitment.",
    content:
      "promise ≤120; principles: verb ≤28, pledge ≤160, boundary ≤120. Not a service list.",
    media: "None. Type is the primary visual material.",
    mobile:
      "Oversize verbs become separate full-width bands; the promise and boundary remain visibly paired, with no clipped display type.",
    interaction: "Static reading; no false button treatments.",
    limitations:
      "Not for technical inventories or exhaustive descriptions. Editorial verbs must be concrete.",
  },
  {
    id: "C03",
    name: "Capability desk",
    scale: "4–8 capabilities",
    usage: "section-and-page-capable",
    typography: ["neo-grotesk", "technical", "geometric"],
    dna: "A persistent capability directory controls a single evidence desk: selected description, outcome and one image or technical diagram. The visitor chooses the reading order.",
    content:
      "capabilities: id, title, category ≤32, description ≤220, outcome ≤120, image and optional detail link.",
    media:
      "One image or diagram per capability; intrinsic size and alt required. All source ratios contained.",
    mobile:
      "Directory becomes a wrapping two-column button list before the selected evidence; selected title repeats above the evidence.",
    interaction:
      "Click, keyboard activation or touch selects; pressed state and live title. No hover-only content.",
    limitations:
      "Eight choices maximum. Only selected media mounted; authored explanations must stand without the image.",
  },
  {
    id: "C04",
    name: "Inside the offering",
    scale: "5–10 services",
    usage: "section-and-page-capable",
    typography: ["humanist", "neo-grotesk", "luxury"],
    dna: "A calm directory exposes a short summary at rest; each independently expandable row explains what is included and what is outside the engagement.",
    content:
      "services: id, title, summary ≤120, 2–5 included items ≤80, boundary ≤140, optional detail link.",
    media:
      "None. Functional chevrons use VigilIcon; no decorative service icons.",
    mobile:
      "Native disclosures retain source order; open content stays attached to its trigger. Several services may remain open for comparison.",
    interaction:
      "Native details/summary with Enter and Space. No custom accordion focus trap.",
    limitations: "No nested accordions. Ten top-level offerings maximum.",
  },
  {
    id: "C05",
    name: "From friction to possibility",
    scale: "3–5 customer situations",
    usage: "section-and-page-capable",
    typography: ["luxury", "humanist", "editorial"],
    dna: "A large visitor problem is answered by a narrower capability bridge and a concrete outcome. Repeated horizontal triptychs make the causal story readable at a glance.",
    content:
      "situations: need ≤120, response ≤140, outcome ≤120, evidence ≤160. Evidence is authored and must not imply verified results.",
    media: "None. Written evidence is mandatory.",
    mobile:
      "Problem and outcome sit on opposite sides of a vertical spine, with the capability between them. Labels preserve causal order.",
    interaction: "Static ordered narratives.",
    limitations:
      "Outcomes must be framed as intended outcomes unless substantiated. Not a substitute for a case-study evidence contract.",
  },
  {
    id: "C06",
    name: "The capability journey",
    scale: "3–6 ordered stages",
    usage: "page-capable",
    typography: ["geometric", "editorial", "technical"],
    dna: "An ascending sequence of numbered stations follows a visitor through inputs, work and handoff. Responsibilities make the progression actionable rather than decorative.",
    content:
      "stages: id, title ≤100, input ≤100, work ≤140, output ≤100, owner ≤60. Ordered data is the journey.",
    media: "None. Rules connect actual adjacent handoffs only.",
    mobile:
      "An alternating vertical timeline keeps station numbers in a left rail. No sticky panels or horizontal scrolling.",
    interaction: "Continuous document reading with all stages exposed.",
    limitations:
      "Only valid for genuinely sequential work; independent services should use C01 or C03.",
  },
  {
    id: "C07",
    name: "Discipline matrix",
    scale: "6–20 capabilities in 3–4 groups; 3–4 phases",
    usage: "page-capable",
    typography: ["technical", "geometric", "neo-grotesk"],
    dna: "A grouped responsibility matrix maps capabilities to delivery phases. Lead, Support and not-in-scope cells communicate coverage rather than a list of marketing claims.",
    content:
      "phases: 3–4 labels; groups: 3–4 names with 2–5 capabilities, id, title and exactly one coverage value per phase.",
    media: "None. Text cells convey meaning without color or icons.",
    mobile:
      "A phase selector shows one readable column at a time, retaining every group and capability. Desktop exposes the full table.",
    interaction:
      "Mobile select changes the inspected phase. Table row/column headers preserve relationships.",
    limitations:
      "Not a pricing table; no numerical proficiency scores. Twenty capabilities maximum; no virtualized archive.",
  },
  {
    id: "C08",
    name: "Connected capabilities",
    scale: "3–5 dependent layers; 2–4 components each",
    usage: "section-and-page-capable",
    typography: ["brutalist", "technical", "geometric"],
    dna: "A system cutaway traces an input through named responsibility layers to an output. Each connector labels the actual handoff between layers.",
    content:
      "input and output ≤80; layers: id, title, responsibility ≤100, 2–4 component names ≤50 and handoff ≤80.",
    media:
      "Semantic HTML diagram generated from the layered contract. No image dependency.",
    mobile:
      "The cutaway becomes a vertical stack with handoff labels between layers; full explanations remain in document order.",
    interaction:
      "Static inspectable diagram; no meaningless animated connectors.",
    limitations:
      "A linear dependency chain only; branching graphs require a future contract. Do not infer causal relationships from spatial proximity.",
  },
  {
    id: "C09",
    name: "Service field atlas",
    scale: "3–5 offerings with visual evidence",
    usage: "page-capable",
    typography: ["fashion", "neo-grotesk", "luxury"],
    dna: "Unequal photographic plates place a service name alongside a concrete application. Large and small evidence plates alternate; imagery carries the first reading.",
    content:
      "plates: id, title, image, caption ≤160, application ≤140, optional detail link. Caption explains the service-to-image relationship.",
    media:
      "One authored image or diagram per offering, all contained. Portrait and landscape remain different sizes without subject cropping.",
    mobile:
      "Two tracks retain unequal image scale; every second plate spans the width. Labels follow the corresponding image in source order.",
    interaction:
      "Native optional destinations navigate normally to client-owned routes or anchors. No synthetic summary interception.",
    limitations:
      "Needs useful evidence imagery, not unrelated stock decoration. Long prose belongs elsewhere.",
  },
  {
    id: "C10",
    name: "Evidence in practice",
    scale: "2–4 capability cases",
    usage: "section-oriented",
    typography: ["editorial", "humanist", "poster"],
    dna: "Two explicitly labelled evidence plates sit across a capability explanation. A case selector switches the complete problem/intervention/result relationship.",
    content:
      "cases: id, title, before/after image+label+note, capability ≤80, evidence ≤180. Labels may describe two illustrative states rather than measured before/after.",
    media:
      "Two authored images/diagrams per case; matching camera geometry is not required. Captions state the relationship honestly.",
    mobile:
      "Both evidence plates remain adjacent above the full explanation; no comparison wipe, dragging or tiny text overlay.",
    interaction:
      "Named case buttons switch both plates, the capability and evidence together. Live case title; no automatic progression.",
    limitations:
      "Demonstration assets are illustrative, never proof of client outcomes. Needs editorial evidence review before client publication.",
  },
  {
    id: "C11",
    name: "Find your starting point",
    scale: "3–5 visitor needs",
    usage: "section-oriented",
    typography: ["playful", "luxury", "humanist"],
    dna: "A visitor starts with a need, not a service name. Selecting that need reveals one explained starting point and an explicit alternative when it is a poor fit.",
    content:
      "question ≤100; paths: id, title, need ≤90, recommendation ≤100, reason ≤160, alternative ≤120, optional detail link.",
    media: "None. Text-only choices with no category icon decoration.",
    mobile:
      "Needs remain large wrapping choices; the recommendation follows directly, with clear selected state and no route change.",
    interaction:
      "Named buttons with pressed state update a polite result region. No lead capture, automated diagnosis or score.",
    limitations:
      "One authored decision level, not a rules engine. No inferred personalized advice.",
  },
  {
    id: "C12",
    name: "Scope companions",
    scale: "2–3 offerings; 5–10 shared criteria",
    usage: "section-and-page-capable",
    typography: ["neo-grotesk", "brutalist", "technical"],
    dna: "A scope comparison exposes how engagements differ without price or ranking. Visitors pin a baseline and a candidate while shared criteria stay aligned.",
    content:
      "criteria: 5–10 labels; offerings: id, title, bestFor ≤140, exactly one value per criterion, boundary ≤120, optional detail link.",
    media: "None. Every cell uses explicit wording, not ambiguous ticks.",
    mobile:
      "Two labelled selectors retain a side-by-side comparison; criteria occupy their own full-width line above each value pair.",
    interaction:
      "Independent baseline/candidate selectors; desktop shows all scopes. Identical selection is permitted and labelled as such.",
    limitations:
      "No price, billing period, checkout or automatic best choice. Requires truly shared comparison criteria.",
  },
];

export const serviceSectionIds = [
  "services.offering-index",
  "services.capability-manifesto",
  "services.capability-desk",
  "services.expandable-offerings",
  "services.situation-responses",
  "services.delivery-journey",
  "services.capability-coverage",
  "services.connected-capabilities",
  "services.service-field-atlas",
  "services.evidence-in-practice",
  "services.starting-point",
  "services.scope-companions",
] as const satisfies readonly ServiceSectionId[];
const arts: readonly (readonly ArtDirectionId[])[] = [
  ["publication", "precision", "gallery"],
  ["billboard", "publication", "runway"],
  ["precision", "publication", "gallery"],
  ["salon", "precision", "publication"],
  ["publication", "precision", "salon"],
  ["publication", "precision", "gallery"],
  ["precision", "publication"],
  ["precision", "publication", "billboard"],
  ["runway", "gallery", "publication"],
  ["publication", "gallery", "precision"],
  ["salon", "publication", "gallery"],
  ["precision", "publication"],
];
const contentTypes = [
  "service",
  "offering",
  "feature",
  "capability",
  "competency",
  "benefit",
  "discipline",
] as const;
const counts = [
  [3, 7],
  [3, 5],
  [4, 8],
  [5, 10],
  [3, 5],
  [3, 6],
  [6, 20],
  [3, 5],
  [3, 5],
  [2, 4],
  [3, 5],
  [2, 3],
];
export const serviceContracts = Object.fromEntries(
  serviceSectionIds.map((id, index) => {
    const d = serviceDescriptors[index],
      images = [2, 8, 9].includes(index);
    const types =
      index === 5
        ? (["service", "offering", "capability"] as const)
        : index === 7
          ? (["capability", "feature", "competency"] as const)
          : contentTypes;
    return [
      id,
      {
        category: "services",
        usage: d.usage,
        structuralDNA: `${d.id}: ${d.dna}`,
        contentSchema: id,
        mediaSchema: images ? `${id}.authored-images` : null,
        contentConstraints: `${d.scale}. ${d.content} ${d.limitations} IDs unique; slugs and safe client-owned detail links optional. No commerce fields.`,
        supportedContentTypes: types,
        itemRange: {
          min: counts[index][0],
          max: counts[index][1],
          unit:
            index === 6
              ? "capabilities in 3–4 groups / 3–4 phases"
              : index === 11
                ? "offerings sharing 5–10 unique criteria"
                : "authored records",
        },
        mediaRequirements: images
          ? `${d.media} Required dimensions and alt; responsive sources accepted. Contained geometry only; selectable tone.`
          : "No media required or consumed.",
        variants: ["authored"],
        typography: {
          profiles: [
            "editorial",
            "luxury",
            "neo-grotesk",
            "geometric",
            "poster",
            "humanist",
            "technical",
            "brutalist",
            "playful",
            "fashion",
          ],
          roles: ["display", "heading", "body", "accent", "mono"],
          behavior:
            "Semantic roles inherit; bounded title scale and record measures preserve the reviewed hierarchy.",
        },
        artDirections: arts[index],
        artBehavior:
          "Art changes section rhythm, gutters, evidence gaps and token rule weight; unequal scales, comparison axes and reading order remain structural.",
        motion: images ? ["none", "media-reveal"] : ["none"],
        motionIntensities: images
          ? ["none", "restrained", "expressive"]
          : ["none"],
        overrides: images
          ? ["typography", "artDirection", "motion"]
          : ["typography", "artDirection"],
        media: images
          ? {
              geometries: ["contained"],
              tones: ["natural", "monochrome", "high-contrast"],
            }
          : null,
        icons:
          index === 3
            ? ["chevron-down", "arrow-up-right"]
            : index === 2
              ? ["arrow-right", "arrow-up-right"]
              : index === 7
                ? ["arrow-right"]
                : [0, 8, 10, 11].includes(index)
                  ? ["arrow-up-right"]
                  : [],
        interactionCapabilities:
          index === 2 || index === 9 || index === 10
            ? [
                "button-selection",
                "polite-announcement",
                "optional-initial-selection",
              ]
            : index === 3
              ? ["native-disclosure"]
              : index === 6
                ? ["mobile-phase-selection", "semantic-table"]
                : index === 11
                  ? ["mobile-independent-comparison", "semantic-table"]
                  : ["semantic-reading", "optional-native-destinations"],
        compatibility: {
          flow: {
            surface: "inherited",
            bleed: [1, 8].includes(index) ? "full" : "inset",
            scrolling: "document",
            sticky: false,
            density: [6, 11].includes(index) ? "dense" : "open",
          },
        },
        responsive: {
          desktop: d.dna,
          tablet:
            "Bounded gutters and record measures retain original relationships.",
          mobile: d.mobile,
          readingOrder: [
            "section heading",
            "authored records and relationships",
            "evidence or recommendation",
            "optional detail destination",
          ],
        },
        accessibility: {
          landmark: "section",
          heading: "h2",
          keyboard: `${d.interaction} Focus stays on the selected native control; targets remain at least 44px; detail links navigate normally.`,
          reducedMotion:
            "All content is readable with motion none. Existing MediaReveal respects OS and site policy; selection never auto-advances.",
          contrast:
            "Opaque inherited foreground/background surfaces; captions outside media. Focus uses foreground rather than an unverified accent.",
        },
        actions: getActionCapabilities(id),
      } satisfies SectionContract,
    ];
  }),
) as unknown as Record<ServiceSectionId, SectionContract>;
