"use client";

import { useMotionPolicy } from "./MotionPolicy";

import type { PointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function MagneticInteraction({ children, strength = 0.2, className = "" }: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 20 });
  const springY = useSpring(y, { stiffness: 220, damping: 20 });
  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const force = Math.min(Math.max(strength * policy.distance, 0), .4);
    x.set(Math.max(-18, Math.min(18, (event.clientX - rect.left - rect.width / 2) * force)));
    y.set(Math.max(-18, Math.min(18, (event.clientY - rect.top - rect.height / 2) * force)));
  }
  function reset() { x.set(0); y.set(0); }
  return <motion.div className={`de-motion-pointer ${className}`} style={{ x: reduced ? 0 : springX, y: reduced ? 0 : springY }} onPointerMove={move} onPointerLeave={reset}>{children}</motion.div>;
}

export function DepthShift({ children, maxDegrees = 5, className = "" }: {
  children: ReactNode;
  maxDegrees?: number;
  className?: string;
}) {
  const policy = useMotionPolicy();
  const reduced = policy.reduced;
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 22 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 22 });
  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const amount = Math.min(Math.max(maxDegrees * policy.distance, 0), 10);
    rotateX.set(((rect.height / 2 - (event.clientY - rect.top)) / (rect.height / 2)) * amount);
    rotateY.set((((event.clientX - rect.left) - rect.width / 2) / (rect.width / 2)) * amount);
  }
  function reset() { rotateX.set(0); rotateY.set(0); }
  return <div className={`de-motion-depth ${className}`} onPointerMove={move} onPointerLeave={reset}>
    <motion.div style={{ rotateX: reduced ? 0 : springX, rotateY: reduced ? 0 : springY }}>{children}</motion.div>
  </div>;
}
