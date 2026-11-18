"use client";

import { useId, type PointerEvent } from "react";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Globe2, LockKeyhole, Mail, MousePointer2, Plus } from "lucide-react";
import type { journeyStages } from "./journey-stages";
import styles from "./studio-story-visual.module.css";

type Stage = (typeof journeyStages)[number]["name"];

/** A deliberately fictional studio keeps these product illustrations separate from client proof. */
function BrandMark() {
  return <span className={styles.brandMark} />;
}

function Architecture() {
  const id = useId();
  return (
    <svg viewBox="0 0 440 420" fill="none" className={styles.architecture}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="70" y1="40" x2="390" y2="380" gradientUnits="userSpaceOnUse"><stop stopColor="#e8e4d8" /><stop offset="1" stopColor="#aaa99a" /></linearGradient>
        <linearGradient id={`${id}-inside`} x1="170" y1="100" x2="300" y2="370" gradientUnits="userSpaceOnUse"><stop stopColor="#11392e" /><stop offset="1" stopColor="#5a7e65" /></linearGradient>
        <linearGradient id={`${id}-edge`} x1="220" y1="170" x2="360" y2="290" gradientUnits="userSpaceOnUse"><stop stopColor="#9a9f8e" /><stop offset="1" stopColor="#d8d9c7" /></linearGradient>
        <linearGradient id={`${id}-floor`} x1="220" y1="310" x2="300" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="#d0d1bb" /><stop offset="1" stopColor="#f4efdf" /></linearGradient>
      </defs>
      <path fill={`url(#${id}-wall)`} d="M0 0h440v420H0z" />
      <path fill={`url(#${id}-inside)`} d="M107 420V175a113 113 0 0 1 226 0v245Z" />
      <path fill={`url(#${id}-edge)`} d="M220 62a113 113 0 0 1 113 113v245h-24V175a89 89 0 0 0-89-89Z" />
      <path fill="#234c3e" d="M150 420V196a70 70 0 0 1 140 0v224Z" />
      <path fill="#70856a" d="M177 420V217a43 43 0 0 1 86 0v203Z" />
      <path fill="#153c30" d="M192 420V226a28 28 0 0 1 56 0v194Z" />
      <path fill={`url(#${id}-floor)`} d="m0 420 192-110h56l192 110Z" />
      <path fill="#f9f4dc" fillOpacity=".3" d="m248 310 136 110h-73l-91-110Z" />
      <path stroke="#fff" strokeOpacity=".18" d="M28 0v420M402 0v420M0 30h440" />
      <circle cx="355" cy="81" r="28" fill="#faf7e9" fillOpacity=".4" />
    </svg>
  );
}

function Website({ live = false }: { live?: boolean }) {
  return (
    <div className={styles.website}>
      <div className={styles.browserBar}><span className={styles.dots}><i /><i /><i /></span><span><LockKeyhole /> northline.studio</span><Plus /></div>
      <div className={styles.siteNav}><b>NORTHLINE<span>®</span></b><span>Spaces for living. <ArrowUpRight /></span></div>
      <div className={styles.siteHero}>
        <div className={styles.siteWords}><span>ARCHITECTURE & INTERIORS</span><strong>Room for<br /><em>possibility.</em></strong><p>Thoughtfully designed.<br />Beautifully lived.</p><span className={styles.siteButton}>Discover our work <ArrowUpRight /></span></div>
        <div className={styles.siteImage}><Architecture /><span>FORM / FUNCTION / FEELING</span></div>
      </div>
      <div className={styles.siteBottom}><span>Spaces with a point of view.</span><span>EST. 2026 {live ? <i /> : <ArrowUpRight />}</span></div>
    </div>
  );
}

function BuildVisual() {
  return <>
    <div className={styles.colorStudy}><span>THE CREATIVE DIRECTION</span><div><i /><i /><i /><i /></div><b>Aa<span>Form follows feeling.</span></b></div>
    <div className={styles.buildSite}><Website /></div>
    <div className={styles.designNote}><span className={styles.noteIcon}><MousePointer2 /></span><div><b>Every detail. Yours.</b><span>Identity → digital experience</span></div></div>
    <div className={styles.dimension}><span /> DESIGNED AROUND YOU <span /></div>
  </>;
}

function LaunchVisual() {
  return <>
    <div className={styles.launchSite}><Website live /></div>
    <div className={styles.domain}><Globe2 /><span>northline.studio</span><span className={styles.live}><i /> Live</span></div>
    <div className={styles.launchNote}><span className={styles.checkIcon}><Check /></span><div><b>And just like that, you’re open.</b><span>Your domain. Your presence.</span></div></div>
    <div className={styles.serviceLine}><LockKeyhole /> SSL secured <span /> Managed hosting <span /> Looked after</div>
  </>;
}

function RespondVisual() {
  return <>
    <div className={styles.incoming}><span className={styles.noteIcon}><Mail /></span><div><b>A new conversation starts.</b><span>Website inquiry · just now</span></div><i /></div>
    <div className={styles.inbox}>
      <div className={styles.appHeader}><BrandMark /><b>Lead Hub</b><span>YOUR CONVERSATIONS</span></div>
      <div className={styles.messageTop}><span className={styles.avatar}>JL</span><div><b>Jordan Lee</b><span>From your website</span></div><span className={styles.tag}>New inquiry</span></div>
      <div className={styles.messageBody}><span>A SPACE TO CALL OUR OWN</span><h4>“We have a vision.<br />Can you help bring it to life?”</h4><p>We’d love to talk about our new space.<br />When would be a good time to connect?</p></div>
      <div className={styles.reply}><span>Hi Jordan, we’d love to hear more…</span><span><ArrowUpRight /></span></div>
    </div>
    <div className={styles.pipeline}><span><i /> Received</span><span /><b><Check /> Ready for your reply</b></div>
  </>;
}

const days = Array.from({ length: 28 }, (_, i) => i + 1);
function BookVisual() {
  return <>
    <div className={styles.calendar}>
      <div className={styles.appHeader}><BrandMark /><b>Bookings</b><span>MAKE TIME FOR WHAT MATTERS</span></div>
      <div className={styles.calendarTitle}><div><span>YOUR AVAILABILITY</span><h4>A little room<br />for a big idea.</h4></div><span className={styles.month}>NOV<br /><b>18</b></span></div>
      <div className={styles.monthRow}><b>November</b><span><ChevronLeft /><ChevronRight /></span></div>
      <div className={styles.days}>{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}{days.map(d => <b key={d} data-selected={d === 18} data-muted={d < 16}>{d}</b>)}</div>
    </div>
    <div className={styles.appointment}><span className={styles.checkIcon}><Check /></span><span>YOU’RE IN THE CALENDAR</span><h4>Let’s talk<br />possibilities.</h4><p>Discovery call</p><div><b>18</b><span>November<br />10:30 – 11:00 am</span></div><span className={styles.confirmed}><i /> Confirmed</span></div>
  </>;
}

function ProductsVisual() {
  return <>
    <div className={styles.catalog}>
      <div className={styles.appHeader}><BrandMark /><b>Products</b><span>YOUR COLLECTION, CONNECTED</span></div>
      <div className={styles.catalogTitle}><span>THE NORTHLINE COLLECTION</span><h4>Objects with<br /><em>a point of view.</em></h4><span className={styles.tag}>Product catalog</span></div>
      <div className={styles.productGrid}>
        <div className={styles.product}><div className={styles.productImage}><span className={styles.vase} /></div><span>01 / CERAMICS</span><b>The Arc vessel</b><small>Form meets feeling.</small></div>
        <div className={styles.product}><div className={styles.productImage}><span className={styles.lamp}><i /></span></div><span>02 / LIGHTING</span><b>The Dune lamp</b><small>A softer kind of light.</small></div>
      </div>
      <div className={styles.catalogFooter}><span>Listings · imagery · details</span><span>Made for discovery <ArrowUpRight /></span></div>
    </div>
    <div className={styles.productNote}><span className={styles.checkIcon}><Check /></span><div><b>Your collection. Beautifully presented.</b><span>Every product has a story.</span></div></div>
  </>;
}

function ImproveVisual() {
  const id = useId();
  return <>
    <div className={styles.overview}>
      <div className={styles.appHeader}><BrandMark /><b>Overview</b><span>THE BIGGER PICTURE</span></div>
      <div className={styles.overviewTitle}><span>YOUR BUSINESS, IN VIEW</span><h4>Keep moving<br /><em>forward.</em></h4><span className={styles.tag}><i /> Connected</span></div>
      <div className={styles.chart}>
        <div><span>CONNECTED ACTIVITY</span><span>Illustrative trend</span></div>
        <svg viewBox="0 0 440 145" fill="none" preserveAspectRatio="none"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--green)" stopOpacity=".24" /><stop offset="1" stopColor="var(--green)" stopOpacity="0" /></linearGradient></defs><path d="M0 35h440M0 80h440M0 125h440" stroke="currentColor" strokeOpacity=".1" /><path className={styles.chartArea} d="M0 128C35 128 40 95 70 104S110 125 145 85S180 115 220 70S265 85 300 48S345 70 380 32S410 36 440 12V145H0Z" fill={`url(#${id})`} /><path className={styles.chartLine} pathLength="1" d="M0 128C35 128 40 95 70 104S110 125 145 85S180 115 220 70S265 85 300 48S345 70 380 32S410 36 440 12" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" /></svg>
        <div><span>THEN</span><span>WHAT’S NEXT →</span></div>
      </div>
      <div className={styles.overviewFooter}><span><i /> Customers</span><span>Bookings</span><span>Products <ArrowUpRight /></span></div>
    </div>
    <div className={styles.careNote}><span className={styles.checkIcon}><Check /></span><div><b>We know your business.</b><span>Your goals. Your customers. Your next chapter.</span></div></div>
  </>;
}

const visuals = { Build: BuildVisual, Launch: LaunchVisual, Respond: RespondVisual, Book: BookVisual, Products: ProductsVisual, Improve: ImproveVisual };

export function StudioStoryVisual({ stage, active }: { stage: Stage; active: boolean }) {
  const Visual = visuals[stage];
  // Update only CSS variables: pointer movement does not trigger React renders.
  function move(event: PointerEvent<HTMLElement>) {
    if (!active || event.pointerType === "touch" || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    event.currentTarget.style.setProperty("--pointer-x", `${x * 5}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${y * 4}px`);
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 2}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 2.5}deg`);
  }
  function reset(event: PointerEvent<HTMLElement>) {
    for (const name of ["--pointer-x", "--pointer-y", "--tilt-x", "--tilt-y"]) event.currentTarget.style.removeProperty(name);
  }
  return (
    <figure className={styles.figure} data-stage={stage} data-active={active} onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset} aria-hidden="true">
      <div className={styles.halo} />
      <div className={styles.motion}><div className={styles.canvas}><Visual /></div></div>
      <figcaption>THE VIGIL EXPERIENCE <span>Illustrative view</span></figcaption>
    </figure>
  );
}
