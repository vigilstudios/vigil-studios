"use client";

import { useMotionPolicy } from "./MotionPolicy";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function StaggerReveal({ children, interval = 0.12, className = "" }: {
  children: ReactNode;
  interval?: number;
  className?: string;
}) {
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate={reduced ? "visible" : undefined}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ visible: { transition: { staggerChildren: reduced ? 0 : interval * policy.duration } } }}
    >{children}</motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduced ? {} : { opacity: 0, y: 14 * policy.distance },
        visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.42 * policy.duration } },
      }}
    >{children}</motion.div>
  );
}
