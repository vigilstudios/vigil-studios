"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, Circle, Plus } from "lucide-react";
import { journeyStages } from "@/components/site/journey-stages";
import styles from "./home-process.module.css";

const illustrations: Record<(typeof journeyStages)[number]["name"], string> = {
  Build: "M7 13h38v27H7z M7 20h38 M11 16.5h2m3 0h2m3 0h2 M12 25h14m-14 5h11m-11 5h8 M31 25h9v10h-9z",
  Launch: "M36 28a15 15 0 1 0-15 13m14-26a15 15 0 0 0-14 26m2-30a15 15 0 0 1 10 18M10 26h29M14 17h22M14 35h11 M32 35l5 5 9-10",
  Respond: "M9 13h33v20H9z M9 14l16.5 12L42 14 M18 39h26v-9m-2 14h-9m-4 0h-4",
  Book: "M9 13h34v30H9z M9 21h34M18 10v7m16-7v7M15 27h4m5 0h4m5 0h4M15 33h4m-4 5h4m5 0h4 M28 32l4 4 7-8",
  Improve: "M9 12v29h35M15 33l7-7 7 3 11-13m-7 0h7v7 M15 20h5m-5-5h8",
};

export function HowItWorksSection() {
  const processRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const root = document.getElementById("site-root");
    if (!root || !processRef.current) return;
    const chapters = Array.from(processRef.current.querySelectorAll("[data-chapter]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const center = root.getBoundingClientRect().top + root.clientHeight / 2;
      const index = chapters.findIndex((chapter) => {
        const { top, bottom } = chapter.getBoundingClientRect();
        return top <= center && bottom > center;
      });
      setActive(index >= 0 ? index : null);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    root.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div className={styles.process} ref={processRef} role="region" aria-labelledby="home-process-title">
      <h2 id="home-process-title" className="sr-only">How Vigil works, from build through ongoing care</h2>
      <div className={styles.controls}>
        <nav aria-label="Vigil process stages" className={styles.rail}>
          <ol style={{ "--completed": (active ?? 0) / (journeyStages.length - 1) } as CSSProperties}>
            {journeyStages.map(({ id, name, icon: Icon }, index) => (
              <li key={id}>
                <a href={`#${id}`} aria-current={active === index ? "step" : undefined} data-completed={active !== null && index < active}>
                  <span className={styles.marker}><Icon size={17} aria-hidden /></span>
                  <span className={styles.railLabel}>{name}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <a href="#start" className={styles.skip}>Find where you are <ArrowDown size={15} aria-hidden /></a>
      </div>
      {journeyStages.map(({ id, name, label, title, body, href, link, signals }, index) => (
        <section
          key={id}
          id={id}
          data-home-snap
          data-chapter
          data-active={active === index}
          aria-labelledby={`${id}-title`}
          tabIndex={-1}
          className={styles.chapter}
        >
          <div className={styles.scene}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}><span /> The Vigil process <span className={styles.count}>0{index + 1} / 0{journeyStages.length}</span></p>
              <p className={styles.chapterName}>{name}</p>
              <h3 id={`${id}-title`}>{title}</h3>
              <p className={styles.description}>{body}</p>
              <Link href={href} prefetch={false} className={styles.detailLink}>{link} <ArrowUpRight size={15} aria-hidden /></Link>
            </div>

            <figure className={styles.frame} aria-hidden="true">
              <figcaption className={styles.frameHeader}>
                <span><Plus size={13} /> {label}</span>
                <span>Illustrative preview</span>
              </figcaption>
              <div className={styles.diagram}>
                <div className={styles.orbit}>
                  <svg viewBox="0 0 180 180" className={styles.orbitLines} fill="none">
                    <circle cx="90" cy="90" r="74" className={styles.orbitOuter} />
                    <circle cx="90" cy="90" r="55" className={styles.orbitInner} />
                    <path d="M90 5v23m0 124v23M5 90h23m124 0h23" />
                    <circle cx="90" cy="16" r="3" className={styles.orbitDot} />
                  </svg>
                  <span className={styles.stageIcon}>
                    <svg viewBox="0 0 52 52" fill="none"><path pathLength={1} d={illustrations[name]} /></svg>
                  </span>
                </div>
                <ol className={styles.signals}>
                  {signals.map(([event, status], signal) => (
                    <li key={event} style={{ "--signal": signal } as CSSProperties}>
                      <span>{signal === signals.length - 1 ? <Check size={13} /> : <Circle size={8} />} {event}</span>
                      <small>{status}</small>
                    </li>
                  ))}
                </ol>
              </div>
            </figure>
          </div>
        </section>
      ))}
    </div>
  );
}
