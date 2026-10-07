import { navigationArchitectures } from "./architectures";
import type { NavigationArchitecture, NavigationConfig } from "./types";
export const navigationIds = [
  "navigation.datum",
  "navigation.meridian",
  "navigation.dispatch",
  "navigation.pocket-dock",
  "navigation.viewfinder",
  "navigation.switchboard",
  "navigation.atlas-hall",
  "navigation.folio-takeover",
  "navigation.margin-rail",
  "navigation.threshold",
  "navigation.channel-directory",
  "navigation.open-doors",
] as const;
export type ExpansionNavigationId = (typeof navigationIds)[number];
export const navigationOptions = (a: NavigationArchitecture) => ({
  brand: a.supportedAlignments.brand,
  primary: a.supportedAlignments.primary,
  actions: a.supportedAlignments.actions,
  position: a.positions,
  background: a.backgrounds,
  contrast: a.contrasts,
  density: a.densities,
  scroll: a.scroll,
  ...(a.scroll.includes("solidify")
    ? { heroContrast: ["brand", "light-on-dark", "dark-on-light"] as const }
    : {}),
  ...(a.utilities.includes("cta") ? { cta: ["true", "false"] as const } : {}),
  ...(a.utilities.some((u) => u !== "cta")
    ? { utilities: ["true", "false"] as const }
    : {}),
  ...a.floating,
});
export function defaultNavigationConfig(
  a: NavigationArchitecture,
): NavigationConfig {
  return {
    brand: a.supportedAlignments.brand[0],
    primary: a.supportedAlignments.primary[0],
    actions: a.supportedAlignments.actions[0],
    position: a.positions[0],
    background: a.backgrounds[0],
    contrast: a.contrasts[0],
    density: a.densities[0],
    scroll: a.scroll[0],
    heroContrast: "brand",
    cta: true,
    utilities: true,
    dockStyle: "capsule",
    dockAlignment: "center",
    dockWidth: "compact",
    dockOffset: "close",
    priorityLinks: "none",
  };
}
export function architectureFor(id: ExpansionNavigationId) {
  return navigationArchitectures[navigationIds.indexOf(id)];
}

/** Production hierarchy capability extends approved architecture metadata in place. */
export function navigationHierarchyDepth(a: NavigationArchitecture): number | null {
  return ["NX07", "NX11"].includes(a.id) ? null : a.nested ? 2 : 1;
}
