"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionPolicy } from "../motion/MotionPolicy";
import { controlIconMasks } from "./control-icon-masks";
import { PresentationProvider } from "./PresentationContext";
import type { MotionSettings, ResolvedPresentation } from "./schema";
import "./styles.css";
export function motionFrame(effect: string, settings: MotionSettings = {}): Keyframe {
  const distance = settings.distance ?? 32, blur = settings.blur ?? 10;
  const frame: Keyframe = { opacity: effect === "none" ? 1 : 0 };
  if (effect.startsWith("slide") || effect === "blur-slide") {
    const horizontal = effect === "slide-left" || effect === "slide-right";
    frame.transform = `translate${horizontal ? "X" : "Y"}(${effect === "slide-down" || effect === "slide-right" ? -distance : distance}px)`;
  }
  if (effect === "blur" || effect === "blur-slide") frame.filter = `blur(${blur}px)`;
  if (effect === "zoom") frame.transform = `scale(${settings.scale ?? .94})`;
  if (effect === "clip") frame.clipPath = "inset(0 0 100% 0)";
  return frame;
}
export function PresentationSurface({ value, navigation = false, children }: { value: ResolvedPresentation; navigation?: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null), policy = useMotionPolicy();
  const motion = JSON.stringify(value.motion ?? {});
  useEffect(() => {
    const host = root.current, settings: MotionSettings = JSON.parse(motion);
    if (!host || navigation || policy.systemReduced || (!settings.entrance || settings.entrance === "none") && (!settings.exit || settings.exit === "none")) return;
    const section = host.querySelector<HTMLElement>(".de-section-layout > section,.de-section-layout > div");
    if (!section || !section.animate) return;
    const heading = [...section.querySelectorAll<HTMLElement>("header > :is(h1,h2,p,span),.hx-copy > :is(h1,p),.hx-poster-context > p")].filter(node => !node.closest("[inert],[aria-hidden='true'],nav,dialog"));
    const media = [...section.querySelectorAll<HTMLElement>(".de-creator-photos,.vm-apple-card,.de-gallery-card,.de-expand-panels,.de-moving-chorus,.de-inquiry-media,.de-service-atlas figure")].filter(node => !node.closest("[inert],[aria-hidden='true']"));
    const pieces = (settings.stagger ?? 0) > 0 && heading.length ? [...heading, ...media] : [section];
    if (pieces[0] !== section && settings.sequence === "media-first") pieces.splice(0, pieces.length, ...media, ...heading);
    if (settings.sequence === "reverse") pieces.reverse();
    const targets = [...new Set(pieces)].filter(node => !pieces.some(parent => parent !== node && parent.contains(node)));
    let entered = false, animations: Animation[] = [], active = false;
    const cancel = () => { animations.forEach(animation => animation.cancel()); animations = []; };
    const final: Keyframe = { opacity: 1, transform: "none", filter: "blur(0px)", clipPath: "inset(0 0 0 0)" };
    function play(effect: string, entering: boolean) {
      cancel();
      if (effect === "none") return;
      const from = motionFrame(effect, settings);
      targets.forEach((target, index) => {
        if (!host?.checkVisibility()) return;
        const animation = target.animate(entering ? [from, final] : [final, from], {
          duration: settings.duration ?? 650, delay: entering ? (settings.delay ?? 0) + Math.min(index, 12) * (settings.sequence === "together" ? 0 : settings.stagger ?? 0) : 0,
          easing: { smooth: "cubic-bezier(.2,.7,.2,1)", snappy: "cubic-bezier(.16,1,.3,1)", linear: "linear", spring: "cubic-bezier(.34,1.3,.64,1)" }[settings.easing ?? "smooth"], fill: "both",
        });
        if (entering) animation.onfinish = () => animation.cancel();
        animations.push(animation);
      });
    }
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0].isIntersecting && host.checkVisibility();
      if (visible && !active) { if (!entered || settings.replay) play(settings.entrance ?? "none", true); else cancel(); entered = true; }
      else if (!visible && active && entered) play(settings.exit ?? "none", false);
      active = visible;
    }, { rootMargin: `-${Math.round(Math.min(settings.threshold ?? .08,.1) * 100)}% 0px -${Math.round((settings.threshold ?? .08) * 100)}% 0px`, threshold: 0 });
    observer.observe(host);
    const focus = () => cancel();
    host.addEventListener("focusin", focus);
    return () => { cancel(); observer.disconnect(); host.removeEventListener("focusin", focus); };
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
