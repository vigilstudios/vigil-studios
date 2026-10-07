"use client";

import { useMotionPolicy } from "./MotionPolicy";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function FadeReveal({ children, distance = 20, duration = 0.55, className = "" }: {
  children: ReactNode;
  distance?: number;
  duration?: number;
  className?: string;
}) {
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: distance * policy.distance }}
      animate={reduced ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduced ? 0 : duration * policy.duration, ease: "easeOut" }}
    >{children}</motion.div>
  );
}
