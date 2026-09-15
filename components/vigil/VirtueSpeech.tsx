"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Virtue "speaking": words arrive one after another, like speech, and the
 * caller is told when it starts and stops so the orb can move its mouth.
 * Under prefers-reduced-motion everything shows at once.
 */
export type SpeechLine = { text: string; /** Larger, heavier line (a greeting or a headline). */ emphasis?: boolean };

export function VirtueSpeech({
  lines,
  onStart,
  onDone,
  wordDelay = 55,
  lineDelay = 350,
  startDelay = 250,
  className,
  align = "center",
  size = "hero",
}: {
  lines: SpeechLine[];
  onStart?: () => void;
  onDone?: () => void;
  wordDelay?: number;
  lineDelay?: number;
  startDelay?: number;
  className?: string;
  align?: "center" | "left";
  /** hero: the centred welcome pages; compact: inside the dashboard. */
  size?: "hero" | "compact";
}) {
  const words = lines.map((l) => l.text.split(/\s+/).filter(Boolean));
  const total = words.reduce((n, w) => n + w.length, 0);
  const key = lines.map((l) => l.text).join("\n");
  // Progress is keyed on the text so a new speech starts from zero without an effect-time reset.
  const [progress, setProgress] = useState<{ key: string; shown: number }>({ key, shown: 0 });
  const shown = progress.key === key ? progress.shown : 0;
  const timer = useRef<number | null>(null);
  const onStartRef = useRef(onStart);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onStartRef.current = onStart;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    let cancelled = false;
    const setShown = (n: number) => setProgress({ key, shown: n });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      timer.current = window.setTimeout(() => {
        if (cancelled) return;
        setShown(total);
        onDoneRef.current?.();
      }, 0);
      return () => {
        cancelled = true;
        if (timer.current) window.clearTimeout(timer.current);
      };
    }
    let count = 0;
    let lineIdx = 0;
    let wordIdx = 0;
    const step = () => {
      if (cancelled) return;
      if (count === 0) onStartRef.current?.();
      count += 1;
      setShown(count);
      wordIdx += 1;
      let delay = wordDelay;
      if (wordIdx >= words[lineIdx].length) {
        lineIdx += 1;
        wordIdx = 0;
        delay = lineDelay;
      }
      if (count >= total) {
        timer.current = window.setTimeout(() => { if (!cancelled) onDoneRef.current?.(); }, 200);
        return;
      }
      timer.current = window.setTimeout(step, delay);
    };
    timer.current = window.setTimeout(step, startDelay);
    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
    // Re-run only when the text itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, total, wordDelay, lineDelay, startDelay]);

  const starts = words.reduce<number[]>((acc, ws, i) => [...acc, (acc[i - 1] ?? 0) + (words[i - 1]?.length ?? 0)], []);
  return (
    <div className={clsx(size === "hero" ? "space-y-2" : "space-y-1", align === "center" ? "text-center" : "text-left", className)} aria-live="polite">
      {lines.map((line, i) => {
        const ws = words[i];
        const start = starts[i];
        const visible = Math.max(0, Math.min(ws.length, shown - start));
        if (visible === 0 && shown < start) return <p key={i} className="min-h-[1em]" aria-hidden />;
        return (
          <p
            key={i}
            className={clsx(
              line.emphasis
                ? size === "hero" ? "text-xl font-semibold tracking-tight sm:text-2xl" : "text-base font-semibold tracking-tight"
                : size === "hero" ? "text-sm leading-6 text-[color:var(--text-secondary)] sm:text-base sm:leading-7" : "text-[13px] leading-5 text-[color:var(--text-secondary)]"
            )}
          >
            {ws.map((w, j) => (
              <Word key={j} shown={j < visible}>
                {w}
                {j < ws.length - 1 ? " " : ""}
              </Word>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Word({ shown, children }: { shown: boolean; children: ReactNode }) {
  return (
    <span className={clsx("inline transition-[opacity,transform] duration-300 ease-out", shown ? "opacity-100" : "opacity-0")} style={{ transform: shown ? "none" : "translateY(0.2em)" }}>
      {children}
    </span>
  );
}

/** Convenience: orb state derived from speech progress. */
export function useSpeaking(): { speaking: boolean; onStart: () => void; onDone: () => void } {
  const [speaking, setSpeaking] = useState(false);
  return { speaking, onStart: () => setSpeaking(true), onDone: () => setSpeaking(false) };
}
