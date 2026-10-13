"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { clsx } from "clsx";

// Existing fades, viewport thresholds, staggers, springs and menu transitions.
// This module loads on viewport approach or input intent, rather than at the hero.
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

export function Reveal({
  children,
  className,
  hostRef,
  delay = 0,
}: {
  children: ReactNode;
  hostRef?: (node: HTMLElement | null) => void;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      ref={hostRef}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={revealVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggers its RevealItem children as the group enters the viewport. */
export function RevealGroup({
  children,
  className,
  hostRef,
  as = "div",
}: {
  children: ReactNode;
  hostRef?: (node: HTMLElement | null) => void;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  const Tag = as === "ul" ? motion.ul : as === "ol" ? motion.ol : motion.div;
  return (
    <Tag
      ref={hostRef}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={groupVariants}
      className={className}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag variants={revealVariants} className={className}>
      {children}
    </Tag>
  );
}

const rowVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const lift = { type: "spring", stiffness: 300, damping: 24 } as const;

export function CardRow({
  children,
  className,
  hostRef,
}: {
  children: ReactNode;
  hostRef?: (node: HTMLElement | null) => void;
  className?: string;
}) {
  return (
    <motion.div
      ref={hostRef}
      variants={rowVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className={clsx(
        "scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 md:pt-0",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function Card({
  children,
  className,
  hostRef,
}: {
  children: ReactNode;
  hostRef?: (node: HTMLElement | null) => void;
  className?: string;
}) {
  return (
    <motion.div
      ref={hostRef}
      variants={cardVariants}
      whileHover={{ y: -6 }}
      transition={lift}
      className={clsx(
        "w-[82%] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function MobileMenuPanel({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden border-b border-[color:var(--border)] bg-[color:var(--bg-secondary)] md:hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ProductsMenuPanel({
  open,
  id,
  children,
}: {
  open: boolean;
  id: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id={id}
          role="menu"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
