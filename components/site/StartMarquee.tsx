"use client";

import dynamic from "next/dynamic";

/**
 * The tilted gallery of real Express section screenshots behind "Start
 * where you are". Decorative: hidden from assistive tech, dimmed under a
 * gradient so the cards read, and only rendered on the client so the order
 * can be shuffled per visit without a hydration mismatch.
 */
const Backdrop = dynamic(() => import("./StartMarqueeBackdrop").then((m) => m.StartMarqueeBackdrop), { ssr: false });

export function StartMarquee({ images }: { images: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <Backdrop images={images} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 78%, transparent) 30%, color-mix(in srgb, var(--bg-primary) 78%, transparent) 70%, var(--bg-primary) 100%)",
        }}
      />
    </div>
  );
}
