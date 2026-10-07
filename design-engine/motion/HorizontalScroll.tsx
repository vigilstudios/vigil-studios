"use client";

import { useMotionPolicy } from "./MotionPolicy";

import { useRef, type ReactNode } from "react";
import { VigilIcon } from "../icons/VigilIcon";

export function HorizontalScroll({ children, label, className = "" }: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  function move(direction: -1 | 1) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * .8, behavior: reduced ? "instant" : "smooth" });
  }
  return <div className={`de-horizontal-scroll ${className}`}>
    <div className="de-horizontal-scroll__controls">
      <button type="button" aria-label={`Scroll ${label} left`} onClick={() => move(-1)}><VigilIcon name="arrow-left" decorative /></button>
      <button type="button" aria-label={`Scroll ${label} right`} onClick={() => move(1)}><VigilIcon name="arrow-right" decorative /></button>
    </div>
    <div ref={track} className="de-horizontal-scroll__track" role="region" aria-label={label} tabIndex={0}>{children}</div>
  </div>;
}
