import type { CSSProperties } from "react";
export type MotionDirection = "none" | "restrained" | "expressive";
export type ArtDirection = {
  id: string; name: string; description: string;
  density: "open" | "balanced" | "dense";
  grid: "editorial" | "strict" | "free";
  alignment: "start" | "center";
  section: string; gutter: string; gap: string; offset: string;
  radius: string; border: string;
  media: { width: string; fit: "cover" | "contain"; position: string; frame: string };
  navHeight: string; action: "block" | "line" | "pill";
  decoration: "minimal" | "graphic";
  motion: MotionDirection;
};
export const artDirections: readonly ArtDirection[] = [
  { id: "gallery", name: "Gallery", description: "Quiet object field, generous margins, rounded media and discreet rules.", density: "open", grid: "editorial", alignment: "start", section: "clamp(3rem, 8cqw, 8rem)", gutter: "5%", gap: "2rem", offset: "3%", radius: "1.7rem", border: "1px", media: { width: "88%", fit: "cover", position: "50% 50%", frame: "0px" }, navHeight: "5.5rem", action: "line", decoration: "minimal", motion: "restrained" },
  { id: "publication", name: "Publication", description: "Unequal columns, long reading rhythm, thin rules and unframed media.", density: "balanced", grid: "editorial", alignment: "start", section: "clamp(3rem, 6cqw, 6rem)", gutter: "4%", gap: "1.5rem", offset: "7%", radius: "0px", border: "1px", media: { width: "92%", fit: "cover", position: "50% 45%", frame: "0px" }, navHeight: "4.5rem", action: "line", decoration: "minimal", motion: "restrained" },
  { id: "precision", name: "Precision", description: "Aligned grid, compact intervals, inset image frames and clear controls.", density: "dense", grid: "strict", alignment: "start", section: "clamp(2rem, 4cqw, 4rem)", gutter: "3%", gap: ".8rem", offset: "0%", radius: ".15rem", border: "1px", media: { width: "100%", fit: "contain", position: "50% 50%", frame: ".6rem" }, navHeight: "3.75rem", action: "block", decoration: "minimal", motion: "none" },
  { id: "billboard", name: "Billboard", description: "Compressed whitespace, hard edges, oversized media and graphic borders.", density: "dense", grid: "free", alignment: "start", section: "clamp(1.5rem, 3cqw, 3rem)", gutter: "2%", gap: ".65rem", offset: "0%", radius: "0px", border: "3px", media: { width: "100%", fit: "cover", position: "50% 40%", frame: "0px" }, navHeight: "3.5rem", action: "block", decoration: "graphic", motion: "expressive" },
  { id: "salon", name: "Salon", description: "Centered conversational moments, soft framing and spacious reading intervals.", density: "open", grid: "strict", alignment: "center", section: "clamp(3rem, 7cqw, 7rem)", gutter: "6%", gap: "2.5rem", offset: "0%", radius: "2.5rem", border: "1px", media: { width: "82%", fit: "cover", position: "50% 50%", frame: ".35rem" }, navHeight: "5rem", action: "pill", decoration: "minimal", motion: "restrained" },
  { id: "runway", name: "Runway", description: "Offset image fields, extreme pauses and a deliberately unequal visual cadence.", density: "open", grid: "free", alignment: "start", section: "clamp(4rem, 10cqw, 10rem)", gutter: "4%", gap: "3rem", offset: "10%", radius: "0px", border: "1px", media: { width: "76%", fit: "cover", position: "50% 30%", frame: "0px" }, navHeight: "6rem", action: "line", decoration: "minimal", motion: "expressive" },
];
export type ArtDirectionId = "gallery" | "publication" | "precision" | "billboard" | "salon" | "runway";
export function getArtDirection(id: string): ArtDirection {
  const direction = artDirections.find((item) => item.id === id);
  if (!direction) throw new Error(`Unknown art direction: ${id}`);
  return direction;
}
export function artDirectionVariables(a: ArtDirection): CSSProperties {
  return { "--de-section-space": a.section, "--de-gutter": a.gutter, "--de-grid-gap": a.gap, "--de-stack": a.gap,
    "--de-art-offset": a.offset, "--de-radius": a.radius, "--de-border-width": a.border,
    "--de-media-width": a.media.width, "--de-media-fit": a.media.fit, "--de-media-position": a.media.position,
    "--de-media-frame": a.media.frame, "--de-nav-height": a.navHeight,
  } as CSSProperties;
}
