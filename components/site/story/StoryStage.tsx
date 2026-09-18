"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { clamp, setStoryProgress } from "./progress";

/**
 * One pinned stage for the home page's first two acts: the hero, then "How
 * it works", told on the same screen at every size. The section is tall; a
 * sticky child fills the viewport; the scroll through the section is the
 * story's clock (see PHASE in progress.ts). The story finishes two viewports
 * before the stage unpins: the finale holds for a viewport of scroll, then
 * the next section, pulled up by a viewport, slides over it while the stage
 * still holds.
 *
 * Scroll snap: the page snaps section by section, but a snap point inside
 * a story would tear it. While the visitor is anywhere in the story the
 * container carries `snap-paused`; it comes off the moment the story is
 * complete (its end marker is the snap position they land on), and goes
 * back on as soon as they scroll back up into it. Resting on that end with
 * snapping on, a small upward scroll would be snapped straight back before
 * the scroll listener could react, so the upward gesture itself (wheel,
 * touch or keyboard) pauses it. The story's start is a snap position too,
 * so a jump to the top of the page lands on the hero rather than on the
 * nearest snap position below it.
 */
export function StoryStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const main = document.getElementById("site-root");
    const target: HTMLElement | Window = main ?? window;
    // The story's travel ends two viewports before the section does: one viewport of hold on the finale
    // (snapping is back on and the end marker is the only place to land), then one viewport in which the
    // next section slides over the finale while the stage still holds.
    const travel = () => section.offsetHeight - 3 * window.innerHeight;
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
    const onKey = (e: KeyboardEvent) => {
      const up = e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Home" || (e.key === " " && e.shiftKey);
      if (up && nearEnd()) main?.classList.add("snap-paused");
    };
    // An in-page link (Contact, How it works) jumps in one go; with snapping on, a jump into the story would be
    // snapped to its nearest end. Pause before the jump; the scroll it causes settles the state, and if no scroll
    // comes (the link pointed at where the visitor already is) a moment later measure() restores it.
    let settle = 0;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || !a.getAttribute("href")?.includes("#")) return;
      main?.classList.add("snap-paused");
      clearTimeout(settle);
      settle = window.setTimeout(measure, 600);
    };
    target.addEventListener("scroll", schedule, { passive: true });
    target.addEventListener("wheel", onWheel as EventListener, { passive: true });
    target.addEventListener("touchstart", onTouchStart as EventListener, { passive: true });
    target.addEventListener("touchmove", onTouchMove as EventListener, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      target.removeEventListener("scroll", schedule);
      target.removeEventListener("wheel", onWheel as EventListener);
      target.removeEventListener("touchstart", onTouchStart as EventListener);
      target.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("resize", schedule);
      main?.classList.remove("snap-paused");
    };
  }, []);

  return (
    <section ref={ref} className="story relative z-0" style={{ scrollSnapAlign: "none", scrollSnapStop: "normal" }}>
      {/* The story's start is a snap position: a jump to the top of the page lands on the hero. */}
      <div className="absolute left-0 top-0 h-px w-px" style={{ scrollSnapAlign: "start" }} aria-hidden />
      {/* The anchor for "How it works": the point in the travel where its heading is typed and the first station has just arrived (the start of PHASE.film). */}
      <div id="how-it-works" className="absolute left-0 h-px w-px" style={{ top: "calc((100% - 300svh) * 0.5)" }} aria-hidden />
      <div className="story-stage sticky top-0 h-[100svh] overflow-hidden">{children}</div>
      {/* The story's end (two viewports above the section's bottom) is the snap position the page lands on when snapping resumes; a fling has to clear a full extra viewport to get past it. */}
      <div className="absolute bottom-[200svh] left-0 h-px w-px" style={{ scrollSnapAlign: "end", scrollSnapStop: "always" }} aria-hidden />
    </section>
  );
}
