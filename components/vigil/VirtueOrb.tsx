"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import type { AgentState } from "@/components/ui/orb";

const Orb = dynamic(() => import("@/components/ui/orb").then((mod) => mod.Orb), { ssr: false });

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
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // Preload before the orb arrives, then retain its context and pause its render
    // loop outside the viewport. Opacity/overflow alone never stops WebGL work.
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); preload.disconnect(); }
    }, { rootMargin: "300px" });
    const viewport = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    preload.observe(el); viewport.observe(el);
    const visibility = () => setTabVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      preload.disconnect(); viewport.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return (
    <div
      ref={host}
      className={clsx("virtue-orb relative inline-block shrink-0 overflow-hidden rounded-full align-middle", className)}
      style={{ width: d, height: d, boxShadow: size === "sm" || size === "xs" ? undefined : `0 0 ${Math.round(d * 0.35)}px color-mix(in srgb, var(--accent) 35%, transparent)` }}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-state={state}
    >
      {ready ? <Orb agentState={agentFor[state]} seed={seed} still={still} active={visible && tabVisible} className="absolute inset-0" /> : null}
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
