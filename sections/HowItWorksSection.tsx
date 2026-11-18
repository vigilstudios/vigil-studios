"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { journeyStages } from "@/components/site/journey-stages";
import { clamp, PHASE, rng, setStoryProgress } from "@/components/site/story/progress";
import { StudioStoryVisual } from "@/components/site/StudioStoryVisual";
import styles from "./home-process.module.css";

function distanceToStop(root: HTMLElement, stop: HTMLElement) {
  const inset = parseFloat(getComputedStyle(root).paddingTop) || 0;
  return stop.getBoundingClientRect().top - root.getBoundingClientRect().top - inset;
}

export function HowItWorksSection({ hero }: { hero: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>();

  const startOrigin = useRef<{ hash: string; search: string; top: number } | null>(null);

  function jumpToStop(event: MouseEvent<HTMLAnchorElement>, animate = false) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const { hash } = event.currentTarget;
    const root = document.getElementById("site-root");
    const stop = document.getElementById(hash.slice(1));
    if (!root || !stop) return;
    event.preventDefault();
    if (window.location.hash !== hash) {
      startOrigin.current = animate
        ? { hash: window.location.hash, search: window.location.search, top: root.scrollTop }
        : null;
      window.history.pushState(null, "", hash);
    }
    if (animate) stop.focus({ preventScroll: true });
    const smooth = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.scrollTo({
      top: root.scrollTop + distanceToStop(root, stop),
      behavior: smooth ? "smooth" : "instant",
    });
  }

  useEffect(() => {
    const root = document.getElementById("site-root");
    const stage = stageRef.current;
    const origin = originRef.current;
    if (!root || !stage || !origin) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let historyFrame = 0;
    const restoreStartHistory = () => {
      const previous = startOrigin.current;
      const { pathname, search, hash } = window.location;
      if (!previous || pathname !== "/" || search !== previous.search) return;
      if (hash !== previous.hash && hash !== "#start") return;

      // A fast Back can interrupt native smooth scrolling before the browser restores its position.
      cancelAnimationFrame(historyFrame);
      historyFrame = requestAnimationFrame(() => {
        const start = document.getElementById("start");
        const top = hash === "#start" && start ? root.scrollTop + distanceToStop(root, start) : previous.top;
        root.scrollTo({ top, behavior: "instant" });
      });
    };
    const update = () => {
      frame = 0;
      const position = clamp(-distanceToStop(root, origin) / origin.offsetHeight, 0, journeyStages.length);
      const chapter = position < .72 ? null : Math.round(position) - 1;

      // The real vertical stops govern the film. Its camera only moves sideways.
      const offset = position < 1 ? 1 - rng(position, .55, 1) : 1 - position;
      const x = motion.matches ? -(chapter ?? -1) : offset;
      const heroOpacity = motion.matches ? Number(chapter === null) : 1 - rng(position, .8, 1);
      stage.style.setProperty("--story-x", `${x * 100}%`);
      stage.style.setProperty("--hero-opacity", String(heroOpacity));

      // Restore the original wireframe breakup and type-out during the opening beat.
      const opening = motion.matches ? Number(chapter !== null) : Math.min(position, 1);
      setStoryProgress(opening * PHASE.markExit[1]);
      setActive(chapter);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const settle = () => {
      // Touch momentum or a focus jump can leave the browser a few pixels past a stop.
      const height = origin.offsetHeight;
      const position = -distanceToStop(root, origin) / height;
      if (position <= 0 || position >= journeyStages.length) return;
      const correction = (Math.round(position) - position) * height;
      if (Math.abs(correction) > 2) root.scrollTo({ top: root.scrollTop + correction, behavior: "instant" });
    };

    let wheelTime = -Infinity;
    let wheelDistance = 0;
    let movedThisGesture = false;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || !event.cancelable || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const height = origin.offsetHeight;
      const position = -distanceToStop(root, origin) / height;
      const last = journeyStages.length;
      const atPackages = Math.abs(position - last - 1) * height <= 2;
      if (position < 0 || (position > last + 2 / height && !(atPackages && event.deltaY < 0))) return;
      if (position <= 2 / height && event.deltaY < 0) return;

      // A mouse notch is much smaller than a chapter. Advance once per wheel
      // gesture so short notches work without a trackpad fling skipping chapters.
      event.preventDefault();
      const now = performance.now();
      if (now - wheelTime > 160) {
        wheelDistance = 0;
        movedThisGesture = false;
      }
      wheelTime = now;
      if (movedThisGesture) return;

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
      wheelDistance += event.deltaY * unit;
      if (Math.abs(wheelDistance) < 20) return;
      movedThisGesture = true;
      const next = Math.round(position) + Math.sign(wheelDistance);
      root.scrollTo({
        top: root.scrollTop + (next - position) * height,
        behavior: motion.matches ? "instant" : "smooth",
      });
    };

    root.addEventListener("scroll", schedule, { passive: true });
    root.addEventListener("scrollend", settle);
    root.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", schedule);
    window.addEventListener("popstate", restoreStartHistory);
    motion.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(historyFrame);
      root.removeEventListener("scroll", schedule);
      root.removeEventListener("scrollend", settle);
      root.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("popstate", restoreStartHistory);
      motion.removeEventListener("change", schedule);
      setStoryProgress(0);
    };
  }, []);

  const hasChapter = active != null;
  return (
    <div className={styles.opening}>
      <div className={styles.stage} ref={stageRef}>
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <section className={styles.hero} inert={hasChapter} aria-hidden={hasChapter || undefined}>{hero}</section>

        <div className={styles.backdrop} aria-hidden="true" />
        <div className={styles.viewport} role="region" aria-labelledby="home-process-title">
          <h2 id="home-process-title" className="sr-only">How Vigil grows from your website into your business platform</h2>
          <div className={styles.track}>
            {journeyStages.map(({ id, name, title, accent, kicker, note, body, href, link }, index) => {
              const offscreen = active !== undefined && active !== index;
              return (
                <section
                  key={id}
                  data-chapter={name}
                  aria-labelledby={`${id}-title`}
                  aria-hidden={offscreen || undefined}
                  inert={offscreen}
                  className={styles.chapter}
                  data-active={active === index}
                >
                  <div className={styles.scene}>
                    <div className={styles.copy}>
                      <p className={styles.eyebrow}><span /> Your business. Connected. <b>0{index + 1} / 0{journeyStages.length}</b></p>
                      <p className={styles.chapterName}>{kicker}</p>
                      <h3 id={`${id}-title`}>{title}<span>{accent}</span></h3>
                      <p className={styles.description}>{body}</p>
                      <Link href={href} prefetch={false} className={styles.detailLink}>{link} <ArrowUpRight size={15} aria-hidden /></Link>
                      <p className={styles.note}>{note}</p>
                    </div>
                    <StudioStoryVisual stage={name} active={active === index} />
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className={styles.controls} data-visible={hasChapter} inert={!hasChapter}>
          <p className={styles.railIntro}>A website to begin.<br /><span>A platform to grow.</span></p>
          <nav aria-label="Vigil process stages" className={styles.rail}>
            <ol>
              {journeyStages.map(({ id, name }, index) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={jumpToStop} aria-current={active === index ? "step" : undefined} data-completed={active != null && index < active}>
                    <span className={styles.marker}>0{index + 1}</span>
                    <span>{name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <a href="#start" onClick={(event) => jumpToStop(event, true)} className={styles.skip}>Find your starting point <ArrowDown size={15} aria-hidden /></a>
        </div>
      </div>
      <div className={styles.stop} ref={originRef} data-home-snap aria-hidden="true" />
      {journeyStages.map(({ id }) => (
        <div className={styles.stop} key={id} id={id} data-home-snap aria-hidden="true" />
      ))}
    </div>
  );
}
