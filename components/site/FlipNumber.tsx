"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * A price that rolls to its new value like a counter: each digit sits on a
 * strip of 0–9 and slides to the new figure; separators and new digits fade
 * in from the right so "$99" → "$2,670" reads as one motion. Slots are keyed
 * from the right so the ones, tens and hundreds keep their identity as the
 * number grows. The whole value is exposed to assistive tech as one label.
 */
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function FlipNumber({ value, className }: { value: string; className?: string }) {
  const still = useReducedMotion();
  // The currency symbol never moves; only the figure after it animates.
  const prefix = value.match(/^[^\d]*/)?.[0] ?? "";
  const chars = value.slice(prefix.length).split("");
  return (
    <span className={className} role="text" aria-label={value}>
      <span className="inline-flex overflow-hidden align-baseline" aria-hidden>
        {prefix ? <span className="inline-block">{prefix}</span> : null}
        <AnimatePresence initial={false} mode="popLayout">
          {chars.map((ch, i) => {
            const key = chars.length - i; // position from the right
            return (
              <motion.span key={key} layout="position" initial={still ? false : { opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.25 }} className="inline-block overflow-hidden">
                {/\d/.test(ch) ? <Digit digit={Number(ch)} still={!!still} /> : <span className="inline-block">{ch}</span>}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </span>
    </span>
  );
}

function Digit({ digit, still }: { digit: number; still: boolean }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none tabular-nums">
      <motion.span
        className="absolute left-0 top-0 flex flex-col items-center"
        initial={false}
        animate={{ y: `-${digit}em` }}
        transition={still ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22, mass: 0.8 }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] leading-none">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
