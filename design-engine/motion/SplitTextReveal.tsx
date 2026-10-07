"use client";

import { useMotionPolicy } from "./MotionPolicy";

import { motion } from "framer-motion";

/** Text is announced once; individual animated words are hidden from assistive technology. */
export function SplitTextReveal({ text, interval = 0.055, className = "" }: {
  text: string;
  interval?: number;
  className?: string;
}) {
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const words = text.trim().split(/\s+/);
  return <span className={`de-split ${className}`}>
    <span className="de-visually-hidden">{text}</span>
    <motion.span
      className="de-split__visual"
      aria-hidden="true"
      initial={reduced ? false : "hidden"}
      animate={reduced ? "visible" : undefined}
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={{ visible: { transition: { staggerChildren: reduced ? 0 : interval * policy.duration } } }}
    >
      {words.map((word, index) => <motion.span
        key={`${index}-${word}`}
        className="de-split__word"
        variants={{ hidden: reduced ? {} : { opacity: 0, y: `${.55 * policy.distance}em` }, visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : .42 * policy.duration } } }}
      >{word}</motion.span>)}
    </motion.span>
  </span>;
}
