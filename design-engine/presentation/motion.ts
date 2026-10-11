import type { MotionSettings } from "./schema";
import { clearEntranceTiming, setEntranceReadyAt } from "../motion/entrance-timing";

const excludedContent = "[inert],[aria-hidden='true'],dialog,script,style,template";

/** Keep authored groups intact, while covering every visible content branch. */
export function sectionMotionPieces(section: HTMLElement) {
  const eligible = (node: HTMLElement) => !node.closest(excludedContent);
  const heading = [...section.querySelectorAll<HTMLElement>("header > :is(h1,h2,p,span),.hx-copy > :is(h1,p),.hx-poster-context > p,[data-de-motion-piece='heading']")].filter(node => eligible(node) && !node.closest("nav"));
  const media = [...section.querySelectorAll<HTMLElement>(".de-creator-photos,.vm-apple-card,.de-gallery-card,.de-expand-panels,.de-moving-chorus,.de-inquiry-media,.de-service-atlas figure,[data-de-motion-piece='media']")].filter(eligible);
  const content = [...section.querySelectorAll<HTMLElement>("[data-de-motion-piece='content']")].filter(eligible);
  const selected = [...new Set([...heading, ...media, ...content])];
  const outer = selected.filter(node => !selected.some(parent => parent !== node && parent.contains(node)));
  const body: HTMLElement[] = [];
  function collect(node: HTMLElement) {
    if (!eligible(node)) return;
    if (outer.includes(node)) {
      if (!heading.includes(node) && !media.includes(node)) body.push(node);
      return;
    }
    if (node === section || outer.some(piece => node.contains(piece))) {
      [...node.children].forEach(child => collect(child as HTMLElement));
    } else if (node.textContent?.trim() || node.matches("img,picture,video,canvas,svg,input,textarea,select,button") || node.querySelector("img,picture,video,canvas,svg,input,textarea,select,button")) {
      // A section's remaining body, form, links or controls belong to the same rules.
      body.push(node);
    }
  }
  collect(section);
  return { heading: heading.filter(node => outer.includes(node)), media: media.filter(node => outer.includes(node)), body };
}

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
  const { heading, media, body } = navigation ? {
    heading: [...section.querySelectorAll<HTMLElement>(".de-nx-navigation > :not(dialog):not(.de-nx-panel),.de-nav__inner > *,.de-island-nav > :not(.de-island-nav__panel),.de-contents-nav > :not(dialog)")].filter(node => !node.closest(excludedContent) && node.checkVisibility()),
    media: [] as HTMLElement[], body: [] as HTMLElement[],
  } : sectionMotionPieces(section);
  const pieces = (settings.stagger ?? 0) > 0 && heading.length + media.length + body.length > 0 ? [...heading, ...body, ...media] : [section];
  if (pieces[0] !== section && settings.sequence === "media-first") pieces.splice(0, pieces.length, ...media, ...heading, ...body);
  if (settings.sequence === "reverse") pieces.reverse();
  const targets = [...new Set(pieces)].filter(node => !pieces.some(parent => parent !== node && parent.contains(node)));
  let entered = false, animations: Animation[] = [], active = false;
  const cancel = () => { animations.forEach(animation => animation.cancel()); animations = []; targets.forEach(clearEntranceTiming); };
  if (!navigation && settings.entrance && settings.entrance !== "none") targets.forEach(target => setEntranceReadyAt(target, Infinity));
  function play(effect: string, entering: boolean) {
    cancel();
    if (effect === "none" || host.contains(document.activeElement)) return;
    targets.forEach((target, index) => {
      if (!host.checkVisibility()) return;
      const from = motionFrame(effect, settings), final: Keyframe = { opacity: 1 };
      const authored = typeof getComputedStyle === "function" ? getComputedStyle(target) : undefined;
      if (authored?.opacity) final.opacity = Number(authored.opacity);
      if (from.transform) {
        final.transform = authored?.transform || "none";
        if (final.transform !== "none") from.transform += ` ${final.transform}`;
      }
      if (from.filter) {
        final.filter = authored?.filter || "none";
        if (final.filter !== "none") from.filter += ` ${final.filter}`;
      }
      if (from.clipPath) final.clipPath = authored?.clipPath || "inset(0 0 0 0)";
      const delay = entering ? (settings.delay ?? 0) + Math.min(index, 12) * (settings.sequence === "together" ? 0 : settings.stagger ?? 0) : 0;
      if (entering && !navigation) setEntranceReadyAt(target, performance.now() + delay);
      const animation = target.animate(entering ? [from, final] : [final, from], {
        duration: settings.duration ?? 650, delay,
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
