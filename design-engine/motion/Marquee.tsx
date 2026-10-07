"use client";

import { useMotionPolicy } from "./MotionPolicy";

import { useRef, type CSSProperties } from "react";
import { useInView } from "framer-motion";

/** Text-only items avoid duplicate interactive controls in the repeated visual track. */
export function Marquee({ items, duration = 24, className = "" }: {
  items: readonly string[];
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.1 });
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const moving = visible && !reduced && items.length > 1;
  return <div ref={ref} className={`de-marquee ${moving ? "de-marquee--playing" : ""} ${reduced ? "de-marquee--still" : ""} ${className}`} style={{ "--de-marquee-duration": `${Math.max(duration, 8) / policy.distance}s` } as CSSProperties}>
    <div className="de-marquee__track">
      <div className="de-marquee__group">{items.map((item, index) => <span key={`${index}-${item}`}>{item}</span>)}</div>
      {!reduced && items.length > 1 ? <div className="de-marquee__group" aria-hidden="true">{items.map((item, index) => <span key={`${index}-${item}`}>{item}</span>)}</div> : null}
    </div>
  </div>;
}
