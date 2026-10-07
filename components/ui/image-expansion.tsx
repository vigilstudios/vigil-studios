"use client";
import { useRef, useState } from "react";
import { Sun, Moon } from "lucide-react";
import type { SectionInstance } from "@/design-engine/composition/schemas";
import { Plate } from "@/design-engine/sections/work/shared";
import { ItemAction } from "@/design-engine/actions/SectionActions";
import { useMotionPolicy } from "@/design-engine/motion/MotionPolicy";
import {
  GalleryFrame,
  GalleryHeading,
  StepButton,
  useGalleryInspection,
} from "./media-gallery-shared";

export function ImageExpansionSlider(
  section: SectionInstance<"work.image-expansion">,
) {
  const [category, setCategory] = useState<string | null>(null),
    [selected, setSelected] = useState(section.content.works[0].id),
    [themeOverride, setThemeOverride] = useState<"dark" | "light" | null>(null);
  const rail = useRef<HTMLDivElement>(null),
    policy = useMotionPolicy();
  const categories = [
    ...new Set(section.content.works.map((work) => work.category)),
  ];
  const filter =
    section.filter === "category" && categories.includes(category ?? "")
      ? category
      : null;
  const works = section.content.works.filter(
    (work) => !filter || work.category === filter,
  );
  const index = Math.max(
      0,
      works.findIndex((work) => work.id === selected),
    ),
    theme = themeOverride ?? section.colorMode;
  const { inspect, modal } = useGalleryInspection(works);
  function choose(next: number) {
    const idx = (next + works.length) % works.length;
    setSelected(works[idx].id);
    const host = rail.current,
      card = host?.children[idx] as HTMLElement | undefined;
    if (host && card)
      host.scrollTo({
        left: card.offsetLeft,
        behavior:
          section.motion === "none" || policy.reduced ? "instant" : "smooth",
      });
  }
  function changeCategory(next: string | null) {
    setCategory(next);
    const first = section.content.works.find(
      (work) => !next || work.category === next,
    )!;
    setSelected(first.id);
    if (rail.current) rail.current.scrollLeft = 0;
  }
  return (
    <GalleryFrame section={section} kind="expansion">
      <div
        className="vm-expansion-shell"
        data-tone={theme}
        data-ratio={section.ratio}
      >
        <GalleryHeading section={section} />
        <div className="vm-toolbar">
          <div className="vm-tabs" role="group" aria-label="Gallery categories">
            {section.filter === "category" && (
              <>
                <button
                  type="button"
                  aria-pressed={!filter}
                  onClick={() => changeCategory(null)}
                >
                  All content
                </button>
                {categories.map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={value === filter}
                    onClick={() => changeCategory(value)}
                  >
                    {value}
                  </button>
                ))}
              </>
            )}
          </div>
          {section.skin === "reference" && (
            <button
              type="button"
              className="vm-round vm-theme"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} gallery`}
              onClick={() =>
                setThemeOverride(theme === "dark" ? "light" : "dark")
              }
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
        <div
          ref={rail}
          className="vm-expansion-track"
          aria-label="Featured image cards"
          role="region"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              choose(index + (event.key === "ArrowRight" ? 1 : -1));
            }
          }}
          onScroll={() => {
            const host = rail.current;
            if (!host) return;
            const nodes = Array.from(host.children) as HTMLElement[];
            const nearest = nodes.reduce(
              (best, node) =>
                Math.abs(node.offsetLeft - host.scrollLeft) <
                Math.abs(best.offsetLeft - host.scrollLeft)
                  ? node
                  : best,
              nodes[0],
            );
            if (nearest?.dataset.record) setSelected(nearest.dataset.record);
          }}
        >
          {works.map((work) => (
            <article
              key={work.id}
              data-record={work.id}
              className="vm-expansion-card"
            >
              <Plate image={work.image} />
              <div className="vm-vignette" />
              <span className="vm-badge">
                <span aria-hidden="true">✦</span>
                {work.category}
              </span>
              <div className="vm-expansion-copy">
                <h3>{work.title}</h3>
                <div className="vm-card-actions">
                  {section.inspection === "dialog" && (
                    <button
                      type="button"
                      className="vm-small-cta"
                      aria-label={`Inspect ${work.title}`}
                      onClick={(event) => inspect(work.id, event.currentTarget)}
                    >
                      View image
                    </button>
                  )}
                  <ItemAction
                    group="works"
                    itemId={work.id}
                    className="vm-small-cta"
                  />
                </div>
              </div>
              {section.inspection === "dialog" && (
                <button
                  type="button"
                  className="vm-card-hit"
                  aria-label={`Expand ${work.title}`}
                  onClick={(event) => inspect(work.id, event.currentTarget)}
                />
              )}
            </article>
          ))}
        </div>
        <div className="vm-expansion-footer">
          <div className="vm-dots" role="group" aria-label="Choose image">
            {works.map((work, idx) => (
              <button
                type="button"
                key={work.id}
                aria-label={`Go to image ${idx + 1}`}
                aria-pressed={index === idx}
                onClick={() => choose(idx)}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="vm-controls">
            <StepButton
              direction="previous"
              onClick={() => choose(index - 1)}
            />
            <StepButton direction="next" onClick={() => choose(index + 1)} />
          </div>
        </div>
        {section.inspection === "dialog" && modal}
      </div>
    </GalleryFrame>
  );
}
