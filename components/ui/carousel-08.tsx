"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { SectionInstance } from "@/design-engine/composition/schemas";
import { Plate } from "@/design-engine/sections/work/shared";
import { ItemAction } from "@/design-engine/actions/SectionActions";
import { useMotionPolicy } from "@/design-engine/motion/MotionPolicy";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "./carousel";
import {
  GalleryFrame,
  GalleryHeading,
  StepButton,
  useGalleryInspection,
} from "./media-gallery-shared";
export function AppleCardCarousel(
  section: SectionInstance<"work.apple-cards">,
) {
  const [api, setApi] = useState<CarouselApi>(),
    [bounds, setBounds] = useState({ previous: false, next: true });
  const works = section.content.works,
    policy = useMotionPolicy(),
    { inspect, modal } = useGalleryInspection(works);
  useEffect(() => {
    if (!api) return;
    const update = () =>
      setBounds({ previous: api.canScrollPrev(), next: api.canScrollNext() });
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);
  return (
    <GalleryFrame section={section} kind="apple">
      <GalleryHeading section={section} />
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          dragFree: true,
          duration: policy.reduced || section.motion === "none" ? 0 : 25,
        }}
        aria-label="Featured content carousel"
      >
        <CarouselContent className="vm-apple-track">
          {works.map((work) => (
            <CarouselItem key={work.id} className="vm-apple-item">
              <article className="vm-apple-card">
                <Plate image={work.image} />
                <div className="vm-apple-shade" />
                <div className="vm-apple-copy">
                  <p>{work.category}</p>
                  <h3>{work.title}</h3>
                </div>
                <div className="vm-apple-actions">
                  <ItemAction
                    group="works"
                    itemId={work.id}
                    className="vm-small-cta"
                  />
                  {section.inspection === "dialog" && (
                    <button
                      type="button"
                      className="vm-round"
                      aria-label={`Inspect ${work.title}`}
                      onClick={(event) => inspect(work.id, event.currentTarget)}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  )}
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="vm-controls vm-apple-controls">
        <StepButton
          direction="previous"
          disabled={!bounds.previous}
          onClick={() => api?.scrollPrev()}
        />
        <StepButton
          direction="next"
          disabled={!bounds.next}
          onClick={() => api?.scrollNext()}
        />
      </div>
      {section.inspection === "dialog" && modal}
    </GalleryFrame>
  );
}
export default AppleCardCarousel;
