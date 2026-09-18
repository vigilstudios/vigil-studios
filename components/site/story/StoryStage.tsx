"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { clamp, setStoryProgress } from "./progress";

/**
 * One pinned stage for the home page's first two acts: the hero, then "How
 * it works", told on the same screen. The section is tall; a sticky child
 * fills the viewport; the scroll through the section is the story's clock
 * (see PHASE in progress.ts). Below `md` nothing pins: the acts stack and
 * each animates as it scrolls into view.
 *
 * Scroll snap: the page snaps section by section, but a snap point inside
 * a story would tear it. While the visitor is anywhere in the story the
 * container carries `snap-paused`; it comes off the moment the story is
 * complete (its end marker is the snap position they land on), and goes
 * back on as soon as they scroll back up into it.
 */
export function StoryStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const main = document.getElementById("site-root");
    const target: HTMLElement | Window = main ?? window;
    const desktop = () => window.matchMedia("(min-width: 768px)").matches;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = desktop() && travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
      setStoryProgress(p);
      main?.classList.toggle("snap-paused", desktop() && p < 1);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    // Resting on the story's end with snapping on, a small upward scroll would be snapped straight back before
    // the scroll listener could react. Pause on the gesture itself, before the scroll happens.
    const nearEnd = () => {
      const top = main ? main.scrollTop : window.scrollY;
      return top <= section.offsetHeight - window.innerHeight + window.innerHeight * 0.6;
    };
    const onWheel = (e: WheelEvent) => {
      if (desktop() && e.deltaY < 0 && nearEnd()) main?.classList.add("snap-paused");
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (desktop() && y > touchY + 4 && nearEnd()) main?.classList.add("snap-paused");
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
      <div className="story-stage md:sticky md:top-0 md:h-[100svh] md:overflow-hidden">{children}</div>
      {/* The story's end is the snap position the page lands on when snapping resumes: a real 1 px box at the very bottom of the section. */}
      <div className="absolute bottom-0 left-0 h-px w-px" style={{ scrollSnapAlign: "end" }} aria-hidden />
    </section>
  );
}
