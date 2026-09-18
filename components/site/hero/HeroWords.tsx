"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { PHASE, rng, subscribeStory, Typer } from "@/components/site/story/progress";

/**
 * The hero's words. The title and the line type in on load (30 ms and
 * 12 ms a character, a green caret while they move), then the buttons
 * fade in. As the visitor scrolls into the story the line untypes, then
 * the title, and the buttons fade out. The full text is in the server
 * HTML for crawlers, hidden until the typewriter takes over.
 */
export function HeroWords({ title, line, children }: { title: string; line: string; children: ReactNode }) {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h1El = h1Ref.current, lineEl = lineRef.current, cta = ctaRef.current;
    if (!h1El || !lineEl || !cta) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const h1 = new Typer(h1El), sub = new Typer(lineEl);
    const T_H1 = 30, T_SUB = 12, T_GAP = 250;
    const total = h1.full.length * T_H1 + T_GAP + sub.full.length * T_SUB;
    const start = performance.now() + 450;
    let typed = 0, raf = 0, exiting = false;
    const typeIn = (now: number) => {
      raf = 0;
      if (reduced) { h1.set(h1.full.length, false); sub.set(sub.full.length, false); cta.style.opacity = "1"; typed = 1; return; }
      const ms = now - start;
      const n1 = ms / T_H1, done1 = n1 >= h1.full.length;
      h1.set(n1, !done1);
      const n2 = (ms - h1.full.length * T_H1 - T_GAP) / T_SUB, done2 = n2 >= sub.full.length;
      sub.set(done1 ? n2 : 0, done1 && !done2);
      if (done2) cta.style.opacity = "1";
      typed = Math.min(1, ms / total);
      if (typed < 1 && !exiting) raf = requestAnimationFrame(typeIn);
    };
    raf = requestAnimationFrame(typeIn);
    const unsubscribe = subscribeStory((p) => {
      const u = rng(p, PHASE.untype[0], PHASE.untype[1]);
      if (u === 0) { if (exiting) { exiting = false; if (typed < 1) raf = raf || requestAnimationFrame(typeIn); else { h1.set(h1.full.length, false); sub.set(sub.full.length, false); cta.style.opacity = "1"; } } return; }
      exiting = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      const subU = rng(u, 0, 0.45), h1U = rng(u, 0.35, 1);
      sub.set(sub.full.length * (1 - subU), subU > 0 && subU < 1);
      h1.set(h1.full.length * (1 - h1U), h1U > 0 && h1U < 1);
      cta.style.opacity = String(1 - rng(u, 0, 0.3));
    });
    return () => { cancelAnimationFrame(raf); unsubscribe(); };
  }, []);

  return (
    <>
      <h1 ref={h1Ref} data-text={title} className="story-typing-pending mx-auto min-h-[1.1em] max-w-4xl font-[family-name:var(--font-space-grotesk)] text-[clamp(26px,3.1vw,44px)] font-medium leading-[1.08] tracking-[-0.02em] text-balance">
        {title}
      </h1>
      <p ref={lineRef} data-text={line} className="story-typing-pending mt-4 min-h-[1.2em] font-mono text-[10.5px] uppercase tracking-[0.16em] text-[rgba(245,245,243,0.55)]">
        {line}
      </p>
      <div ref={ctaRef} className="mt-5 flex flex-row items-center justify-center gap-2.5 opacity-0 transition-opacity duration-500">
        {children}
      </div>
    </>
  );
}
