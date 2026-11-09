"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleDot, Layers3 } from "lucide-react";
import { ProcessHeading } from "./ProcessHeading";
import { ProcessObject } from "./ProcessObjects";
import { journeyStages } from "./journey-stages";
import styles from "./client-journey.module.css";

export function ClientJourney() {
  const id = useId();
  const [active, setActive] = useState(0);
  const step = journeyStages[active];

  return (
    <section id="how-it-works" className={styles.journey} aria-labelledby={`${id}-heading`}>
      <div className={styles.wrap}>
        <div className={styles.intro}>
          <div>
            <p className={styles.kicker}><Layers3 size={14} aria-hidden /> The Vigil process</p>
            <h2 id={`${id}-heading`}>The launch is<br className={styles.wideBreak} /> <em>the beginning.</em></h2>
          </div>
          <p>We build your website, then help you run what happens on it. Follow the path from your first brief to your first inquiry, booking, and update.</p>
        </div>
        <ol className={styles.stops} aria-label="Explore each stage">
          {journeyStages.map(({ name, icon: Icon }, index) => (
            <li key={name}>
              <button type="button" aria-pressed={active === index} aria-controls={`${id}-detail`} onClick={() => setActive(index)}>
                <span className={styles.number}>0{index + 1}</span>
                <Icon size={17} aria-hidden />
                <span>{name}</span>
              </button>
            </li>
          ))}
        </ol>
        <div id={`${id}-detail`} className={styles.detail} aria-live="polite">
          <div key={step.name} className={styles.detailCopy}>
            <p className={styles.kicker}><CircleDot size={13} aria-hidden /> {step.label}</p>
            <ProcessHeading title={step.title} active />
            <p>{step.body}</p>
            <Link href={step.href}>{step.link} <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <ProcessObject key={step.name} stage={step.name} active />
        </div>
      </div>
    </section>
  );
}
