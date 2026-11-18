"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, MoveUpRight } from "lucide-react";
import { journeyStages } from "./journey-stages";
import { StudioStoryVisual } from "./StudioStoryVisual";
import styles from "./process-journey.module.css";

const details = [
  ["Tell us what makes you, you.", "Choose your website and plan, then share your brief through guided setup.", "We give your vision a home.", "We build around your brand and send a preview for your review."],
  ["Give it your final yes.", "Review your preview and connect your domain with our help.", "We handle the launch.", "Publishing, managed hosting, SSL, and ongoing platform maintenance."],
  ["Pick up the conversation.", "Read new inquiries, reply, add notes, and decide what happens next.", "We bring the context together.", "Your connected contact form sends inquiries into Lead Hub."],
  ["Make room for your customers.", "Set your availability and manage appointments or table reservations.", "We connect the next step.", "Bookings setup is available on compatible Care-and-higher sites."],
  ["Show what makes it special.", "Keep product images, descriptions, categories, and price labels up to date.", "We help you find the right setup.", "Products Lite and Commerce Pro eligibility follows your website and plan."],
  ["Keep looking ahead.", "See your connected activity, share your goals, and tell us what needs to change.", "We learn your business.", "Ongoing support and connected tools grow with your setup and plan."],
];

export function ProcessJourney() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActive(Number((entry.target as HTMLElement).dataset.step));
          (entry.target as HTMLElement).dataset.seen = "true";
        }
      });
    }, { root: document.getElementById("site-root"), rootMargin: "-20% 0px -35% 0px", threshold: 0 });
    root.current?.querySelectorAll("[data-step]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return <div ref={root} className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span /> THE VIGIL WAY</p>
        <h1>A beginning.<br />A bigger <em>picture.</em></h1>
        <p className={styles.lead}>It starts with your website. It grows into a connected business—with people who know where you want to go.</p>
        <a href="#how-it-works" className={styles.begin}>Follow the journey <ArrowDown size={17} aria-hidden /></a>
        <p className={styles.heroFoot}>YOUR VISION <span>→</span> OUR CRAFT <span>→</span> WHAT’S NEXT</p>
      </div>
      <div className={styles.map}>
        <div className={styles.mapTitle}><span>ONE BUSINESS. ALL CONNECTED.</span><span className={styles.logo} role="img" aria-label="Vigil" /></div>
        {journeyStages.map(({ name, id, icon: Icon }, i) => <a key={id} href={`#${id}`} className={styles.mapRow} style={{ animationDelay: `${i * 80}ms` }}><span>0{i + 1}</span><Icon size={21} aria-hidden /><b>{name === "Improve" ? "Grow together" : name}</b><MoveUpRight size={17} aria-hidden /></a>)}
        <p>Your website is the first chapter.</p>
      </div>
    </header>
    <nav className={styles.navigation} aria-label="Your Vigil journey">
      <span className={styles.navLabel}>THE JOURNEY <b>0{active + 1} / 06</b></span>
      <ol>{journeyStages.map(({ name, id }, i) => <li key={id}><a href={`#${id}`} aria-current={active === i ? "step" : undefined}><span>0{i + 1}</span>{name === "Improve" ? "Grow" : name}</a></li>)}</ol>
    </nav>
    <div className={styles.chapters}>
      {journeyStages.map(({ id, name, title, accent, body, href, link, icon: Icon }, i) => <section key={id} id={id} data-step={i} className={styles.chapter} aria-labelledby={`${id}-title`}>
        <div className={styles.chapterTop}><span><Icon size={16} aria-hidden /> {i < 2 ? "01 / YOUR FOUNDATION" : i < 5 ? "02 / YOUR EVERYDAY" : "03 / YOUR NEXT CHAPTER"}</span><span>0{i + 1} — 06</span></div>
        <div className={styles.scene}>
          <div className={styles.copy}><p className={styles.eyebrow}>{name === "Improve" ? "A partnership that keeps going" : name}</p><h2 id={`${id}-title`}>{title}<span>{accent}</span></h2><p className={styles.body}>{body}</p><Link href={href} className={styles.textLink}>{link}<ArrowUpRight size={16} aria-hidden /></Link></div>
          <StudioStoryVisual stage={name} active={active === i} />
        </div>
        <div className={styles.handoff}><div><span>YOUR PART</span><h3>{details[i][0]}</h3><p>{details[i][1]}</p></div><ArrowUpRight className={styles.handoffArrow} size={26} aria-hidden /><div><span>OUR PART</span><h3>{details[i][2]}</h3><p>{details[i][3]}</p></div></div>
      </section>)}
    </div>
    <div className={styles.coda}><span>BUILT AROUND YOU</span><p>Your business moves forward.<br /><em>We move with you.</em></p></div>
  </div>;
}
