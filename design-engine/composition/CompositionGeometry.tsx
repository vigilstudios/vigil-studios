"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { SectionInstance } from "./schemas";
/** Measures closed chrome once per geometry change, independent of Hero implementation. */
export function CompositionGeometry({
  navigation,
  children,
}: {
  navigation?: SectionInstance;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const position =
    navigation && "settings" in navigation
      ? String(navigation.settings.position)
      : navigation &&
          "placement" in navigation &&
          navigation.placement === "overlay"
        ? "overlay"
        : "flow";
  useLayoutEffect(() => {
    const element = root.current,
      header = element?.querySelector<HTMLElement>(
        ".de-nx-navigation,.de-island-nav,.de-nav",
      ),
      system = element?.querySelector<HTMLElement>(".de-navigation-system");
    if (!element || !header) return;
    let maxHeight = 0;
    const measure = () => {
      if (!element.checkVisibility()) return;
      const scene = element.querySelector<HTMLElement>(
        "[data-hero-section] [data-ink]",
      );
      // Palette variables exist inside the section's theme, below this wrapper.
      if (scene)
        header.style.setProperty(
          "--de-navigation-auto-ink",
          scene.dataset.ink === "light" ? "var(--de-palette-light)" : "var(--de-palette-dark)",
        );
      else header.style.removeProperty("--de-navigation-auto-ink");
      const scale =
        element.getBoundingClientRect().width / element.offsetWidth || 1;
      let height = Math.ceil(header.getBoundingClientRect().height / scale);
      if (position === "edge" && element.offsetWidth > 760) height = 0;
      // Compact scroll changes paint, not the reserved Hero/content geometry.
      if (system?.dataset.scrolled !== "true") maxHeight = height;
      height = Math.max(height, maxHeight);
      const offset =
        position === "floating"
          ? parseFloat(
              getComputedStyle(system!).getPropertyValue("--de-nx-dock-offset"),
            ) || 0
          : 0;
      element.style.setProperty("--de-navigation-height", `${height}px`);
      element.style.setProperty(
        "--de-overlay-inset",
        position === "flow" ? "0px" : `${height + offset}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [navigation?.component, position, children]);
  return (
    <div
      ref={root}
      className="de-composition-geometry"
      data-navigation-position={position}
    >
      {children}
    </div>
  );
}
