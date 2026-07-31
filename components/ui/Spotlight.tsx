"use client";

import type { MouseEvent } from "react";

/**
 * Writes the cursor position into CSS vars on the hovered card. Deliberately
 * mutates the element directly rather than using state, so moving the mouse
 * doesn't re-render the card on every frame. Attach to any element that also
 * renders <SpotlightOverlay />.
 */
export function handleSpotlightMove(event: MouseEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
}

type SpotlightOverlayProps = {
  /** Radius of the light pool in px. */
  radius?: number;
  /** CSS percentage of --accent mixed in. Defaults to the theme-aware token. */
  strength?: string;
};

/**
 * Cursor-following light pool. Drop inside any `relative` card that also has
 * `group/spot` and `onMouseMove={handleSpotlightMove}`.
 *
 * Sits at -z-10 so it paints above the card's own background but beneath its
 * text: a positioned element at z-index 0 would paint over the content. This
 * relies on the card establishing a stacking context, which `.glass` does via
 * backdrop-filter.
 */
export function SpotlightOverlay({
  radius = 380,
  strength = "var(--spot-strength, 16%)",
}: SpotlightOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
      style={{
        borderRadius: "inherit",
        background: `radial-gradient(${radius}px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--accent) ${strength}, transparent), transparent 70%)`,
      }}
    />
  );
}

/**
 * Hairline gradient border for featured cards — catches the light along one
 * edge so a card reads as raised without adding a second colour.
 */
export function GradientEdge({ strength = 45 }: { strength?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        borderRadius: "inherit",
        padding: 1,
        background: `linear-gradient(140deg, color-mix(in srgb, var(--accent) ${strength}%, transparent), transparent 45%)`,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}
