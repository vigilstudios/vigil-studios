"use client";

import { useEffect, useRef } from "react";
import { PHASE, rng, subscribeStory } from "@/components/site/story/progress";

/** The bobbing "Scroll ↓" under the hero's words; it fades as the story begins. */
export function HeroScrollHint() {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return subscribeStory((p) => {
      el.style.opacity = String(1 - rng(rng(p, PHASE.untype[0], PHASE.untype[1]), 0, 0.35));
    });
  }, []);
  return (
    <p ref={ref} className="hero-bob absolute bottom-[22px] left-1/2 z-[5] font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(245,245,243,0.55)]" aria-hidden>
      Scroll ↓
    </p>
  );
}
