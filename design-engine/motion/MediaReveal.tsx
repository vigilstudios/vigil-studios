"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { useMotionPolicy } from "./MotionPolicy";

export function MediaReveal({
  children,
  duration = 0.75,
  fromX = 0,
  className = "",
}: {
  children: ReactNode;
  duration?: number;
  fromX?: number;
  className?: string;
}) {
  const policy = useMotionPolicy();
  const ref = useRef<HTMLDivElement>(null);
  // Observe the unclipped box: a completely clipped target has no visible intersection.
  const visible = useInView(ref, { once: true, amount: 0.2 });
  const hidden = {
    clipPath: "inset(0% 100% 0% 0%)",
    opacity: 0.7,
    x: fromX * policy.distance,
  };
  const shown = { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, x: 0 };
  return (
    <div ref={ref} className={`de-motion-media ${className}`}>
      {/* Replace the animated DOM when policy changes, cancelling an in-flight clip immediately. */}
      {policy.reduced ? (
        <div className="de-motion-media__surface">{children}</div>
      ) : (
        <motion.div
          className="de-motion-media__surface"
          initial={hidden}
          animate={visible ? shown : hidden}
          transition={{
            duration: duration * policy.duration,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
