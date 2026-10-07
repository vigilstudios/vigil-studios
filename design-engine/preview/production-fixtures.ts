import {
  parseSection,
  type SectionId,
  type SectionInstance,
} from "../composition/schemas";
import { storyAdaptations } from "./collection-004/fixtures";
import { mediaBriefs, briefForStudy } from "./collection-005/fixtures";
import type { SectionImage } from "../media/types";
export const productionCollectionIds = [
  "story.manifesto-fold",
  "story.open-letter",
  "story.material-relay",
  "work.open-index",
  "work.project-chapters",
  "work.contact-room",
  "work.screening-room",
  "work.photographic-promenade",
  "work.gallery-hanging",
  "work.campaign-folio",
  "work.look-closer",
  "work.campaign-score",
  "work.media-cabinet",
  "work.light-table",
  "work.viewport-gallery",
] as const satisfies readonly SectionId[];
export type ProductionCollectionId = (typeof productionCollectionIds)[number];
/** The only bridge to creative assets. Runtime components never import this module. */
export function makeCollectionSection<K extends ProductionCollectionId>(
  component: K,
  id: string,
  adaptation = component === "work.viewport-gallery" ? "urban" : "architecture",
  length = "standard",
): SectionInstance<K> {
  const index =
    adaptation === "apparel" ? 0 : adaptation === "hospitality" ? 2 : 1;
  const a = storyAdaptations[index];
  const copy = (value: string, max: number) =>
    length === "short"
      ? value.split(".")[0] + "."
      : length === "long"
        ? `${value} ${"A longer record retains the context, responsibilities and observations behind this work. ".repeat(15)}`
            .slice(0, max)
            .trim()
        : value;
  const base = { id, component, structure: "authored", motion: "none" };
  if (component === "story.manifesto-fold")
    return parseSection({
      ...base,
      content: {
        title: "What we believe",
        introduction: copy(a.deck, 590),
        principles: a.fragments.map((statement, i) => ({
          statement,
          explanation: copy(a.records[i].body, 690),
        })),
      },
    }) as SectionInstance<K>;
  if (component === "story.open-letter")
    return parseSection({
      ...base,
      content: {
        salutation: "To the next pair of hands,",
        paragraphs: a.records.map((r) => copy(r.body, 1190)),
        signoff: "With care,",
        signature: a.client,
        postscript: copy(a.continuation, 490),
      },
    }) as SectionInstance<K>;
  if (component === "story.material-relay")
    return parseSection({
      ...base,
      content: {
        title: "Nothing ends at our hands.",
        introduction: copy(a.deck, 590),
        stages: a.records.map((r, i) => ({
          verb: ["Find", "Work", "Pass"][i],
          title: r.title,
          responsibility: copy(r.body, 590),
          image: i === 1 ? a.second : a.object,
        })),
      },
    }) as SectionInstance<K>;
  const brief =
    component === "work.media-cabinet"
      ? briefForStudy("M11", mediaBriefs[index])
      : component === "work.viewport-gallery"
        ? briefForStudy("M13", mediaBriefs[adaptation === "urban" ? 3 : index])
        : mediaBriefs[index];
  const image = (item: (typeof brief.items)[number]): SectionImage => ({
    src: item.src,
    alt: item.alt,
    width: item.width,
    height: item.height,
    focal: { x: item.focal[0], y: item.focal[1] },
    caption: "Illustrative review asset; client supplies licensed media.",
  });
  const records = brief.items
    .filter((item) => item.kind === "image")
    .map((item) => ({
      id: item.id,
      title: item.title,
      note: copy(item.note, 690),
      category: item.group,
      image: image(item),
    }));
  const content = {
    title: copy(brief.title, 178),
    introduction: copy(brief.deck, 590),
    edition: brief.season,
  };
  const payloads: Record<string, unknown> = {
    "work.open-index": { ...content, projects: records },
    "work.project-chapters": {
      ...content,
      chapters: records.map((r, i) => ({
        id: r.id,
        title: r.title,
        narrative: r.note,
        scene: r.image,
        fit: r.image.height > r.image.width ? "contain" : "cover",
        evidence:
          i === records.length - 1
            ? undefined
            : {
                image: records[i + 1].image,
                caption: `Next reading / ${records[i + 1].title}`,
              },
      })),
    },
    "work.contact-room": { ...content, frames: records },
    "work.screening-room": { ...content, frames: records },
    "work.photographic-promenade": { ...content, scenes: records },
    "work.gallery-hanging": { ...content, works: records },
    "work.campaign-folio": {
      ...content,
      spreads: Array.from(
        { length: Math.ceil(records.length / 2) },
        (_, i) => ({
          id: `spread-${i}`,
          title: records[i * 2].title,
          essay: records[i * 2].note,
          principal: records[i * 2],
          facing: records[i * 2 + 1],
        }),
      ),
    },
    "work.look-closer": {
      ...content,
      pairs: Array.from({ length: Math.floor(records.length / 2) }, (_, i) => ({
        id: `pair-${i}`,
        relationship: `${records[i * 2].category} / A companion reading`,
        overview: records[i * 2],
        companion: records[i * 2 + 1],
      })),
    },
    "work.campaign-score": {
      ...content,
      chapters: records.map((r) => ({
        id: r.id,
        phrase: r.title,
        narrative: r.note,
        image: r.image,
        fit: r.image.height > r.image.width ? "contain" : "cover",
      })),
    },
    "work.media-cabinet": {
      ...content,
      records: brief.items.map((item) =>
        item.kind === "image"
          ? {
              id: item.id,
              title: item.title,
              note: copy(item.note, 690),
              category: item.group,
              kind: "image",
              image: image(item),
            }
          : {
              id: item.id,
              title: item.title,
              note: item.note,
              category: item.group,
              kind: "video",
              video: {
                src: item.src,
                width: item.width,
                height: item.height,
                label: item.title,
                poster: image(brief.items[0]),
                transcript: item.transcript,
                hasSpeech: false,
              },
            },
      ),
    },
    "work.light-table": { ...content, images: records },
    "work.viewport-gallery": {
      title: brief.title,
      label: brief.brand,
      pieces: records.map((record) => ({
        id: record.id,
        title: record.title,
        category: record.category,
        detail: record.note,
        image: record.image,
        // These authored studio plates preserve full silhouettes regardless of file ratio.
        fit:
          (adaptation === "urban" && ["u1", "u3"].includes(record.id)) ||
          record.image.height > record.image.width
            ? "contain"
            : "cover",
      })),
    },
  };
  return parseSection({
    ...base,
    content: payloads[component],
  }) as SectionInstance<K>;
}
