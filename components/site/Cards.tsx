"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";
import { motion, type Variants } from "framer-motion";

/**
 * Every row of cards on the site: the row staggers its cards in as it
 * scrolls into view, each card rises a touch and floats on hover. Below
 * `md` the row scrolls sideways with snap points instead of stacking, so a
 * phone sees one card at a time; from `md` up it is the grid the caller
 * asks for (`md:grid-cols-3`, ...).
 */
const rowVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const lift = { type: "spring", stiffness: 300, damping: 24 } as const;

export function CardRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={rowVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className={clsx("scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 md:pt-0", className)}
    >
      {children}
    </motion.div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={cardVariants} whileHover={{ y: -6 }} transition={lift} className={clsx("w-[82%] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink", className)}>
      {children}
    </motion.div>
  );
}
