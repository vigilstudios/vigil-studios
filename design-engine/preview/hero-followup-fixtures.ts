import chair from "@/docs/design-engine/creative-calibration-002/assets/metal-chair-portrait.jpg";
import performer from "@/docs/design-engine/creative-calibration-002/assets/stage-performer.jpg";
import coast from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture.jpg";
import portrait from "@/docs/design-engine/creative-collection-001/assets/portrait-study.jpg";
import { parseSection, type SectionInstance } from "../composition/schemas";
import type { SectionImage } from "../media/types";

export const heroFollowupIds = [
  "hero.object-study",
  "hero.vertical-record",
] as const;
export type HeroFollowupId = (typeof heroFollowupIds)[number];
const image = (
  asset: typeof chair,
  alt: string,
  focal = { x: 50, y: 50 },
): SectionImage => {
  const dimensions =
    asset === chair
      ? [1120, 1400]
      : asset === portrait
        ? [1200, 1800]
        : [1800, 1013];
  return {
    src: typeof asset === "string" ? asset : asset.src,
    width: typeof asset === "string" ? dimensions[0] : asset.width,
    height: typeof asset === "string" ? dimensions[1] : asset.height,
    alt,
    focal,
    mobileFocal: focal,
  };
};
/** Client examples and licensed/generated study assets stay inside the Lab boundary. */
export function makeHeroFollowupSection<K extends HeroFollowupId>(
  component: K,
  id: string,
  adaptation = "professional",
  length = "standard",
  motion = "none",
  scale = "authored",
): SectionInstance<K> {
  const context =
    adaptation === "platform" || adaptation === "architecture"
      ? 1
      : adaptation === "program" || adaptation === "apparel"
        ? 2
        : 0;
  const objects = [
    {
      category: "Form / Material",
      reference: "Edition / 2026",
      eyebrow: "Collection / No. 001",
      title: "A study in restraint.",
      materialNote: "Brushed metal / Edition 01",
      objectNumber: "01",
      image: image(
        chair,
        "Sculptural brushed metal chair in a quiet stone room. Illustrative study asset.",
        { x: 50, y: 65 },
      ),
    },
    {
      category: "Place / Detail",
      reference: "Field notes / 04",
      eyebrow: "A coastal practice",
      title: "A place to pause.",
      materialNote: "Limestone / Coastal threshold",
      objectNumber: "04",
      image: image(
        coast,
        "Coastal limestone architecture. Illustrative study asset.",
        { x: 44, y: 45 },
      ),
    },
    {
      category: "Portrait / Practice",
      reference: "Learning record / 02",
      eyebrow: "An independent learning program",
      title: "Room to become.",
      materialNote: "Study / An individual perspective",
      objectNumber: "02",
      image: image(
        portrait,
        "Portrait in quiet light. Illustrative study asset.",
        { x: 50, y: 40 },
      ),
    },
  ];
  const archives = [
    {
      category: "Archive / 1946",
      reference: "Performance practice",
      eyebrow: "A continuing record",
      title: "A life in motion.",
      recordLabel: "Acts / Continuity",
      image: image(
        performer,
        "Performer reaching into stage light. Illustrative study asset.",
        { x: 38, y: 50 },
      ),
      records: [
        { id: "first-act", dateLabel: "1946", label: "First act" },
        { id: "new-stage", dateLabel: "1978", label: "New stage" },
        { id: "today", dateLabel: "Today", label: "Still moving" },
      ],
    },
    {
      category: "Practice / Place",
      reference: "Coastal fieldwork",
      eyebrow: "A considered continuation",
      title: "The horizon remains.",
      recordLabel: "Project / Sequence",
      image: image(
        coast,
        "Limestone building beside a coastal horizon. Illustrative study asset.",
        { x: 42, y: 40 },
      ),
      records: [
        { id: "observe", dateLabel: "Spring", label: "Read the landscape" },
        { id: "develop", dateLabel: "Summer", label: "Resolve the threshold" },
        { id: "continue", dateLabel: "Today", label: "Return to the place" },
      ],
    },
    {
      category: "Program / People",
      reference: "Learning archive",
      eyebrow: "An evolving discipline",
      title: "A practice that continues.",
      recordLabel: "Learning / Milestones",
      image: image(
        portrait,
        "Portrait in quiet light. Illustrative study asset.",
        { x: 50, y: 40 },
      ),
      records: [
        { id: "begin", dateLabel: "Foundation", label: "Learn by looking" },
        { id: "practice", dateLabel: "Practice", label: "Test a perspective" },
        { id: "share", dateLabel: "Continuation", label: "Share the work" },
      ],
    },
  ];
  const data =
    component === "hero.object-study" ? objects[context] : archives[context];
  const { image: mediaImage, ...content } = data;
  const action = {
    label: context === 0 ? "Explore the practice" : "Read the approach",
    href: "#approach",
  };
  const expanded =
    length === "long"
      ? {
          ...content,
          title:
            component === "hero.object-study"
              ? "A considered study of the objects and places we choose to keep."
              : "An evolving record of the people, places and practices that keep us moving.",
          description:
            "Each decision builds on careful observation, shared context and the work that came before. This illustrative introduction demonstrates longer client copy while preserving the relationship between the proposition and its image.",
          action,
        }
      : length === "short"
        ? { ...content, title: "A continuing practice." }
        : content;
  const payload = {
    id,
    component,
    structure:
      component === "hero.object-study" ? "object-study" : "vertical-record",
    motion: component === "hero.object-study" ? "none" : motion,
    content: {
      ...expanded,
      ...(component === "hero.vertical-record" ? { action } : {}),
    },
    media: { image: mediaImage },
    treatment: { geometry: "portrait-emphasis", tone: "natural" },
  };
  if (component === "hero.vertical-record" && scale !== "authored") {
    const recordContent = payload.content as unknown as {
      records: (typeof archives)[number]["records"];
    };
    recordContent.records = Array.from(
      { length: scale === "maximum" ? 5 : 2 },
      (_, i) => ({
        id: `record-${i}`,
        dateLabel: `Phase ${i + 1}`,
        label:
          "A considered continuation with explicit context and responsibility",
      }),
    );
  }
  return parseSection(payload) as SectionInstance<K>;
}
