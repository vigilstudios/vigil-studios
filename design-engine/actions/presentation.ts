import type { ActionPresentation } from "./schema";
import { sectionCTAAnimation, type ResolvedPresentation } from "../presentation/schema";

/** Section Motion controls animation; individual styles override inherited defaults. */
export function resolveActionPresentation(defaults: ResolvedPresentation, local?: ActionPresentation, authored?: ActionPresentation): ActionPresentation {
  const defined = (value?: ActionPresentation) => Object.fromEntries(Object.entries(value ?? {}).filter(([, item]) => item !== undefined));
  const sectionAnimation = "ctaAnimationOverride" in defaults ? defaults.ctaAnimationOverride : sectionCTAAnimation(defaults);
  return {
    ...defined(authored), ...defined(defaults.buttons), ...defined(local),
    hover: sectionAnimation ?? local?.hover ?? defaults.motion?.ctaHover ?? defaults.buttons?.hover ?? authored?.hover ?? "none",
  };
}
