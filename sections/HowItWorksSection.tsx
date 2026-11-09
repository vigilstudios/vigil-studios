"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { journeyStages } from "@/components/site/journey-stages";
import { clamp, PHASE, rng, setStoryProgress } from "@/components/site/story/progress";
import { ProcessObject } from "@/components/site/ProcessObjects";
import styles from "./home-process.module.css";

function distanceToStop(root: HTMLElement, stop: HTMLElement) {
  const inset = parseFloat(getComputedStyle(root).paddingTop) || 0;
  return stop.getBoundingClientRect().top - root.getBoundingClientRect().top - inset;
}

function selectChapter(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const { hash } = event.currentTarget;
  const root = document.getElementById("site-root");
  const stop = document.getElementById(hash.slice(1));
  if (!root || !stop) return;
  event.preventDefault();
  if (window.location.hash !== hash) window.history.pushState(null, "", hash);
  root.scrollTo({ top: root.scrollTop + distanceToStop(root, stop), behavior: "instant" });
}

export function HowItWorksSection({ hero }: { hero: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>();

  useEffect(() => {
    const root = document.getElementById("site-root");
    const stage = stageRef.current;
    const origin = originRef.current;
    if (!root || !stage || !origin) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
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

    root.addEventListener("scroll", schedule, { passive: true });
    root.addEventListener("scrollend", settle);
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("scroll", schedule);
      root.removeEventListener("scrollend", settle);
      window.removeEventListener("resize", schedule);
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

        <div className={styles.viewport} role="region" aria-labelledby="home-process-title">
          <h2 id="home-process-title" className="sr-only">How Vigil works, from build through ongoing care</h2>
          <div className={styles.track}>
            {journeyStages.map(({ id, name, title, body, href, link }, index) => {
              const offscreen = active !== undefined && active !== index;
              return (
                <section
                  key={id}
                  data-chapter={name}
                  aria-labelledby={`${id}-title`}
                  aria-hidden={offscreen || undefined}
                  inert={offscreen}
                  className={styles.chapter}
                >
                  <div className={styles.scene}>
                    <div className={styles.copy}>
                      <p className={styles.eyebrow}><span /> The Vigil process <b>0{index + 1} / 0{journeyStages.length}</b></p>
                      <p className={styles.chapterName}>{name}</p>
                      <h3 id={`${id}-title`}>{title}</h3>
                      <p className={styles.description}>{body}</p>
                      <Link href={href} prefetch={false} className={styles.detailLink}>{link} <ArrowUpRight size={15} aria-hidden /></Link>
                    </div>
                    <ProcessObject stage={name} active={active === index} />
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className={styles.controls} data-visible={hasChapter} inert={!hasChapter}>
          <nav aria-label="Vigil process stages" className={styles.rail}>
            <ol style={{ "--completed": (active ?? 0) / (journeyStages.length - 1) } as CSSProperties}>
              {journeyStages.map(({ id, name, icon: Icon }, index) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={selectChapter} aria-current={active === index ? "step" : undefined} data-completed={active != null && index < active}>
                    <span className={styles.marker}><Icon size={17} aria-hidden /></span>
                    <span>{name}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <a href="#start" className={styles.skip}>Find where you are <ArrowDown size={15} aria-hidden /></a>
        </div>
      </div>
      <div className={styles.stop} ref={originRef} data-home-snap aria-hidden="true" />
      {journeyStages.map(({ id }) => (
        <div className={styles.stop} key={id} id={id} data-home-snap aria-hidden="true" />
      ))}
    </div>
  );
}
