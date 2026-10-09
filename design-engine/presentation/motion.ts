import type { MotionSettings } from "./schema";

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

/** Animate paint inside a stable navigation anchor; sticky/scroll geometry never moves. */
export function observePresentationMotion(host: HTMLElement, settings: MotionSettings, navigation = false): (() => void) | undefined {
  if ((!settings.entrance || settings.entrance === "none") && (!settings.exit || settings.exit === "none")) return;
  const section = host.querySelector<HTMLElement>(navigation ? ".de-navigation-motion" : ".de-section-layout > section,.de-section-layout > div");
  const anchor = navigation ? host.querySelector<HTMLElement>(".de-navigation-motion-anchor") : host;
  if (!section?.animate || !anchor) return;
  const heading = [...section.querySelectorAll<HTMLElement>(navigation
    ? ".de-nx-navigation > :not(dialog):not(.de-nx-panel),.de-nav__inner > *,.de-island-nav > :not(.de-island-nav__panel),.de-contents-nav > :not(dialog)"
    : "header > :is(h1,h2,p,span),.hx-copy > :is(h1,p),.hx-poster-context > p")]
    .filter(node => !node.closest(navigation ? "[inert],[aria-hidden='true'],dialog" : "[inert],[aria-hidden='true'],nav,dialog") && (!navigation || node.checkVisibility()));
  const media = navigation ? [] : [...section.querySelectorAll<HTMLElement>(".de-creator-photos,.vm-apple-card,.de-gallery-card,.de-expand-panels,.de-moving-chorus,.de-inquiry-media,.de-service-atlas figure")].filter(node => !node.closest("[inert],[aria-hidden='true']"));
  const pieces = (settings.stagger ?? 0) > 0 && heading.length ? [...heading, ...media] : [section];
  if (pieces[0] !== section && settings.sequence === "media-first") pieces.splice(0, pieces.length, ...media, ...heading);
  if (settings.sequence === "reverse") pieces.reverse();
  const targets = [...new Set(pieces)].filter(node => !pieces.some(parent => parent !== node && parent.contains(node)));
  let entered = false, animations: Animation[] = [], active = false;
  const cancel = () => { animations.forEach(animation => animation.cancel()); animations = []; };
  const final: Keyframe = { opacity: 1, transform: "none", filter: "blur(0px)", clipPath: "inset(0 0 0 0)" };
  function play(effect: string, entering: boolean) {
    cancel();
    if (effect === "none" || host.contains(document.activeElement)) return;
    const from = motionFrame(effect, settings);
    targets.forEach((target, index) => {
      if (!host.checkVisibility()) return;
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
  }, { rootMargin: navigation ? "0px" : `-${Math.round(Math.min(settings.threshold ?? .08,.1) * 100)}% 0px -${Math.round((settings.threshold ?? .08) * 100)}% 0px`, threshold: 0 });
  observer.observe(anchor);
  host.addEventListener("focusin", cancel);
  return () => { cancel(); observer.disconnect(); host.removeEventListener("focusin", cancel); };
}
