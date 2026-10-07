import { importProductionEvidence } from "./import-sections";
import { promoteCollectionSection } from "./collection-promotion";
import { getSectionContract } from "../composition/catalog";
import type { DesignComponentDefinition } from "./types";
import type { SectionId } from "../composition/schemas";
const definitions = [
  ["story.manifesto-fold", "Manifesto Fold", "S02", "editorial", "publication"],
  ["story.open-letter", "Open Letter", "S07", "luxury", "salon"],
  ["story.material-relay", "Material Relay", "S08", "fashion", "runway"],
  ["work.open-index", "Open Index", "M01", "neo-grotesk", "precision"],
  [
    "work.project-chapters",
    "Project Chapters",
    "M02",
    "editorial",
    "publication",
  ],
  ["work.contact-room", "Contact Room", "M04", "technical", "precision"],
  ["work.screening-room", "Screening Room", "M05", "luxury", "gallery"],
  [
    "work.photographic-promenade",
    "Photographic Promenade",
    "M06",
    "humanist",
    "runway",
  ],
  ["work.gallery-hanging", "Gallery Hanging", "M07", "fashion", "runway"],
  ["work.campaign-folio", "Campaign Folio", "M08", "fashion", "publication"],
  ["work.look-closer", "Look / Closer", "M09", "neo-grotesk", "precision"],
  ["work.campaign-score", "Campaign Score", "M10", "poster", "billboard"],
  ["work.media-cabinet", "Media Cabinet", "M11", "brutalist", "precision"],
  ["work.light-table", "Light Table", "M12", "playful", "salon"],
  [
    "work.viewport-gallery",
    "Viewport Gallery",
    "M13",
    "neo-grotesk",
    "precision",
  ],
] as const satisfies readonly (readonly [
  SectionId,
  string,
  string,
  string,
  string,
])[];
export const collectionSections = definitions.map(
  ([id, name, sourceConcept, typography, artDirection]) => {
    const composition = getSectionContract(id);
    const entry = promoteCollectionSection({
      id,
      name: `${name} / ${sourceConcept}`,
      sourceConcept,
      category: composition.category,
      description: composition.structuralDNA,
      composition,
      styles: ["neutral", "editorial", "technical"],
      pageTypes: ["home", "about", "portfolio", "landing"],
      supportedMotion: composition.motion,
      complexity: [
        "M04",
        "M05",
        "M06",
        "M08",
        "M09",
        "M11",
        "M12",
        "M13",
      ].includes(sourceConcept)
        ? "high"
        : "medium",
      mobileReady: true,
      accessibilityReady: true,
      responsiveReady: { desktop: true, tablet: true, mobile: true },
      status: "experimental",
      version: "0.5.0",
      defaultCreative: { typography, artDirection, motion: "none" },
      configurations: [
        ...(id === "work.gallery-hanging" ? [...(composition.configuration??[]),{name:"motion",options:composition.motion}] : []),
        {
          name: "adaptation",
          options:
            sourceConcept === "M13"
              ? ["urban", "apparel", "architecture", "hospitality"]
              : ["apparel", "architecture", "hospitality"],
        },
        { name: "contentLength", options: ["standard", "short", "long"] },
      ],
      previewVariants: [
        {
          id: "default",
          label: "Authored structure",
          config: {
            ...(id === "work.gallery-hanging" ? {layout:"hanging",ratio:"landscape",captions:"below",density:"open",motion:"none"} : {}),
            adaptation: sourceConcept === "M13" ? "urban" : "apparel",
            contentLength: "standard",
          },
        },
        {
          id: "alternate",
          label: "Unrelated client / long copy",
          config: { adaptation: "hospitality", contentLength: "long",...(id === "work.gallery-hanging" ? {layout:"paired",ratio:"landscape",captions:"overlay",density:"compact",motion:"stagger"} : {}) },
        },
      ],
    } as const satisfies DesignComponentDefinition);
    return id === "work.gallery-hanging" ? {...entry,version:"1.1.0",productionEvidence:importProductionEvidence} : entry;
  },
);
