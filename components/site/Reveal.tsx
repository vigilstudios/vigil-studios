"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

/**
 * Quiet transition-in for marketing content: fade and a short rise as the
 * element scrolls into view, once. A group staggers its items. Motion is
 * gentle and never bouncy, matching the product.
 */
const EASE = [0.22, 1, 0.36, 1] as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const viewport = { once: true, amount: 0.2 } as const;

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={revealVariants} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  );
}

/** Staggers its RevealItem children as the group enters the viewport. */
export function RevealGroup({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "ul" | "ol" }) {
  const Tag = as === "ul" ? motion.ul : as === "ol" ? motion.ol : motion.div;
  return (
    <Tag initial="hidden" whileInView="visible" viewport={viewport} variants={groupVariants} className={className}>
      {children}
    </Tag>
  );
}

export function RevealItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag variants={revealVariants} className={className}>
      {children}
    </Tag>
  );
}
