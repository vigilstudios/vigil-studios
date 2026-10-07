import {
  navigationIds,
  architectureFor,
  type ExpansionNavigationId,
} from "../navigation/schemas";
import { parseSection, type SectionInstance } from "../composition/schemas";
import { immersiveFixture } from "./hero-expansion/fixtures";
export const expansionIds = [
  ...navigationIds,
  "hero.full-scene",
  "hero.scene-poster",
] as const;
export type ExpansionId = (typeof expansionIds)[number];
export function makeExpansionSection(
  id: ExpansionId,
  instance = "opening",
): SectionInstance {
  if (id === "hero.full-scene" || id === "hero.scene-poster") {
    const { image, id: unused, ...content } = immersiveFixture(0, instance);
    void unused;
    return parseSection({
      id: instance,
      component: id,
      structure: id === "hero.full-scene" ? "full-scene" : "scene-poster",
      motion: "none",
      voice: id === "hero.scene-poster" ? "loud" : "subtle",
      content: { ...content, action: { ...content.action, href: "#approach" } },
      media: { image },
      treatment: { geometry: "full-bleed", tone: "natural" },
    });
  }
  const a = architectureFor(id as ExpansionNavigationId);
  const labels = [
    "Practice",
    "Places",
    "Journal",
    "Contact",
    "Research",
    "Resources",
    "Support",
    "People",
  ].slice(0, a.destinations[1]);
  return parseSection({
    id: instance,
    component: id,
    structure: a.id,
    motion: "none",
    content: {
      brand: "COMMON / GROUND",
      home: "#opening",
      kind: "Architecture practice",
      edition: "Independent edition / 2026",
      sceneLabel: "A continuing index",
      prompt: "Find your way in.",
      note: "Architecture, landscapes and the life between them.",
      links: labels.map((label, i) => ({
        label,
        href: i === 3 ? "mailto:hello@example.com" : "#approach",
        ...(a.nested
          ? {
              children: [
                { label: `${label} overview`, href: "#approach" },
                { label: `About ${label.toLowerCase()}`, href: "#approach" },
              ],
            }
          : {}),
      })),
      action: { label: "Discuss a place", href: "mailto:hello@example.com" },
      utilities: a.utilities
        .filter((u) => u !== "cta")
        .map((kind) => ({
          kind,
          label:
            kind === "locale"
              ? "EN / locale"
              : kind === "cart"
                ? "Bag"
                : kind === "utility-links"
                  ? "Help"
                  : kind,
          href: "#approach",
        })),
    },
  });
}
