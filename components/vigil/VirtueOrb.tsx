import { clsx } from "clsx";
import "./virtue-orb.css";

export type VirtueOrbSize = "sm" | "md" | "lg";
export type VirtueOrbState = "idle" | "working" | "done";

/**
 * Virtue's visual: a glass sphere with a green atmosphere. Pure CSS
 * (layered radial/conic gradients, blur, keyframes) so it costs nothing to
 * render and works in both themes. `idle` breathes, `working` swirls
 * faster, `done` settles into a steady glow. Motion is disabled under
 * `prefers-reduced-motion`.
 *
 * Used for the onboarding guide today; the same component becomes the face
 * of the real Virtue (Growth / Priority) later.
 */
export function VirtueOrb({
  size = "md",
  state = "idle",
  label = "Virtue",
  className,
}: {
  size?: VirtueOrbSize;
  state?: VirtueOrbState;
  /** Accessible name; pass an empty string when purely decorative next to text. */
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={clsx("virtue-orb", `virtue-orb--${size}`, `virtue-orb--${state}`, className)}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-state={state}
    >
      <span className="virtue-orb__atmosphere" />
      <span className="virtue-orb__swirl" />
      <span className="virtue-orb__core" />
      <span className="virtue-orb__rim" />
      <span className="virtue-orb__highlight" />
    </span>
  );
}
