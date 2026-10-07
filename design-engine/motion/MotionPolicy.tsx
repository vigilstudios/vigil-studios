"use client";
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { MotionDirection } from "../foundations/art-direction";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const reducedMotionSnapshot = () => window.matchMedia(reducedMotionQuery).matches;
// The same initial value on server and hydration avoids different inspector markup.
const serverMotionSnapshot = () => false;
const MotionPolicy = createContext<MotionDirection | undefined>(undefined);
export function MotionPolicyProvider({ mode, children }: { mode?: MotionDirection; children: ReactNode }) {
  return <MotionPolicy.Provider value={mode}>{children}</MotionPolicy.Provider>;
}
export function useMotionPolicy() {
  const mode = useContext(MotionPolicy);
  const reduced = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, serverMotionSnapshot);
  return { systemReduced: reduced, reduced: Boolean(reduced || mode === "none"), distance: mode === "restrained" ? .35 : mode === "expressive" ? 1.3 : 1, duration: mode === "restrained" ? .8 : mode === "expressive" ? 1.15 : 1 };
}
