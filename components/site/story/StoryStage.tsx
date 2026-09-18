"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { clamp, setStoryProgress } from "./progress";

/**
 * One pinned stage for the home page's first two acts: the hero, then "How
 * it works", told on the same screen at every size. The section is tall; a
 * sticky child fills the viewport; the scroll through the section is the
 * story's clock (see PHASE in progress.ts). The story finishes one viewport
 * before the stage unpins: the next section, pulled up by a viewport, slides
 * over the finale while the stage still holds.
 *
 * Scroll snap: the page snaps section by section, but a snap point inside
 * a story would tear it. While the visitor is anywhere in the story the
 * container carries `snap-paused`; it comes off the moment the story is
 * complete (its end marker is the snap position they land on), and goes
 * back on as soon as they scroll back up into it. Resting on that end with
 * snapping on, a small upward scroll would be snapped straight back before
 * the scroll listener could react, so the upward gesture itself pauses it.
 */
export function StoryStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const main = document.getElementById("site-root");
    const target: HTMLElement | Window = main ?? window;
    const travel = () => section.offsetHeight - 2 * window.innerHeight;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const t = travel();
      const p = t > 0 ? clamp(-section.getBoundingClientRect().top / t, 0, 1) : 0;
      setStoryProgress(p);
      main?.classList.toggle("snap-paused", p < 1);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const nearEnd = () => {
      const top = main ? main.scrollTop : window.scrollY;
      return top <= travel() + window.innerHeight * 0.6;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0 && nearEnd()) main?.classList.add("snap-paused");
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (y > touchY + 4 && nearEnd()) main?.classList.add("snap-paused");
    };
    target.addEventListener("scroll", schedule, { passive: true });
    target.addEventListener("wheel", onWheel as EventListener, { passive: true });
    target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    target.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener("scroll", schedule);
      target.removeEventListener("wheel", onWheel as EventListener);
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("resize", schedule);
      main?.classList.remove("snap-paused");
    };
  }, []);

  return (
    <section ref={ref} className="story relative z-0" style={{ scrollSnapAlign: "none", scrollSnapStop: "normal" }}>
      <div className="story-stage sticky top-0 h-[100svh] overflow-hidden">{children}</div>
      {/* The story's end (one viewport above the section's bottom) is the snap position the page lands on when snapping resumes. */}
      <div className="absolute bottom-[100svh] left-0 h-px w-px" style={{ scrollSnapAlign: "end" }} aria-hidden />
    </section>
  );
}
