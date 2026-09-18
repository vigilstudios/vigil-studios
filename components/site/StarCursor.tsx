"use client";

import { useEffect, useRef } from "react";

/**
 * The pointer is the Vigil star on fine-pointer devices: green on the page,
 * white over links and buttons, black over green surfaces (green buttons,
 * green sections). Text fields keep the native cursor. The native cursor
 * is hidden through the `star-cursor` class on <html>, which is only set
 * once this has mounted, so nothing is ever without a pointer.
 */
const STAR = "488.85 412.76 448.48 412.8 449.91 377.59 419.48 396.62 399.29 361.38 430.03 344.52 399.28 328.33 419.47 292.72 449.93 312.15 448.48 276.64 488.86 276.63 487.78 311.79 517.86 292.74 538.42 328.36 507.26 344.48 538.44 361.37 517.86 396.65 487.77 377.93";

export function StarCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("star-cursor");
    let shown = false;
    const tone = (target: EventTarget | null) => {
      const node = target instanceof Element ? target : null;
      if (!node) return "";
      if (node.closest("input, textarea, select, [contenteditable]")) return "native";
      if (node.closest(".btn-primary, .section-accent, [data-cursor='dark']")) return "is-dark";
      if (node.closest("a, button, [role='button'], summary, label, [data-cursor='light']")) return "is-light";
      return "";
    };
    const onMove = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const t = tone(e.target);
      el.classList.toggle("is-dark", t === "is-dark");
      el.classList.toggle("is-light", t === "is-light");
      const native = t === "native";
      root.classList.toggle("star-cursor", !native);
      if (!shown && !native) { shown = true; el.style.opacity = "1"; }
      if (native) { shown = false; el.style.opacity = "0"; }
    };
    const onLeave = () => { shown = false; el.style.opacity = "0"; };
    const onDown = () => el.classList.add("is-down");
    const onUp = () => el.classList.remove("is-down");
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      root.classList.remove("star-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="star-cursor-el" aria-hidden>
      <svg viewBox="399 276 140 137">
        <polygon points={STAR} />
      </svg>
    </div>
  );
}
