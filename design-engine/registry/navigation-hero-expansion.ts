import { getSectionContract } from "../composition/catalog";
import {
  navigationIds,
  defaultNavigationConfig,
  architectureFor,
} from "../navigation/schemas";
import type { DesignComponentDefinition, ProductionEvidence } from "./types";
export const navigationHeroEvidence: ProductionEvidence = {
  responsive: { desktop: true, tablet: true, mobile: true },
  accessibility: {
    semantics: true,
    keyboard: true,
    focus: true,
    reducedMotion: true,
  },
  performanceReviewed: true,
  brandNeutralReviewed: true,
  visualDiversityReviewed: true,
  approvedBy:
    "User productionization brief (creative approval); Codex current-pass implementation QA",
  approvedAt: "2026-10-02T09:59:00-04:00",
};
const ids = [...navigationIds, "hero.full-scene", "hero.scene-poster"] as const;
export const navigationHeroSections = ids.map((id) => {
  const contract = getSectionContract(id),
    isNav = id.startsWith("navigation."),
    a = isNav
      ? architectureFor(id as (typeof navigationIds)[number])
      : undefined;
  const config: Record<string, string> = {
    structure: contract.variants[0],
    motion: "none",
  };
  if (a) {
    const defaults = defaultNavigationConfig(a);
    for (const field of contract.configuration ?? [])
      config[field.name] = String(
        defaults[field.name.replace("settings.", "") as keyof typeof defaults],
      );
  } else
    Object.assign(config, {
      alignment: "left",
      position: "middle",
      voice: id === "hero.scene-poster" ? "loud" : "subtle",
      ink: "light",
      geometry: "full-bleed",
      tone: "natural",
    });
  const configurations = [
    { name: "structure", options: contract.variants },
    { name: "motion", options: contract.motion },
    ...(contract.configuration ?? []),
    ...(contract.media
      ? [
          { name: "geometry", options: contract.media.geometries },
          { name: "tone", options: contract.media.tones },
        ]
      : []),
  ];
  return {
    id,
    name: a
      ? `${a.name} / ${a.id}`
      : id === "hero.full-scene"
        ? "Full Scene / HX01"
        : "Scene Poster / HX02",
    category: contract.category,
    description: contract.structuralDNA,
    styles: ["neutral", "editorial", "technical"],
    pageTypes: ["home", "landing", "about", "services", "shop", "collection"],
    supportedMotion: contract.motion,
    complexity: a?.nested ? "high" : "medium",
    mobileReady: true,
    accessibilityReady: true,
    responsiveReady: { desktop: true, tablet: true, mobile: true },
    status: "production",
    version: "1.0.0",
    productionEvidence: navigationHeroEvidence,
    sourceConcept: a?.id ?? (id === "hero.full-scene" ? "HX01" : "HX02"),
    composition: contract,
    configurations,
    responsiveInvariants: a?.floating
      ? [
          {
            field: "settings.priorityLinks",
            maxWidth: 760,
            reason: "Priority routes move into the attached mobile menu.",
          },
          {
            field: "settings.dockWidth",
            maxWidth: 760,
            reason: "Both dock widths fill the available narrow safe field.",
          },
        ]
      : a && a.supportedAlignments.primary.length > 1
        ? [
            {
              field: "settings.primary",
              maxWidth: 760,
              reason:
                "Desktop destination alignment is replaced by the concept's mobile index.",
            },
          ]
        : [],
    previewVariants: [
      {
        id: "default",
        label: "Production System · approved structure",
        config,
      },
    ],
    defaultCreative: {
      typography: "editorial",
      artDirection: "publication",
      motion: "none",
    },
  } as const satisfies DesignComponentDefinition;
});
