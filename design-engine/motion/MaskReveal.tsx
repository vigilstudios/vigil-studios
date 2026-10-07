"use client";

import { useMotionPolicy } from "./MotionPolicy";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

export function MaskReveal({ children, direction = "left", duration = 0.7, className = "" }: {
  children: ReactNode;
  direction?: "left" | "right" | "bottom";
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.2 });
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const concealed = direction === "left" ? "inset(0 100% 0 0)" : direction === "right" ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)";
  return <div ref={ref} className={className}><motion.div
    initial={reduced ? false : { clipPath: concealed }}
    animate={{ clipPath: reduced || visible ? "inset(0% 0% 0% 0%)" : concealed }}
    transition={{ duration: reduced ? 0 : duration * policy.duration, ease: [0.22, 1, 0.36, 1] }}
  >{children}</motion.div></div>;
}
