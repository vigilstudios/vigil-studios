import type { SectionContract } from "./contracts";
import { navigationHierarchyDepth } from "../navigation/capabilities";
import { navigationArchitectures } from "../navigation/architectures";
import { navigationIds, navigationOptions } from "../navigation/schemas";
import { artIds, typographyIds } from "./schemas";
const base = {
  typography: {
    profiles: typographyIds,
    roles: ["display", "heading", "body", "accent", "mono"],
    behavior:
      "Inherit client semantic fonts; bounded measures preserve structure under all profiles.",
  },
  artDirections: artIds,
  artBehavior:
    "Semantic gutters, copy rhythm, rules and action shapes respond to art direction; authored spatial relationships stay invariant.",
  motionIntensities: ["none"],
  motion: ["none"],
  overrides: ["typography", "artDirection"],
  icons: [
    "menu",
    "close",
    "chevron-down",
    "arrow-right",
    "arrow-left",
    "search",
    "user",
    "plus",
  ],
  responsive: {
    desktop: "Preserve authored architecture.",
    tablet: "Reduce gaps, wrap long labels.",
    mobile: "Preserve concept-specific reading order and menu traversal.",
    readingOrder: ["brand", "destinations", "utilities"],
  },
  accessibility: {
    landmark: "navigation",
    heading: null,
    keyboard:
      "Native disclosures and links; modal focus containment/Escape/restoration; nonmodal outside/Escape; staged child heading/Back focus.",
    reducedMotion:
      "Immediate complete states; reveal remains visible and compaction does not animate.",
    contrast:
      "Opaque menus; transparent chrome uses author-selected light/dark ink with visible compatibility diagnostics.",
  },
} as const;
export const navigationContracts = Object.fromEntries(
  navigationIds.map((id, i) => {
    const a = navigationArchitectures[i];
    const {
      scale,
      nested,
      supportedAlignments,
      positions,
      backgrounds,
      contrasts,
      densities,
      utilities,
      scroll,
      floating,
    } = a;
    return [
      id,
      {
        ...base,
        category: "navigation",
        contentSchema: "semantic-destinations-and-logo",
        mediaSchema: null,
        media: null,
        structuralDNA: a.dna,
        variants: [a.id],
        navigation: {
          scale,
          nested,
          maxDepth: navigationHierarchyDepth(a),
          supportedAlignments,
          positions,
          backgrounds,
          contrasts,
          densities,
          utilities,
          scroll,
          ...(floating ? { floating } : {}),
        },
        configuration: Object.entries(navigationOptions(a)).map(
          ([name, options]) => ({
            name: `settings.${name}`,
            options: options.map(String),
          }),
        ),
        itemRange: {
          min: a.destinations[0],
          max: a.destinations[1],
          unit: nested ? "destination groups" : "destinations",
        },
        contentConstraints: a.constraints,
        interactionCapabilities: [a.expansion, ...a.scroll],
        compatibility: {
          navigation: {
            placements: ["in-flow", "overlay"],
            covers: ["surface", "light-media", "dark-media"],
          },
        },
        responsive: {
          ...base.responsive,
          desktop: a.desktop,
          mobile: a.mobile,
        },
        artBehavior:
          "Art-direction inset and menu spacing adapt; dock silhouette and structural alignment stay protected.",
      } satisfies SectionContract,
    ];
  }),
) as unknown as Record<(typeof navigationIds)[number], SectionContract>;
const scene = {
  ...base,
  category: "hero",
  contentSchema: "scene-introduction",
  mediaSchema: "single-image",
  media: {
    geometries: ["full-bleed"],
    tones: ["natural", "monochrome", "high-contrast"],
  },
  icons: [],
  configuration: [
    { name: "alignment", options: ["left", "center", "right"] },
    { name: "position", options: ["top", "middle", "bottom"] },
    { name: "voice", options: ["subtle", "loud"] },
    { name: "ink", options: ["light", "dark"] },
  ],
  contentConstraints:
    "Title <=180, optional description <=600, optional provenance/caption, zero/one/two semantic actions. Full scene grows for long content.",
  mediaRequirements:
    "One crop-ready cover image with dimensions, nonempty alt, desktop/mobile focal data. No autoplay/video capability was demonstrated in the approved study.",
  compatibility: { hero: { surface: "dark-media", overlaySafeZone: true } },
  responsive: {
    desktop: "Viewport-filling photograph with layered readable copy.",
    tablet: "Reduce scale, preserve spatial separation.",
    mobile:
      "Authored focal crop; grow rather than clip; poster context becomes a stacked register.",
    readingOrder: [
      "reference",
      "eyebrow",
      "title",
      "description",
      "actions",
      "caption",
    ],
  },
  accessibility: {
    ...base.accessibility,
    landmark: "section",
    heading: "h1",
    keyboard: "Native semantic client links; no scroll interception.",
    contrast:
      "Light ink over directional dark shade; dark ink over softened light scene. Review client image subject/contrast.",
  },
} as const;
export const immersiveHeroContracts = {
  "hero.full-scene": {
    ...scene,
    structuralDNA:
      "HX01: grouped title/context/actions float over a continuous scene; provenance stays at the scene edges.",
    variants: ["full-scene"],
  },
  "hero.scene-poster": {
    ...scene,
    structuralDNA:
      "HX02: independent headline field and bottom context register separated by exposed continuous imagery.",
    variants: ["scene-poster"],
  },
} as const satisfies Record<string, SectionContract>;
