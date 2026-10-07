import type { StaticImageData } from "next/image";
import portrait from "@/docs/design-engine/creative-collection-001/assets/portrait-study.jpg";
import training from "@/docs/design-engine/creative-collection-005/assets/urban-training-look.webp";
import gym from "@/docs/design-engine/creative-collection-005/assets/urban-training-wide.webp";
import room from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture.jpg";
import stone from "@/docs/design-engine/creative-calibration-002/assets/coastal-stone-detail.jpg";
import type { SectionImage } from "../../media/types";
import {
  proofStudySchemas,
  type EvidenceCase,
  type Metric,
  type ProofId,
  type ProofModel,
  type Provenance,
  type Testimony,
} from "./contracts";
export type StressMode = "authored" | "long-copy" | "no-media";
const photo = (asset: StaticImageData, alt: string): SectionImage => ({
  src: typeof asset === "string" ? asset : asset.src,
  width: asset.width || 1200,
  height: asset.height || 900,
  alt: `${alt}. Illustrative generated study image; not the person or project named in this demo.`,
});
const record = (name: string): SectionImage => ({
  src: `/design-engine-study-008/${name}.svg`,
  width: 1200,
  height: 900,
  alt: `${name.replaceAll("-", " ")} synthetic evidence worksheet. Fictional demonstration, not a client record.`,
});
export const proofContexts = [
  {
    id: "security",
    brand: "BOUNDARY / PRACTICE",
    context: "Cybersecurity consultancy",
    palette: ["#e8efed", "#142d2d", "#35645c"],
    person: "Alex Rowan",
    role: "Infrastructure lead",
    client: "Northline Research",
    label: "Median triage time",
    unit: "minutes",
    before: 48,
    after: 18,
    basis:
      "Median of the same 40 synthetic incident scenarios, repeated by the same demo team. Lower is better; this is not a live incident-response claim.",
    period: "12-week illustrative pilot",
    quote:
      "For the first time, we could explain who owned the next decision. The calm mattered as much as the speed.",
    challenge: "Alerts arrived quickly. Ownership did not.",
    intervention:
      "One routing policy, named incident owners and a weekly rehearsal made the handoff explicit.",
    outcome:
      "The team reached a first triage decision sooner in the repeated demo exercise.",
    portrait: photo(
      portrait,
      "Editorial portrait used to explore customer testimony",
    ),
    scene: record("security-after"),
    beforeMedia: record("security-before"),
    afterMedia: record("security-after"),
    detail: record("security-after"),
  },
  {
    id: "strength",
    brand: "EVERYDAY STRONG",
    context: "Strength coaching",
    palette: ["#f7dd9a", "#2c2927", "#84401d"],
    person: "Jamie Ellis",
    role: "Community member",
    client: "Saturday Club",
    label: "Sessions completed",
    unit: "of 24 planned",
    before: 9,
    after: 21,
    basis:
      "Attendance across two consecutive 12-week demo blocks, each with 24 planned sessions. Attendance is not a health, weight-loss or performance claim.",
    period: "Two illustrative 12-week blocks",
    quote:
      "I stopped waiting for a perfect week. We made a plan I could return to, and that changed how I showed up.",
    challenge: "A plan built for an ideal week kept falling apart.",
    intervention:
      "Shorter sessions, two fixed appointments and an adaptable home routine made the plan practical.",
    outcome:
      "More planned sessions were completed during the second demo block.",
    portrait: photo(training, "A model in training apparel"),
    scene: photo(gym, "Illustrative shared training environment"),
    beforeMedia: record("strength-before"),
    afterMedia: record("strength-after"),
    detail: photo(
      training,
      "Illustrative training apparel and movement context",
    ),
  },
  {
    id: "furniture",
    brand: "STILL / FORM",
    context: "Furniture workshop",
    palette: ["#eee5db", "#3b2824", "#865344"],
    person: "Morgan Vale",
    role: "Operations director",
    client: "House of Common",
    label: "Original chairs retained",
    unit: "of 32 chairs",
    before: 8,
    after: 28,
    basis:
      "A synthetic 32-chair project inventory: 8 initially approved for reuse, 28 approved after assessment and repair. No lifecycle or carbon-saving claim is implied.",
    period: "Illustrative 8-week workshop project",
    quote:
      "The room still feels like ours. They helped us keep what had meaning and make it useful again.",
    challenge: "Most of the existing seating had been marked for replacement.",
    intervention:
      "A condition survey separated repairable joints from parts that genuinely needed replacing.",
    outcome:
      "The final illustrative inventory retained more original chairs in use.",
    portrait: undefined,
    scene: photo(room, "Architectural atmosphere used as a project study"),
    beforeMedia: record("furniture-before"),
    afterMedia: record("furniture-after"),
    detail: photo(stone, "Material detail study; not an inspection record"),
  },
] as const;
const titles: Record<ProofId, string[]> = {
  E01: [
    "The calm behind the outcome.",
    "A plan I could come back to.",
    "Keep what makes it yours.",
  ],
  E02: [
    "Less waiting. Clearer decisions.",
    "Showing up is a result.",
    "More of the original remains.",
  ],
  E03: [
    "From noise to named ownership.",
    "From a perfect plan to a possible one.",
    "A second life, with the first intact.",
  ],
  E04: [
    "Inside one meaningful change.",
    "A routine built around real life.",
    "The room we did not replace.",
  ],
  E05: [
    "Trust should be inspectable.",
    "Know who stands behind the work.",
    "Recognition, with a reason.",
  ],
  E06: [
    "Different teams. Shared clarity.",
    "Strong looks different on everyone.",
    "A place in everyday life.",
  ],
  E07: [
    "Read the experience behind the rating.",
    "The good. The useful. The honest.",
    "After the furniture comes home.",
  ],
  E08: [
    "What changed in the room?",
    "What made it possible to return?",
    "What was worth keeping?",
  ],
  E09: [
    "Built with, over time.",
    "A practice shared with a community.",
    "The company we keep.",
  ],
  E10: [
    "Progress has a paper trail.",
    "A habit, observed over time.",
    "The work behind a lasting object.",
  ],
  E11: [
    "Show the working.",
    "More than a success story.",
    "Look closer at the claim.",
  ],
  E12: [
    "Find a story close to yours.",
    "No two starting points are the same.",
    "Different rooms. Considered outcomes.",
  ],
};
export function makeProofModel(
  id: ProofId,
  adaptation = 0,
  stress: StressMode = "authored",
): ProofModel {
  const c = proofContexts[adaptation];
  const provenance = (source = "Authored example record"): Provenance => ({
    status: "demo",
    source,
    timeframe: c.period,
    context:
      "Fictional design study. Values, people and organizations are invented to test presentation; no endorsement or measured outcome is claimed.",
    attribution: `${c.brand} · imagined brief`,
    disclosure: "Demo evidence · not a real customer claim",
  });
  const voice = (i = 0): Testimony => ({
    quote:
      i === 0
        ? c.quote
        : [
            "The explanation was clear enough to share with someone who had not been in the room.",
            "The first version did not fit our week. They listened, adjusted and made the next step manageable.",
            "We knew what had changed, and we also knew what still needed work.",
            "A small detail made the whole experience feel more considered.",
            "I appreciated the honest answer when something was outside the scope.",
            "The handover gave us something we could keep using.",
            "We came back because the experience felt human.",
            "There was room to ask a better question.",
          ][i - 1],
    author: {
      name: i
        ? [
            "Sam Reed",
            "Avery Lane",
            "Casey Park",
            "Taylor Finch",
            "Robin Bell",
            "Drew West",
            "Cameron Lee",
            "Quinn Day",
          ][i - 1]
        : c.person,
      role: c.role,
      organization: i
        ? [
            "Field Notes",
            "Common Room",
            "The Local Circle",
            "Second Chapter",
            "Small Hours",
            "Open House",
            "New Ground",
            "Studio Next",
          ][i - 1]
        : c.client,
    },
    portrait: i === 0 || i === 3 ? c.portrait : undefined,
    provenance: provenance("Illustrative customer quotation"),
  });
  const result = (): Metric => ({
    label: c.label,
    before: c.before,
    after: c.after,
    unit: c.unit,
    basis: c.basis,
    direction: adaptation === 0 ? "lower" : "higher",
    provenance: provenance("Synthetic measurement worksheet"),
  });
  const caseRecord = (i = 0): EvidenceCase => ({
    client: i
      ? ["Field Notes", "Common Room", "Second Chapter"][i - 1]
      : c.client,
    challenge: i
      ? [
          "The first approach solved one part of the problem and left the handoff unclear.",
          "An existing way of working needed care without losing its identity.",
          "A growing team needed a repeatable process.",
        ][i - 1]
      : c.challenge,
    intervention: i
      ? [
          "A smaller scope and an explicit handover made the next step easier to own.",
          "A careful review separated what to retain from what to change.",
          "Named checkpoints made the process easier to repeat.",
        ][i - 1]
      : c.intervention,
    result: {
      ...result(),
      after: c.after + (adaptation === 0 ? i * 2 : -i * 2),
    },
    voice: voice(i),
    media: i === 1 ? c.detail : c.scene,
    destination: {
      kind: i === 1 ? "work" : i === 2 ? "customer-story" : "case-study",
      key: `${c.id}-example-${i + 1}`,
      label: "Explore this story",
    },
  });
  const base = {
    title: titles[id][adaptation],
    introduction: [
      "An illustrative evidence study about clarity, accountability and the work behind a result.",
      "Every starting point has a story. These fictional records explore how to make that story understandable.",
      "Evidence of care belongs beside evidence of change. An imagined brief for a considered workshop.",
    ][adaptation],
  };
  let content: unknown;
  switch (id) {
    case "E01":
      content = {
        ...base,
        testimony: voice(),
        annotation: [
          "A first-person account of the handoff, not a blanket security guarantee.",
          "Consistency, described by the person doing the work.",
          "The value of continuity cannot be reduced to a new-object count.",
        ][adaptation],
      };
      break;
    case "E02":
      content = {
        ...base,
        result: result(),
        explanation: c.outcome,
        voice: voice(),
      };
      break;
    case "E03":
      content = {
        ...base,
        subject: c.client,
        baseline: {
          title: "The starting point",
          body: c.challenge,
          media: c.beforeMedia,
        },
        intervention: {
          title: "What we changed",
          body: c.intervention,
          duration: c.period,
        },
        outcome: {
          title: "What was observed",
          body: c.outcome,
          media: c.afterMedia,
        },
        result: result(),
        voice: voice(),
        limitation: [
          "The same demo scenarios were repeated; this does not establish performance during real incidents.",
          "A single illustrative attendance record cannot predict another person’s experience. No body transformation is asserted.",
          "The images are study illustrations, not a registered before/after record. No environmental savings are calculated.",
        ][adaptation],
      };
      break;
    case "E04":
      content = { ...base, case: caseRecord() };
      break;
    case "E05":
      content = {
        ...base,
        records: Array.from({ length: [5, 3, 7][adaptation] }, (_, i) => ({
          organization: [
            "Practice Review",
            "The Open Standard",
            "Common Journal",
            "Fieldwork Circle",
            "Design Register",
            "Material Notes",
            "Public Practice",
          ][i],
          kind: (["press", "certification", "award", "partner"] as const)[
            i % 4
          ],
          title: [
            "A closer look at the practice",
            "Reviewed working process",
            "Considered Practice citation",
            "Learning partnership",
            "Selected work annual",
            "Materials in use",
            "Practice conversation",
          ][i],
          scope: [
            "Editorial discussion of one project; no performance endorsement.",
            "Illustrative process scope only; this is not a real certification.",
            "Fictional recognition for the study brief; no real award claimed.",
            "A bounded educational collaboration; not an accreditation.",
          ][i % 4],
          year: 2024 + (i % 3),
          ...(i === 1 ? { expires: "2027-06-30" } : {}),
          provenance: provenance("Fictional recognition record"),
        })),
      };
      break;
    case "E06":
      content = {
        ...base,
        voices: Array.from({ length: [6, 8, 4][adaptation] }, (_, i) =>
          voice(i),
        ),
      };
      break;
    case "E07":
      content = {
        ...base,
        selectionPolicy:
          "All supplied fictional records are shown by default, including critical feedback. Summary covers only this sample, not a platform total.",
        reviews: Array.from({ length: [6, 9, 4][adaptation] }, (_, i) => ({
          ...voice(i % 8),
          portrait: undefined,
          rating: [5, 4, 3, 5, 2, 4, 5, 3, 4][i],
          date: `2026-09-${String(10 + i).padStart(2, "0")}`,
          platform: i % 2 ? "Follow-up survey" : "Direct feedback",
          verifiedPurchase: false,
        })).map(({ portrait: removedPortrait, ...review }) => {
          void removedPortrait;
          return review;
        }),
      };
      break;
    case "E08":
      content = {
        ...base,
        speaker: voice().author,
        provenance: provenance("Fictional interview transcript"),
        still: adaptation === 0 ? c.portrait : c.scene,
        exchanges: [
          {
            question: "Where did you start?",
            answer: c.challenge + " " + c.quote,
          },
          { question: "What made the difference?", answer: c.intervention },
          {
            question: "What would you tell someone else?",
            answer:
              "Ask what the evidence actually covers. This is one bounded experience, with conditions that matter.",
          },
        ],
      };
      break;
    case "E09":
      content = {
        ...base,
        relationships: Array.from(
          { length: [8, 5, 6][adaptation] },
          (_, i) => ({
            organization: [
              c.client,
              "Field Notes",
              "Common Room",
              "Second Chapter",
              "Open House",
              "New Ground",
              "Studio Next",
              "Local Assembly",
            ][i],
            role: [
              "Project collaboration",
              "Learning partnership",
              "Repeat commission",
              "Research exchange",
            ][i % 4],
            since: 2019 + (i % 5),
            through: 2024 + (i % 3),
            outcome: [
              c.intervention,
              "A focused workshop and a documented handover.",
              "A second commission with a clearly defined scope.",
              "A shared research note, not a customer endorsement.",
            ][i % 4],
            provenance: provenance("Fictional relationship record"),
          }),
        ),
      };
      break;
    case "E10":
      content = {
        ...base,
        label: c.label,
        unit: c.unit,
        basis: c.basis,
        points: [0, 1, 2, 3].map((i) => ({
          date: `2026-0${5 + i}-01`,
          value: Math.round(c.before + ((c.after - c.before) * i) / 3),
          event: [
            "Baseline recorded",
            "First intervention reviewed",
            "Process adjusted",
            "Final observation recorded",
          ][i],
          provenance: provenance("Synthetic dated observation"),
        })),
      };
      break;
    case "E11":
      content = {
        ...base,
        claim: c.outcome,
        qualification: c.basis,
        artifacts: [
          {
            title: "The original record",
            finding: c.challenge,
            media: c.beforeMedia,
          },
          {
            title: "The decision record",
            finding: c.intervention,
            media: c.detail,
          },
          {
            title: "The outcome worksheet",
            finding: c.outcome,
            media: c.afterMedia,
          },
        ]
          .slice(0, adaptation === 1 ? 2 : 3)
          .map((a) => ({
            ...a,
            provenance: provenance("Illustrative supporting exhibit"),
          })),
      };
      break;
    case "E12":
      content = {
        ...base,
        stories: Array.from({ length: [3, 4, 2][adaptation] }, (_, i) =>
          caseRecord(i),
        ),
      };
      break;
  }
  // Stress changes preserve the evidence model and remain within schema bounds.
  const stressWalk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stressWalk);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([k]) =>
            stress !== "no-media" ||
            !["portrait", "media", "still", "video"].includes(k),
        )
        .map(([k, v]) => [
          k,
          stress === "long-copy" &&
          typeof v === "string" &&
          ["quote", "answer", "body", "finding"].includes(k)
            ? `${v} The details of this experience matter: the scope was limited, the conditions were documented, and the next step was discussed before a conclusion was drawn.`
            : stressWalk(v),
        ]),
    );
  };
  return {
    id,
    content: proofStudySchemas[id].parse(stressWalk(content)),
  } as ProofModel;
}
