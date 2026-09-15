"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Orb, type AgentState } from "@/components/ui/orb";

export type VirtueOrbSize = "xs" | "sm" | "md" | "lg" | "xl";
/** `working` and `done` are kept for existing callers; they map onto the agent states. */
export type VirtueOrbState = "idle" | "thinking" | "listening" | "talking" | "working" | "done";

const px: Record<VirtueOrbSize, number> = { xs: 16, sm: 24, md: 56, lg: 120, xl: 200 };
const agentFor: Record<VirtueOrbState, AgentState> = { idle: null, done: null, thinking: "thinking", working: "thinking", listening: "listening", talking: "talking" };

/**
 * Virtue's visual: the shader orb (components/ui/orb.tsx), always green.
 * `talking` is what VirtueSpeech sets while words stream; `thinking` while
 * something is being worked out; idle otherwise. Renders a single WebGL
 * canvas per instance; under prefers-reduced-motion it draws one still frame.
 * Renders a <div> (the canvas needs block children), so never place it inside a <p>.
 */
export function VirtueOrb({ size = "md", state = "idle", label = "Virtue", className, seed = 7 }: { size?: VirtueOrbSize; state?: VirtueOrbState; label?: string; className?: string; seed?: number }) {
  const d = px[size];
  const still = useReducedMotion();
  return (
    <div
      className={clsx("virtue-orb relative inline-block shrink-0 overflow-hidden rounded-full align-middle", className)}
      style={{ width: d, height: d, boxShadow: size === "sm" || size === "xs" ? undefined : `0 0 ${Math.round(d * 0.35)}px color-mix(in srgb, var(--accent) 35%, transparent)` }}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-state={state}
    >
      <Orb agentState={agentFor[state]} seed={seed} still={still} className="absolute inset-0" />
    </div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}
