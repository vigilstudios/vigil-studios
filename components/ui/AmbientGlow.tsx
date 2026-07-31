/**
 * Soft radial light field used behind sections to add depth without introducing
 * a second hue. Purely decorative — always render inside a `relative
 * overflow-hidden` parent and position it with the `className` prop.
 */
type AmbientGlowProps = {
  /** Positioning utilities, e.g. "-top-24 -left-32". */
  className?: string;
  /** Diameter in px. */
  size?: number;
  opacity?: number;
  /** CSS percentage of --accent mixed in. Defaults to the theme-aware token. */
  strength?: string;
};

export function AmbientGlow({
  className = "",
  size = 560,
  opacity = 0.3,
  strength = "var(--glow-strength, 60%)",
}: AmbientGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full z-0 ${className}`}
      style={{
        width: size,
        height: size,
        opacity,
        background: `radial-gradient(circle, color-mix(in srgb, var(--accent) ${strength}, transparent) 0%, transparent 70%)`,
        filter: "blur(90px)",
      }}
    />
  );
}
