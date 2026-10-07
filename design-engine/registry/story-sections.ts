import { promoteCollectionSection } from "./collection-promotion";
import { getSectionContract } from "../composition/catalog";
import type { DesignComponentDefinition } from "./types";
function candidate<K extends "story.object-biography" | "story.working-conversation" | "story.decision-ledger">(id: K, name: string, sourceConcept: string) {
  const composition = getSectionContract(id);
  const configurations = [{ name: "structure", options: composition.variants }, { name: "motion", options: composition.motion }, { name: "adaptation", options: ["workshop", "community", "research"] }, { name: "contentLength", options: ["standard", "short", "long"] }];
  const config: Record<string, string> = { structure: composition.variants[0], motion: "none", adaptation: "workshop", contentLength: "standard" };
  if (composition.media) { configurations.push({ name: "geometry", options: composition.media.geometries }, { name: "tone", options: composition.media.tones }); config.geometry = "contained"; config.tone = "natural"; }
  return promoteCollectionSection({ id, name, sourceConcept, description: `${composition.structuralDNA} Human-approved structure; validated reusable implementation.`, category: composition.category, composition,
    defaultCreative: id === "story.object-biography" ? { typography: "editorial", artDirection: "publication", motion: "none" } : id === "story.working-conversation" ? { typography: "humanist", artDirection: "salon", motion: "none" } : { typography: "technical", artDirection: "precision", motion: "none" },
    styles: ["neutral", "editorial", "technical"], pageTypes: ["home", "about"], supportedMotion: composition.motion, complexity: "medium", mobileReady: true, accessibilityReady: true,
    responsiveReady: { desktop: true, tablet: true, mobile: true }, status: "experimental", version: "0.5.0", configurations,
    previewVariants: [{ id: "default", label: "Source mechanism", config }, { id: "alternate", label: "Alternate structure", config: { ...config, structure: composition.variants[1] } }],
  } as const satisfies DesignComponentDefinition);
}
/** S01/S03/S06 are creatively approved; promoted only after recorded responsive, accessibility, performance and composition QA. */
export const storySections = [
  candidate("story.object-biography", "Object Biography / S01", "S01"),
  candidate("story.working-conversation", "Working Conversation / S03", "S03"),
  candidate("story.decision-ledger", "Decision Ledger / S06", "S06"),
] as const;
