"use client";
import { ControlIcon } from "@/design-engine/presentation/PresentationContext";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SectionInstance } from "@/design-engine/composition/schemas";
import type { LiquidGlassCarouselHandle } from "./liquid-glass-carousel-engine";
import { isVideoAsset } from "@/design-engine/media/source";
import { useMotionPolicy } from "@/design-engine/motion/MotionPolicy";
import { Plate } from "@/design-engine/sections/work/shared";
import { ItemAction } from "@/design-engine/actions/SectionActions";
import {
  GalleryFrame,
  GalleryHeading,
  StepButton,
  useGalleryInspection,
} from "./media-gallery-shared";
export function LiquidGlassCarousel(
  section: SectionInstance<"work.liquid-glass">,
) {
  const works = section.content.works,
    policy = useMotionPolicy(),
    mount = useRef<HTMLDivElement>(null),
    cursor = useRef<HTMLDivElement>(null),
    engine = useRef<LiquidGlassCarouselHandle | null>(null);
  const [active, setActive] = useState(0),
    [focused, setFocused] = useState(false),
    [failedSet, setFailedSet] = useState<string | null>(null);
  const { inspect, modal } = useGalleryInspection(works),
    current = works[active] ?? works[0];
  const assetKey = works
    .map((work) => `${work.id}:${work.image.src}`)
    .join("|");
  const failed = failedSet === assetKey,
    mixedMedia = works.some(work => isVideoAsset(work.image)),
    native = mixedMedia || failed || policy.reduced || section.motion === "none";
  const items = useMemo(
    () =>
      works.map((work) => ({
        title: work.title,
        src: work.image.src,
        aspect: work.image.width / work.image.height,
      })),
    [works],
  );
  useEffect(() => {
    const host = mount.current;
    if (!host || native) return;
    let canceled = false,
      started = false;
    const readPalette = () => {
      const owner = host.closest(".vigil-media")!;
      const styles = getComputedStyle(owner);
      return {
        background:
          styles.getPropertyValue("--vm-bg").trim() || styles.backgroundColor,
        accent: styles.getPropertyValue("--vm-accent").trim() || "#009dff",
      };
    };
    const paletteObserver = new MutationObserver(() => {
      const colors = readPalette();
      engine.current?.setColors(colors.background, colors.accent);
    });
    let ancestor: Element | null = host.parentElement;
    while (ancestor) {
      if (ancestor.classList.contains("de-root"))
        paletteObserver.observe(ancestor, {
          attributes: true,
          attributeFilter: ["style"],
        });
      ancestor = ancestor.parentElement;
    }
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || started) return;
        started = true;
        try {
          const { createCarousel } =
            await import("./liquid-glass-carousel-engine");
          if (canceled) return;
          const { background, accent } = readPalette();
          const handle = createCarousel(host, cursor.current, {
            items,
            panelHeight: 450,
            gap: section.gap === "open" ? 24 : 12,
            background,
            accent,
            entry: section.entry === "rise-grow",
            onActiveChange: setActive,
            onFocusChange: setFocused,
            onEntryDone: () => {},
            onFailure: () => {
              if (!canceled) setFailedSet(assetKey);
            },
          });
          if (!handle) {
            setFailedSet(assetKey);
            return;
          }
          engine.current = handle;
        } catch {
          if (!canceled) setFailedSet(assetKey);
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(host);
    return () => {
      canceled = true;
      observer.disconnect();
      paletteObserver.disconnect();
      engine.current?.destroy();
      engine.current = null;
    };
  }, [
    items,
    native,
    section.gap,
    section.entry,
    section.skin,
    section.surface,
    assetKey,
  ]);
  function nativeImages() {
    return (
      <div className="vm-liquid-native" data-mixed={mixedMedia || undefined}>
        {works.map((work) => (
          <article key={work.id}>
            <Plate image={work.image}/>
            <button type="button" aria-label={`Inspect ${work.title}`} onClick={event => inspect(work.id, event.currentTarget)}>{work.title}</button>
            <ItemAction group="works" itemId={work.id} />
          </article>
        ))}
      </div>
    );
  }
  return (
    <GalleryFrame section={section} kind="liquid">
      <GalleryHeading section={section} />
      {native ? (
        <div className="vm-liquid-fallback">
          {failed && (
            <p role="status">
              Showing the image gallery because the glass effect is unavailable.
            </p>
          )}
          {nativeImages()}
        </div>
      ) : (
        <>
          <div
            className="vm-liquid-stage"
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Liquid glass image carousel"
            onKeyDown={(event) => {
              if (
                event.key === "ArrowRight" ||
                event.key === "ArrowLeft" ||
                event.key === "Escape"
              ) {
                event.preventDefault();
                if (event.key === "ArrowRight") engine.current?.next();
                else if (event.key === "ArrowLeft") engine.current?.previous();
                else engine.current?.closeFocus();
              }
            }}
          >
            <div ref={mount} className="vm-liquid-mount" />
            <p className="vm-liquid-title">{current.title}</p>
            <p className="vm-liquid-counter" role="status" aria-live="polite">
              {String(active + 1).padStart(2, "0")}/
              {String(works.length).padStart(2, "0")}
            </p>
            <div ref={cursor} className="vm-liquid-cursor" aria-hidden="true">
              View
            </div>
            {focused && (
              <button
                type="button"
                className="vm-liquid-close"
                onClick={() => engine.current?.closeFocus()}
              >
                Close focus
              </button>
            )}
          </div>
          <div className="vm-controls vm-liquid-controls">
            <StepButton
              direction="previous"
              onClick={() => engine.current?.previous()}
            />
            <button
              type="button"
              className="vm-small-cta"
              aria-label={`Inspect ${current.title}`}
              onClick={(event) => inspect(current.id, event.currentTarget)}
            >
              <ControlIcon/> View image
            </button>
            <ItemAction group="works" itemId={current.id} />
            <StepButton
              direction="next"
              onClick={() => engine.current?.next()}
            />
          </div>
          <details className="vm-liquid-details">
            <summary>Browse all images</summary>
            {nativeImages()}
          </details>
        </>
      )}
      {modal}
    </GalleryFrame>
  );
}
export default LiquidGlassCarousel;
