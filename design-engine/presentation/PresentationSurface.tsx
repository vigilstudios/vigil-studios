"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionPolicy } from "../motion/MotionPolicy";
import { controlIconMasks } from "./control-icon-masks";
import { PresentationProvider } from "./PresentationContext";
import type { MotionSettings, ResolvedPresentation } from "./schema";
import { observePresentationMotion } from "./motion";
import "./styles.css";
export { motionFrame } from "./motion";
export function PresentationSurface({ value, navigation = false, children }: { value: ResolvedPresentation; navigation?: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null), policy = useMotionPolicy();
  const motion = JSON.stringify(value.motion ?? {});
  useEffect(() => {
    const host = root.current, settings: MotionSettings = JSON.parse(motion);
    if (!host || policy.systemReduced) return;
    return observePresentationMotion(host, settings, navigation);
  }, [motion, navigation, policy.systemReduced]);
  const heading = value.heading, controls = value.controls, viewport = value.viewport;
  const height = { half: 50, "three-quarter": 75, viewport: 100, "one-and-half": 150, custom: viewport?.minimum ?? 100 };
  const minimum = viewport?.height && viewport.height !== "natural" ? height[viewport.height] : undefined;
  const fluid = (size: number) => `clamp(${Math.min(size, Math.max(24, size * .6))}px, ${size / 14.4}cqw, ${size}px)`;
  const style = {
    ...(heading?.titleSize !== undefined ? { "--de-shared-title": fluid(heading.titleSize) } : {}),
    ...(heading?.eyebrowSize !== undefined ? { "--de-shared-eyebrow": `${heading.eyebrowSize}px` } : {}),
    ...(heading?.descriptionSize !== undefined ? { "--de-shared-description": `${heading.descriptionSize}px` } : {}),
    ...(heading?.bodySize !== undefined ? { "--de-shared-body": `${heading.bodySize}px`, "--de-body-size": `${heading.bodySize}px` } : {}),
    ...(heading?.titleLineHeight !== undefined ? { "--de-shared-title-leading": heading.titleLineHeight } : {}),
    ...(heading?.bodyLineHeight !== undefined ? { "--de-shared-leading": heading.bodyLineHeight } : {}),
    ...(heading?.eyebrowGap !== undefined ? { "--de-shared-eyebrow-gap": `${heading.eyebrowGap}px` } : {}),
    ...(heading?.descriptionGap !== undefined ? { "--de-shared-description-gap": `${heading.descriptionGap}px` } : {}),
    ...(heading?.titleWidth !== undefined ? { "--de-shared-title-width": `${heading.titleWidth}px` } : {}),
    ...(heading?.descriptionWidth !== undefined ? { "--de-shared-description-width": `${heading.descriptionWidth}px` } : {}),
    ...(controls?.icon ? { "--de-control-icon": controlIconMasks[controls.icon] } : {}),
    ...(controls?.size ? { "--de-control-size": `${controls.size}px` } : {}),
    ...(minimum ? { "--de-viewport-minimum": `calc(var(--de-viewport-height, 100svh) * ${minimum / 100})` } : {}),
    ...(viewport?.padding !== undefined ? { "--de-section-space": `${viewport.padding}px` } : {}),
    "--de-vertical-align": { start: "flex-start", center: "center", end: "flex-end" }[viewport?.alignment ?? "center"],
  } as CSSProperties;
  return <PresentationProvider value={value}><div ref={root} className="de-presentation" style={style} data-heading-uniform={!navigation && heading && Object.keys(heading).length > 0 || undefined} data-controls-icon={controls?.icon ? controls.iconPosition ?? "leading" : undefined} data-controls-shape={controls?.shape} data-controls-treatment={controls?.treatment} data-controls-hover={controls?.hover} data-media-hover={policy.systemReduced ? "none" : value.motion?.mediaHover} data-viewport-active={!navigation && !!minimum || undefined}>{children}</div></PresentationProvider>;
}
