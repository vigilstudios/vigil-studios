"use client";

import { useMotionPolicy } from "./MotionPolicy";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function Parallax({ children, distance = 36, className = "" }: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const amount = Math.min(Math.max(distance * policy.distance, 0), 120);
  const y = useTransform(scrollYProgress, [0, 1], [-amount, amount]);
  return <div ref={ref} className={`de-motion-scroll ${className}`}><motion.div className="de-motion-parallax" style={{ y: reduced ? 0 : y }}>{children}</motion.div></div>;
}

export function ScrollScale({ children, from = 0.94, className = "" }: {
  children: ReactNode;
  from?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1 - (1 - Math.min(Math.max(from, .8), 1)) * policy.distance, 1]);
  return <div ref={ref} className={`de-motion-scroll ${className}`}><motion.div className="de-motion-scale" style={{ scale: reduced ? 1 : scale }}>{children}</motion.div></div>;
}

export function StickyScroll({ children, label = "Scroll story", showProgress = true, className = "" }: {
  children: ReactNode;
  label?: string;
  showProgress?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return <div ref={ref} className={`de-sticky-scroll ${reduced ? "de-sticky-scroll--still" : ""} ${className}`} aria-label={label}>
    <div className="de-sticky-scroll__inner">
      {children}
      {showProgress ? <motion.div className="de-sticky-scroll__progress" aria-hidden="true" style={{ scaleX: reduced ? 1 : scrollYProgress }} /> : null}
    </div>
  </div>;
}
